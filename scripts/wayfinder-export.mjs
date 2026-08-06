import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PRIVATE_KEYS = new Set(["base64Audio", "rawAudio", "rawSamples", "audioBytes", "accessToken", "refreshToken"]);
const COLLECTION_KEYS = [
  "contextEvents",
  "situations",
  "options",
  "decisions",
  "outcomes",
  "consent",
  "healthSnapshots",
  "healthCalibrationRecords",
  "memoryCandidates",
  "memoryItems",
  "auditEvents",
];

const sanitize = (value) => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !PRIVATE_KEYS.has(key)).map(([key, nested]) => [key, sanitize(nested)]));
};

export function buildWayfinderExport(source, { exportedAt = new Date().toISOString() } = {}) {
  const json = sanitize({
    schemaVersion: 1,
    exportedAt,
    userId: source.userId,
    ...Object.fromEntries(COLLECTION_KEYS.map((key) => [key, Array.isArray(source[key]) ? source[key] : []])),
  });
  const lines = [
    "# MindAnchor Wayfinder Export",
    "",
    `- schemaVersion: ${json.schemaVersion}`,
    `- exportedAt: ${json.exportedAt}`,
    `- userId: ${json.userId}`,
    "",
    "## Collections",
    "",
    ...COLLECTION_KEYS.map((key) => `- ${key}: ${json[key].length}`),
    "",
    "## Records",
    "",
    "```json",
    JSON.stringify(json, null, 2),
    "```",
    "",
  ];
  return { json, markdown: lines.join("\n") };
}

export function scopeSourceToUser(source, userId) {
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) throw new Error("--user must be a non-empty user id");
  return {
    ...source,
    userId: normalizedUserId,
    ...Object.fromEntries(
      COLLECTION_KEYS.map((key) => [
        key,
        Array.isArray(source?.[key])
          ? source[key].filter((record) => record?.userId === normalizedUserId)
          : [],
      ]),
    ),
  };
}

const recordsForUser = (value, userId) => {
  if (!Array.isArray(value)) return value;
  return value.filter((item) => item?.userId !== userId);
};

export function deleteUserRecords(records, userId) {
  for (const [key, value] of Object.entries(records)) {
    if (key === userId) {
      delete records[key];
      continue;
    }
    if (Array.isArray(value)) records[key] = recordsForUser(value, userId);
    else if (value && typeof value === "object") deleteUserRecords(value, userId);
  }
  return records;
}

export function verifyDeletion(records, userId) {
  let remaining = 0;
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item?.userId === userId) remaining += 1;
        visit(item);
      }
    } else if (value && typeof value === "object") {
      for (const nested of Object.values(value)) visit(nested);
    }
  };
  visit(records);
  return { deleted: remaining === 0, remaining };
}

export async function deleteUserRecordsAndPersist(records, userId, inputPath) {
  deleteUserRecords(records, userId);
  const deletion = verifyDeletion(records, userId);
  if (!deletion.deleted) return deletion;
  await writeFile(inputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  return deletion;
}

const argumentValue = (args, name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const inputPath = resolve(argumentValue(args, "--input", ""));
  const outputPath = argumentValue(args, "--output", "");
  const format = argumentValue(args, "--format", "json");
  const requestedUserId = argumentValue(args, "--user", "");
  const deleteAfterExport = args.includes("--delete-after-export");
  if (!inputPath) throw new Error("--input is required");
  const source = JSON.parse(await readFile(inputPath, "utf8"));
  const scopedSource = requestedUserId ? scopeSourceToUser(source, requestedUserId) : source;
  const exported = buildWayfinderExport(scopedSource);
  const output = format === "markdown" ? exported.markdown : `${JSON.stringify(exported.json, null, 2)}\n`;
  if (outputPath) await writeFile(resolve(outputPath), output, "utf8");
  process.stdout.write(output);
  if (deleteAfterExport) {
    const deletion = await deleteUserRecordsAndPersist(source, exported.json.userId, inputPath);
    if (!deletion.deleted) process.exitCode = 1;
    process.stderr.write(`${JSON.stringify(deletion)}\n`);
  }
}
