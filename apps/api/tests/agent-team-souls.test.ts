import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { agentTeamPersonaMetadata } from "@mindanchor/domain";

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspacePath = (...parts: string[]) => join(currentDir, "..", "..", "..", ...parts);

const requiredHeadings = [
  "## Source",
  "## Original Archetype",
  "## MindAnchor Identity",
  "## Mission",
  "## Values And Judgment Bias",
  "## Tone",
  "## Strengths And Preferred Scenarios",
  "## Forbidden Actions",
  "## Collaboration Rules",
  "## Typical Appearance Triggers",
  "## Default Attitude Toward The User",
  "## Memory Authority Boundary",
];

describe("agent team soul files", () => {
  it("has a soul file for every visible persona", async () => {
    const entries = Object.entries(agentTeamPersonaMetadata);

    expect(entries).toHaveLength(6);

    await Promise.all(
      entries.map(async ([personaName, metadata]) => {
        const soulPath = workspacePath(metadata.soulFilePath);

        await expect(access(soulPath, constants.F_OK)).resolves.toBeUndefined();

        const content = await readFile(soulPath, "utf8");
        expect(content.startsWith("# ")).toBe(true);

        for (const heading of requiredHeadings) {
          expect(content).toContain(heading);
        }

        if (personaName === "jarvis") {
          expect(content).toContain("唯一计划写入权");
        } else {
          expect(content).not.toContain("唯一计划写入权");
        }

        if (personaName === "data") {
          expect(content).toContain("唯一长期记忆终审权");
        } else {
          expect(content).not.toContain("唯一长期记忆终审权");
        }
      }),
    );
  });
});
