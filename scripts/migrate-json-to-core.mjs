import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(new URL("../apps/api/package.json", import.meta.url));
const Database = require("better-sqlite3");

const args = process.argv.slice(2);
const valueFor = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const inputPath = valueFor("--input");
const sqlitePath = valueFor("--sqlite");
const apply = args.includes("--apply");
if (!inputPath || !sqlitePath || args.some((arg) => arg.startsWith("--") && !["--input", "--sqlite", "--apply", "--dry-run"].includes(arg))) {
  console.error("Usage: node scripts/migrate-json-to-core.mjs --input <legacy.json> --sqlite <core.sqlite> [--dry-run|--apply]");
  process.exitCode = 2;
} else {
  const source = await readFile(inputPath, "utf8");
  const sourceSha256 = createHash("sha256").update(source).digest("hex");
  const legacy = JSON.parse(source);
  const events = legacy.wayfinderContextEvents ?? [];
  const assessments = legacy.stateAssessments ?? [];
  const unmapped = {
    wayfinderValueProfiles: (legacy.wayfinderValueProfiles ?? []).length,
    traceLogEvents: (legacy.traceLogEvents ?? []).length,
    memory: ((legacy.memoryCandidates ?? []).length + (legacy.memoryItems ?? []).length),
  };
  const counts = { events: events.length, stateSnapshots: assessments.length };
  let imported = { events: 0, stateSnapshots: 0 };
  let skipped = { events: 0, stateSnapshots: 0 };
  if (apply) {
    await mkdir(dirname(sqlitePath), { recursive: true });
    const db = new Database(sqlitePath);
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    db.exec(`CREATE TABLE IF NOT EXISTS core_import_meta (source_path TEXT PRIMARY KEY, source_sha256 TEXT NOT NULL, imported_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS core_profiles (profile_id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, timezone TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS core_events (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, user_id TEXT NOT NULL, client_event_id TEXT UNIQUE, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, created_at TEXT NOT NULL, source TEXT NOT NULL, payload_json TEXT NOT NULL, payload_text TEXT NOT NULL, privacy_level TEXT NOT NULL, retention_class TEXT NOT NULL, expires_at TEXT, confidence REAL NOT NULL, canonical_hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS core_state_snapshots (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, user_id TEXT NOT NULL, energy REAL NOT NULL, emotion REAL NOT NULL, cognitive_load REAL NOT NULL, mental_noise REAL NOT NULL, focus_readiness REAL NOT NULL, physical_fatigue REAL NOT NULL, recovery_need REAL NOT NULL, source_json TEXT NOT NULL, confidence REAL NOT NULL, user_confirmed INTEGER NOT NULL, revision INTEGER NOT NULL, captured_at TEXT NOT NULL);`);
    const prior = db.prepare("SELECT source_sha256 FROM core_import_meta WHERE source_path = ?").get(inputPath);
    if (prior && prior.source_sha256 !== sourceSha256) throw new Error("source hash changed; use a new target SQLite path");
    if (!prior) {
      const now = new Date().toISOString();
      const userId = legacy.userId ?? events[0]?.userId ?? assessments[0]?.userId ?? "demo-user";
      const profileId = `profile:${userId}`;
      db.prepare("INSERT OR IGNORE INTO core_profiles(profile_id,user_id,timezone,created_at,updated_at) VALUES (?,?,?,?,?)").run(profileId, userId, "UTC", now, now);
      const insertEvent = db.prepare("INSERT OR IGNORE INTO core_events(id,profile_id,user_id,client_event_id,event_type,occurred_at,created_at,source,payload_json,payload_text,privacy_level,retention_class,expires_at,confidence,canonical_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
      for (const item of events) {
        const oldId = item.id ?? `${item.occurredAt}:${item.eventType}`;
        const payload = item.payload ?? item;
        const result = insertEvent.run(`legacy-event-${oldId}`, profileId, userId, `legacy:${oldId}`, "activity", item.occurredAt ?? now, item.createdAt ?? now, "legacy", JSON.stringify(payload), JSON.stringify(payload), "P1", "legacy_import", null, 1, createHash("sha256").update(JSON.stringify(payload)).digest("hex"));
        result.changes ? imported.events++ : skipped.events++;
      }
      const insertState = db.prepare("INSERT OR IGNORE INTO core_state_snapshots(id,profile_id,user_id,energy,emotion,cognitive_load,mental_noise,focus_readiness,physical_fatigue,recovery_need,source_json,confidence,user_confirmed,revision,captured_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
      assessments.forEach((item, index) => {
        const score = (item.energyScore ?? 50);
        const result = insertState.run(`legacy-state-${item.id ?? index}`, profileId, userId, score, item.moodScore ?? 50, 100 - (item.focusScore ?? 50), 50, item.focusScore ?? 50, item.fatigueScore ?? 50, item.recoveryNeed ?? 50, JSON.stringify(["legacy_state_assessment"]), item.confidence ?? 0.5, 0, index + 1, item.createdAt ?? item.windowEnd ?? now);
        result.changes ? imported.stateSnapshots++ : skipped.stateSnapshots++;
      });
      db.prepare("INSERT INTO core_import_meta(source_path,source_sha256,imported_at) VALUES (?,?,?)").run(inputPath, sourceSha256, now);
    }
    db.close();
  }
  console.log(JSON.stringify({ dryRun: !apply, imported, skipped, counts, unmapped, sourceSha256 }));
}
