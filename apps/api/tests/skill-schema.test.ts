import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schemaPath = (...parts: string[]) => join(process.cwd(), "..", "..", "openclaw", "skills", ...parts);

describe("OpenClaw skill schemas", () => {
  it("validates signal ingestion payloads", async () => {
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const schema = JSON.parse(await readFile(schemaPath("state-ingest-skill.schema.json"), "utf8"));
    const validate = ajv.compile(schema);

    const valid = validate({
      events: [
        {
          userId: "demo-user",
          source: "desktop",
          eventType: "idle",
          occurredAt: new Date().toISOString(),
          payload: {
            idleSeconds: 180,
          },
        },
      ],
    });

    expect(valid).toBe(true);
  });

  it("validates notification payloads", async () => {
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const schema = JSON.parse(await readFile(schemaPath("notification-skill.schema.json"), "utf8"));
    const validate = ajv.compile(schema);

    const valid = validate({
      userId: "demo-user",
      title: "Recovery reminder",
      message: "Resume the task with a 15-minute block.",
      channel: "mobile_push",
    });

    expect(valid).toBe(true);
  });
});
