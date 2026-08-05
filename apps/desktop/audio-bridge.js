import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { analyzeEmotionChunk } from "./audio-emotion.js";

const privateHostPattern = /^((10\.)|(192\.168\.)|(172\.(1[6-9]|2\d|3[0-1])\.))/;

export function isPrivateLanAddress(rawAddress) {
  if (!rawAddress) return false;
  const address = rawAddress.replace("::ffff:", "");
  return address === "::1" || address === "127.0.0.1" || privateHostPattern.test(address);
}

export function listPrivateLanHosts(port) {
  const bindings = [];
  const seen = new Set();
  for (const [, addresses] of Object.entries(networkInterfaces())) {
    for (const addressInfo of addresses ?? []) {
      if (addressInfo.family !== "IPv4") continue;
      if (!isPrivateLanAddress(addressInfo.address)) continue;
      if (seen.has(addressInfo.address)) continue;
      seen.add(addressInfo.address);
      bindings.push({
        host: addressInfo.address,
        url: `http://${addressInfo.address}:${port}`,
      });
    }
  }

  if (bindings.length === 0) {
    bindings.push({
      host: "127.0.0.1",
      url: `http://127.0.0.1:${port}`,
    });
  }

  return bindings;
}

const readJson = (filePath, fallback) => {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
};

const writeJson = (filePath, value) => {
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
};

const readRequestJson = async (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });

const respondJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(payload));
};

const sha256Hex = (value) => createHash("sha256").update(value).digest("hex");

export function buildWayfinderAudioEventPayload({ userId, session, body, forwardRawAudio = false }) {
  const consentRef = String(body.consentRef ?? session?.consentRef ?? "");
  if (!consentRef) return null;
  if (session?.consentRef && consentRef !== String(session.consentRef)) return null;

  const startedAt = String(body.startedAt ?? new Date().toISOString());
  const endedAt = String(body.endedAt ?? startedAt);
  const parsedDuration = Date.parse(endedAt) - Date.parse(startedAt);
  return {
    userId,
    sourceDeviceId: String(body.deviceId ?? session?.deviceId ?? "unknown-device"),
    sessionId: String(body.sessionId ?? ""),
    sequence: Number(body.sequence ?? 0),
    startedAt,
    endedAt,
    durationMs: Math.max(1, Number(body.durationMs ?? (Number.isFinite(parsedDuration) ? parsedDuration : 1))),
    encoding: String(body.encoding ?? "audio/pcm16le"),
    checksum: String(body.checksum ?? "audio-checksum-unknown"),
    base64Audio: forwardRawAudio ? String(body.base64Audio ?? "") : "local-only",
    consentRef,
    traceId: String(body.traceId ?? `trace-audio-${body.sessionId ?? "session"}-${body.sequence ?? 0}`),
    ...(typeof body.transcript === "string" ? { transcriptHint: body.transcript } : {}),
  };
}

export function createAudioBridge({
  dataDir,
  apiBaseUrl,
  publishStatus,
  port = Number(process.env.MINDANCHOR_LAN_PORT ?? "43120"),
  modelConfig = {
    mode: process.env.MINDANCHOR_AUDIO_EMOTION_MODE === "openai-compatible" ? "openai-compatible" : "stub",
    baseUrl: process.env.MINDANCHOR_AUDIO_EMOTION_BASE_URL,
    apiKey: process.env.MINDANCHOR_AUDIO_EMOTION_API_KEY,
    modelName: process.env.MINDANCHOR_AUDIO_EMOTION_MODEL ?? "emotion-local",
  },
}) {
  const bridgeDir = join(dataDir, "mobile-audio");
  const stateFile = join(bridgeDir, "bridge-state.json");
  mkdirSync(bridgeDir, { recursive: true });

  const state = readJson(stateFile, {
    pairCode: `${Math.floor(100000 + Math.random() * 900000)}`,
    pairCodeIssuedAt: new Date().toISOString(),
    pairedDevices: [],
    sessions: {},
    receivedChunkCount: 0,
    latestEmotionAssessment: null,
    latestVoiceCandidate: null,
    latestCallEvent: null,
  });

  const persistState = () => writeJson(stateFile, state);
  const hostBindings = () => listPrivateLanHosts(port);

  const postApi = async (path, payload) => {
    const apiToken = process.env.MINDANCHOR_API_TOKEN;
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed for ${path}: ${response.status}`);
    }

    return response.json();
  };

  const getPairedDevice = (deviceId, pairToken) =>
    state.pairedDevices.find((device) => device.deviceId === deviceId && device.pairToken === pairToken) ?? null;

  const recordStatus = (message) => {
    publishStatus(message, getSummary());
  };

  const getSummary = () => ({
    enabled: true,
    port,
    hostBindings: hostBindings(),
    pairCode: state.pairCode,
    pairedDeviceCount: state.pairedDevices.length,
    activeSessionCount: Object.values(state.sessions).filter((session) => session.status === "active").length,
    receivedChunkCount: state.receivedChunkCount,
    latestEmotionAssessment: state.latestEmotionAssessment,
    latestVoiceCandidate: state.latestVoiceCandidate,
    latestCallEvent: state.latestCallEvent,
    latestDevice: state.pairedDevices.at(-1) ?? null,
  });

  const rotatePairCode = () => {
    state.pairCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    state.pairCodeIssuedAt = new Date().toISOString();
    persistState();
    recordStatus("Rotated Android pairing code.");
    return getSummary();
  };

  const server = createServer(async (request, response) => {
    const remoteAddress = request.socket.remoteAddress ?? "";
    if (!isPrivateLanAddress(remoteAddress)) {
      respondJson(response, 403, {
        message: "Only private LAN clients are allowed.",
      });
      return;
    }

    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

    try {
      if (request.method === "POST" && url.pathname === "/local/mobile/pair") {
        const body = await readRequestJson(request);
        if (String(body.pairCode ?? "") !== state.pairCode) {
          respondJson(response, 403, { message: "Invalid pairing code." });
          return;
        }

        const pairToken = randomUUID();
        const pairedDevice = {
          deviceId: String(body.deviceId ?? randomUUID()),
          deviceName: String(body.deviceName ?? "Android device"),
          platformVersion: String(body.platformVersion ?? "unknown"),
          appVersion: String(body.appVersion ?? "0.1.0"),
          pairToken,
          pairedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          desktopHost: hostBindings()[0]?.url ?? `http://127.0.0.1:${port}`,
        };

        state.pairedDevices = state.pairedDevices.filter((device) => device.deviceId !== pairedDevice.deviceId);
        state.pairedDevices.push(pairedDevice);
        persistState();

        await postApi("/mobile/devices/register", {
          userId: "demo-user",
          deviceId: pairedDevice.deviceId,
          deviceName: pairedDevice.deviceName,
          platform: "android",
          appVersion: pairedDevice.appVersion,
          platformVersion: pairedDevice.platformVersion,
          desktopHost: pairedDevice.desktopHost,
          consentAcknowledgedAt: new Date().toISOString(),
        });

        recordStatus(`Paired Android device ${pairedDevice.deviceName}.`);
        respondJson(response, 200, {
          pairToken,
          desktopHost: pairedDevice.desktopHost,
          hostBindings: hostBindings(),
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/local/mobile/audio/sessions") {
        const body = await readRequestJson(request);
        const pairedDevice = getPairedDevice(String(body.deviceId ?? ""), String(body.pairToken ?? ""));
        if (!pairedDevice) {
          respondJson(response, 403, { message: "Unpaired device." });
          return;
        }
        if (!String(body.consentRef ?? "")) {
          respondJson(response, 403, { message: "Wayfinder audio consent is required." });
          return;
        }

        const apiSession = await postApi("/mobile/capture/sessions/start", {
          userId: "demo-user",
          deviceId: pairedDevice.deviceId,
          captureMode: body.captureMode ?? "foreground_microphone_with_call_events",
          sampleRateHz: Number(body.sampleRateHz ?? 16000),
          channels: Number(body.channels ?? 1),
          encoding: body.encoding ?? "audio/pcm16le",
          chunkDurationMs: Number(body.chunkDurationMs ?? 5000),
          rollingBufferSeconds: Number(body.rollingBufferSeconds ?? 3600),
          startedAt: body.startedAt ?? new Date().toISOString(),
        });

        const sessionDir = join(bridgeDir, apiSession.id);
        mkdirSync(sessionDir, { recursive: true });
        state.sessions[apiSession.id] = {
          deviceId: pairedDevice.deviceId,
          status: "active",
          expectedSequence: 0,
          consentRef: String(body.consentRef),
          dir: sessionDir,
        };
        persistState();
        recordStatus(`Started mobile audio session ${apiSession.id}.`);
        respondJson(response, 200, { sessionId: apiSession.id });
        return;
      }

      if (request.method === "POST" && url.pathname === "/local/mobile/audio/chunks") {
        const body = await readRequestJson(request);
        const pairedDevice = getPairedDevice(String(body.deviceId ?? ""), String(body.pairToken ?? ""));
        if (!pairedDevice) {
          respondJson(response, 403, { message: "Unpaired device." });
          return;
        }

        const session = state.sessions[String(body.sessionId ?? "")];
        if (!session) {
          respondJson(response, 404, { message: "Unknown session." });
          return;
        }

        const consentRef = String(body.consentRef ?? session.consentRef ?? "");
        if (!consentRef) {
          respondJson(response, 403, { message: "Wayfinder audio consent is required." });
          return;
        }
        if (session.consentRef && consentRef !== session.consentRef) {
          respondJson(response, 403, { message: "Wayfinder audio consent does not match the session." });
          return;
        }

        const rawBuffer = Buffer.from(String(body.base64Audio ?? ""), "base64");
        const checksum = String(body.checksum ?? sha256Hex(rawBuffer));
        const sequence = Number(body.sequence ?? 0);
        const extension = String(body.encoding ?? "audio/pcm16le") === "audio/wav" ? "wav" : "pcm";
        const filePath = join(session.dir, `chunk-${String(sequence).padStart(6, "0")}.${extension}`);
        await writeFile(filePath, rawBuffer);

        if (sequence > session.expectedSequence) {
          await postApi("/state/signals/batch", {
            events: [
              {
                userId: "demo-user",
                source: "mobile",
                eventType: "audio_stream_disconnected",
                occurredAt: new Date().toISOString(),
                payload: {
                  deviceId: pairedDevice.deviceId,
                  expectedSequence: session.expectedSequence,
                  receivedSequence: sequence,
                },
              },
            ],
          });
        }

        if (body.replayed) {
          await postApi("/state/signals/batch", {
            events: [
              {
                userId: "demo-user",
                source: "mobile",
                eventType: "audio_stream_replayed",
                occurredAt: body.endedAt ?? new Date().toISOString(),
                payload: {
                  deviceId: pairedDevice.deviceId,
                  sessionId: body.sessionId,
                  sequence,
                },
              },
            ],
          });
        }

        const emotionAssessment = await analyzeEmotionChunk({
          userId: "demo-user",
          deviceId: pairedDevice.deviceId,
          sessionId: String(body.sessionId),
          chunkSequence: sequence,
          windowStart: String(body.startedAt),
          windowEnd: String(body.endedAt),
          rms: typeof body.rms === "number" ? body.rms : undefined,
          peak: typeof body.peak === "number" ? body.peak : undefined,
          base64Audio: String(body.base64Audio ?? ""),
          modelConfig,
        });

        const persistedEmotion = await postApi("/emotion/assessments", {
          userId: "demo-user",
          deviceId: pairedDevice.deviceId,
          sessionId: String(body.sessionId),
          chunkSequence: sequence,
          windowStart: String(body.startedAt),
          windowEnd: String(body.endedAt),
          emotionLabel: emotionAssessment.emotionLabel,
          valenceScore: emotionAssessment.valenceScore,
          arousalScore: emotionAssessment.arousalScore,
          stressScore: emotionAssessment.stressScore,
          confidence: emotionAssessment.confidence,
          summary: emotionAssessment.summary,
          modelName: emotionAssessment.modelName,
          source: emotionAssessment.source,
        });

        session.expectedSequence = sequence + 1;
        session.status = body.replayed ? "buffering" : "active";
        state.receivedChunkCount += 1;
        state.latestEmotionAssessment = persistedEmotion;
        let voiceCandidate = null;
        const forwardRawAudio = process.env.MINDANCHOR_WAYFINDER_ASR_REMOTE === "1";
        const candidatePayload = buildWayfinderAudioEventPayload({
          userId: "demo-user",
          session: { ...session, consentRef },
          body,
          forwardRawAudio,
        });
        if (candidatePayload && (candidatePayload.transcriptHint || forwardRawAudio)) {
          try {
            voiceCandidate = await postApi("/wayfinder/audio-events", candidatePayload);
            state.latestVoiceCandidate = voiceCandidate;
          } catch (error) {
            recordStatus(error instanceof Error ? `Wayfinder candidate unavailable: ${error.message}` : "Wayfinder candidate unavailable.");
          }
        }
        pairedDevice.lastSeenAt = new Date().toISOString();
        persistState();
        recordStatus(`Received audio chunk #${sequence} from ${pairedDevice.deviceName}.`);

        respondJson(response, 200, {
          ackSequence: sequence,
          checksum,
          emotionAssessment: persistedEmotion,
          voiceCandidate,
          filePath,
        });
        return;
      }

      if (request.method === "POST" && url.pathname.startsWith("/local/mobile/audio/sessions/") && url.pathname.endsWith("/complete")) {
        const sessionId = url.pathname.split("/")[5];
        const body = await readRequestJson(request);
        const pairedDevice = getPairedDevice(String(body.deviceId ?? ""), String(body.pairToken ?? ""));
        if (!pairedDevice) {
          respondJson(response, 403, { message: "Unpaired device." });
          return;
        }

        const result = await postApi("/mobile/capture/sessions/end", {
          sessionId,
          status: body.status ?? "completed",
          endedAt: body.endedAt ?? new Date().toISOString(),
        });
        if (state.sessions[sessionId]) {
          state.sessions[sessionId].status = body.status ?? "completed";
          persistState();
        }
        recordStatus(`Completed mobile audio session ${sessionId}.`);
        respondJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/local/mobile/call-events") {
        const body = await readRequestJson(request);
        const pairedDevice = getPairedDevice(String(body.deviceId ?? ""), String(body.pairToken ?? ""));
        if (!pairedDevice) {
          respondJson(response, 403, { message: "Unpaired device." });
          return;
        }

        const event = await postApi("/mobile/call-events", {
          userId: "demo-user",
          deviceId: pairedDevice.deviceId,
          direction: body.direction ?? "unknown",
          status: body.status ?? "unknown",
          occurredAt: body.occurredAt ?? new Date().toISOString(),
        });
        state.latestCallEvent = event;
        pairedDevice.lastSeenAt = new Date().toISOString();
        persistState();
        recordStatus(`Relayed call event ${event.status}.`);
        respondJson(response, 200, event);
        return;
      }

      respondJson(response, 404, { message: "Not found." });
    } catch (error) {
      recordStatus(error instanceof Error ? error.message : "Audio bridge error.");
      respondJson(response, 500, {
        message: error instanceof Error ? error.message : "Internal error",
      });
    }
  });

  server.listen(port, "0.0.0.0", () => {
    recordStatus("Android LAN audio bridge is listening.");
  });

  return {
    getSummary,
    rotatePairCode,
    dispose() {
      server.close();
    },
  };
}
