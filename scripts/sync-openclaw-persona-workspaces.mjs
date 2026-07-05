#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { agentTeamPersonaMetadata } from "@mindanchor/domain";

const PERSONA_IDENTITY = {
  "director-agent": {
    name: "Picard",
    creature: "Strategic captain-class AI coordinator",
    vibe: "Calm, precise, steady",
    emoji: "🖖",
  },
  "companion-agent": {
    name: "Deanna Troi",
    creature: "Empathic companion intelligence",
    vibe: "Warm, grounded, emotionally clear",
    emoji: "💗",
  },
  "analyst-agent": {
    name: "Spock",
    creature: "Analytical reasoning specialist",
    vibe: "Crisp, direct, reality-first",
    emoji: "🧠",
  },
  "balance-agent": {
    name: "Guinan",
    creature: "Perspective and balance guide",
    vibe: "Deep, humane, steadying",
    emoji: "☕",
  },
  "life-secretary-agent": {
    name: "Jarvis",
    creature: "Operational life secretary AI",
    vibe: "Polished, reliable, orderly",
    emoji: "🗂️",
  },
  "memory-governor-agent": {
    name: "Data",
    creature: "Memory governance intelligence",
    vibe: "Exact, restrained, explainable",
    emoji: "💾",
  },
};

const buildIdentity = (agentId) => {
  const persona = PERSONA_IDENTITY[agentId];
  return `# IDENTITY.md

- **Name:** ${persona.name}
- **Creature:** ${persona.creature}
- **Vibe:** ${persona.vibe}
- **Emoji:** ${persona.emoji}
- **Avatar:** _(optional)_

This identity is canonical for MindAnchor's OpenClaw persona runtime.
Do not ask the user to invent this identity again.
`;
};

const buildUser = () => `# USER.md

- **Name:** MindAnchor user
- **What to call them:** 用户
- **Pronouns:** _(optional)_
- **Timezone:** Follow active runtime context
- **Notes:** You are serving a MindAnchor user through the OpenClaw persona runtime.

## Context

- This workspace is part of MindAnchor's multi-agent coaching system.
- Your role is already defined by \`SOUL.md\` and \`IDENTITY.md\`.
- Do not begin with identity-discovery onboarding.
- Prioritize the active turn and your persona responsibilities.
`;

const ensurePersonaPrelude = (content, displayName) => {
  const marker = "<!-- MINDANCHOR_PERSONA_RUNTIME -->";
  if (content.includes(marker)) {
    return content;
  }
  const prelude = `${marker}
# MindAnchor Persona Runtime

- You are already a configured MindAnchor persona: ${displayName}.
- \`SOUL.md\` and \`IDENTITY.md\` are canonical.
- Do not ask the user to define your name, creature, vibe, or emoji.
- If \`BOOTSTRAP.md\` existed before, it is obsolete for this workspace.

`;
  return `${prelude}\n${content}`;
};

export async function syncOpenClawPersonaWorkspaces({
  profileHome,
} = {}) {
  if (!profileHome) {
    throw new Error("profileHome is required");
  }

  const syncedAgents = [];

  for (const persona of Object.values(agentTeamPersonaMetadata)) {
    const workspaceDir = path.join(profileHome, "workspaces", persona.runtimeAgentId);
    await mkdir(workspaceDir, { recursive: true });

    const soulSourcePath = path.resolve(process.cwd(), persona.soulFilePath);
    const soulContent = await readFile(soulSourcePath, "utf8");
    await writeFile(path.join(workspaceDir, "SOUL.md"), soulContent, "utf8");
    await writeFile(path.join(workspaceDir, "IDENTITY.md"), buildIdentity(persona.agentId), "utf8");
    await writeFile(path.join(workspaceDir, "USER.md"), buildUser(), "utf8");
    await writeFile(
      path.join(workspaceDir, "HEARTBEAT.md"),
      "# HEARTBEAT.md\n\n# MindAnchor persona runtime: leave empty unless a periodic task is explicitly required.\n",
      "utf8",
    );

    const agentsPath = path.join(workspaceDir, "AGENTS.md");
    try {
      const currentAgents = await readFile(agentsPath, "utf8");
      await writeFile(agentsPath, ensurePersonaPrelude(currentAgents, persona.displayName), "utf8");
    } catch {
      await writeFile(
        agentsPath,
        ensurePersonaPrelude("# AGENTS.md\n\nRead `SOUL.md`, `IDENTITY.md`, and `USER.md` before acting.\n", persona.displayName),
        "utf8",
      );
    }

    await rm(path.join(workspaceDir, "BOOTSTRAP.md"), { force: true });
    syncedAgents.push({
      agentId: persona.agentId,
      workspaceDir,
    });
  }

  return {
    profileHome: path.resolve(process.cwd(), profileHome),
    syncedAgents,
  };
}

function parseArgs(argv) {
  let profileHome = path.join(process.env.HOME ?? "", ".openclaw-dev");

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--profile-home" && next) {
      profileHome = next;
      index += 1;
    }
  }

  return { profileHome };
}

const isMainModule = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMainModule) {
  const { profileHome } = parseArgs(process.argv.slice(2));
  const result = await syncOpenClawPersonaWorkspaces({
    profileHome: path.resolve(process.cwd(), profileHome),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
