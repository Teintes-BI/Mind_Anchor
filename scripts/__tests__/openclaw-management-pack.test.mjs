import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  agentTeamPersonaMetadata,
  buildOpenClawManagementAgentDescriptor,
  openClawManagementAgentDescriptorSchema,
  openClawManagementProfileKeySchema,
} from "../../packages/domain/dist/index.js";
import {
  buildOpenClawManagementRegistry,
  openClawManagementRegistry,
} from "../../openclaw/management/agent-management-registry.mjs";
import {
  writeOpenClawManagementPack,
} from "../export-openclaw-management-pack.mjs";
import { buildOpenClawManagementPack } from "../../openclaw/management/agent-management-pack.mjs";
import {
  applyOpenClawManagementPack,
  buildOpenClawManagementApplyPlan,
  writeOpenClawManagementApplyReport,
} from "../apply-openclaw-management-pack.mjs";
import {
  buildOpenClawManagementDoctorReport,
  normalizeOpenClawManagedAgentsInput,
} from "../../openclaw/management/agent-management-doctor.mjs";
import { readOpenClawManagedAgentsFromProfile } from "../../openclaw/management/actual-managed-agents.mjs";
import { writeOpenClawManagementDoctorReport } from "../doctor-openclaw-management-pack.mjs";
import { writeOpenClawManagementProfileAlignmentReport } from "../run-openclaw-management-alignment.mjs";
import { syncOpenClawPersonaWorkspaces } from "../sync-openclaw-persona-workspaces.mjs";

test("domain exports a management profile key schema", () => {
  assert.equal(openClawManagementProfileKeySchema.safeParse("openclaw-dev").success, true);
  assert.equal(openClawManagementProfileKeySchema.safeParse("").success, false);
});

test("domain exports one canonical management descriptor per persona agent", () => {
  const expectedEntries = Object.values(agentTeamPersonaMetadata);

  for (const persona of expectedEntries) {
    const parsed = openClawManagementAgentDescriptorSchema.safeParse({
      agentId: persona.agentId,
      runtimeAgentId: persona.runtimeAgentId,
      displayName: persona.displayName,
      soulFilePath: persona.soulFilePath,
      managementProfileKey: "openclaw-dev",
      managementWorkspaceName: persona.runtimeAgentId,
      capabilities: {
        canFront: persona.canFront,
        canConsult: persona.canConsult,
        canWritePlans: persona.canWritePlans,
        canGovernMemory: persona.canGovernMemory,
      },
      supportedWorkflows: ["coach_front_state"],
    });

    assert.equal(parsed.success, true, `expected descriptor for ${persona.displayName} to parse`);
  }
});

test("repo exports one canonical management descriptor per persona agent", () => {
  assert.equal(openClawManagementRegistry.length, Object.keys(agentTeamPersonaMetadata).length);
});

test("management registry reuses persona identity and capability fields", () => {
  const registry = buildOpenClawManagementRegistry({ managementProfileKey: "openclaw-dev" });
  assert.ok(Array.isArray(registry));

  const expectedEntries = Object.entries(agentTeamPersonaMetadata);
  assert.equal(registry.length, expectedEntries.length);

  for (const [personaKey, persona] of expectedEntries) {
    const expectedDescriptor = buildOpenClawManagementAgentDescriptor({
      personaKey,
      managementProfileKey: "openclaw-dev",
    });
    const actualDescriptor = registry.find((entry) => entry.agentId === persona.agentId);
    assert.deepEqual(actualDescriptor?.agentId, expectedDescriptor.agentId);
    assert.deepEqual(actualDescriptor?.runtimeAgentId, expectedDescriptor.runtimeAgentId);
    assert.deepEqual(actualDescriptor?.soulFilePath, expectedDescriptor.soulFilePath);
    assert.deepEqual(actualDescriptor?.capabilities, expectedDescriptor.capabilities);
  }
});

test("export script builds a deterministic management pack", () => {
  const pack = buildOpenClawManagementPack({ managementProfileKey: "openclaw-dev" });

  assert.equal(pack.schemaVersion, 1);
  assert.equal(pack.managementProfileKey, "openclaw-dev");
  assert.equal(pack.agents.length, Object.keys(agentTeamPersonaMetadata).length);
  assert.equal(typeof pack.generatedAt, "string");
  assert.deepEqual(
    pack.agents.map((agent) => agent.displayName),
    Object.values(agentTeamPersonaMetadata).map((persona) => persona.displayName),
  );
});

test("export script writes a JSON management pack to disk", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-pack-"));
  const outputPath = path.join(tempDir, "management-pack.json");

  try {
    await writeOpenClawManagementPack({
      outputPath,
      managementProfileKey: "openclaw-dev",
      generatedAt: "2026-03-28T00:00:00.000Z",
    });

    const raw = await readFile(outputPath, "utf8");
    const parsed = JSON.parse(raw);

    assert.equal(parsed.schemaVersion, 1);
    assert.equal(parsed.managementProfileKey, "openclaw-dev");
    assert.equal(parsed.generatedAt, "2026-03-28T00:00:00.000Z");
    assert.equal(parsed.agents.length, Object.keys(agentTeamPersonaMetadata).length);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("apply script builds a dry-run plan from an exported pack", () => {
  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  const plan = buildOpenClawManagementApplyPlan({
    pack,
    targetProfileKey: "openclaw-dev",
    dryRun: true,
  });

  assert.equal(plan.dryRun, true);
  assert.equal(plan.targetProfileKey, "openclaw-dev");
  assert.equal(plan.agentPlans.length, Object.keys(agentTeamPersonaMetadata).length);
  assert.equal(plan.agentPlans.every((entry) => entry.action === "would_create"), true);
});

test("apply script writes a dry-run report without mutating state", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-apply-"));
  const outputPath = path.join(tempDir, "apply-report.json");
  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  try {
    const result = await writeOpenClawManagementApplyReport({
      pack,
      outputPath,
      targetProfileKey: "openclaw-dev",
      dryRun: true,
    });

    const raw = await readFile(outputPath, "utf8");
    const parsed = JSON.parse(raw);

    assert.equal(result.outputPath, outputPath);
    assert.equal(parsed.dryRun, true);
    assert.equal(parsed.targetProfileKey, "openclaw-dev");
    assert.equal(parsed.agentPlans.length, Object.keys(agentTeamPersonaMetadata).length);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("real apply creates missing agent entries and auth/workspace artifacts without overwriting existing mismatches", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-profile-"));
  const profileHome = path.join(tempDir, "openclaw-dev");
  const mainAgentDir = path.join(profileHome, "agents", "main", "agent");
  const mainWorkspaceDir = path.join(profileHome, "workspaces", "main");
  const configPath = path.join(profileHome, "openclaw.json");

  await mkdir(mainAgentDir, { recursive: true });
  await mkdir(mainWorkspaceDir, { recursive: true });
  await writeFile(
    path.join(mainAgentDir, "auth-profiles.json"),
    JSON.stringify({ version: 1, profiles: { "codex:manual": { type: "token", provider: "codex", token: "test-key" } } }),
    "utf8",
  );
  await writeFile(
    configPath,
    JSON.stringify({
      agents: {
        defaults: {
          model: { primary: "codex/gpt-5.4@codex:manual", fallbacks: [] },
        },
        list: [
          {
            id: "director-agent",
            name: "director-agent",
            workspace: "/unexpected/workspace",
            agentDir: "/unexpected/agent",
            model: "codex/gpt-4.1@codex:manual",
          },
        ],
      },
    }),
    "utf8",
  );

  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  try {
    const result = await applyOpenClawManagementPack({
      pack,
      targetProfileKey: "openclaw-dev",
      dryRun: false,
      profileHome,
    });

    const updatedConfig = JSON.parse(await readFile(configPath, "utf8"));
    const createdAgentEntry = updatedConfig.agents.list.find((entry) => entry.id === "companion-agent");
    const existingDirectorEntry = updatedConfig.agents.list.find((entry) => entry.id === "director-agent");
    const copiedAuth = JSON.parse(
      await readFile(path.join(profileHome, "agents", "companion-agent", "agent", "auth-profiles.json"), "utf8"),
    );

    assert.equal(result.dryRun, false);
    assert.equal(result.agentPlans.some((entry) => entry.action === "created"), true);
    assert.equal(result.agentPlans.some((entry) => entry.action === "blocked_update"), true);
    assert.ok(createdAgentEntry);
    assert.equal(createdAgentEntry.workspace, path.join(profileHome, "workspaces", "troi-runtime-agent"));
    assert.equal(existingDirectorEntry.workspace, "/unexpected/workspace");
    assert.equal(copiedAuth.profiles["codex:manual"].token, "test-key");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("real apply safely updates workspace and agentDir when only path fields drift", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-safe-update-"));
  const profileHome = path.join(tempDir, "openclaw-dev");
  const mainAgentDir = path.join(profileHome, "agents", "main", "agent");
  const mainWorkspaceDir = path.join(profileHome, "workspaces", "main");
  const configPath = path.join(profileHome, "openclaw.json");

  await mkdir(mainAgentDir, { recursive: true });
  await mkdir(mainWorkspaceDir, { recursive: true });
  await writeFile(
    path.join(mainAgentDir, "auth-profiles.json"),
    JSON.stringify({ version: 1, profiles: { "codex:manual": { type: "token", provider: "codex", token: "test-key" } } }),
    "utf8",
  );
  await writeFile(
    configPath,
    JSON.stringify({
      agents: {
        defaults: {
          model: { primary: "codex/gpt-5.4@codex:manual", fallbacks: [] },
        },
        list: [
          {
            id: "companion-agent",
            name: "companion-agent",
            workspace: "/old/workspace",
            agentDir: "/old/agent",
            model: "codex/gpt-5.4@codex:manual",
          },
        ],
      },
    }),
    "utf8",
  );

  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  try {
    const result = await applyOpenClawManagementPack({
      pack,
      targetProfileKey: "openclaw-dev",
      dryRun: false,
      profileHome,
    });

    const updatedConfig = JSON.parse(await readFile(configPath, "utf8"));
    const updatedEntry = updatedConfig.agents.list.find((entry) => entry.id === "companion-agent");

    assert.equal(result.agentPlans.some((entry) => entry.agentId === "companion-agent" && entry.action === "updated_safe_fields"), true);
    assert.equal(updatedEntry.workspace, path.join(profileHome, "workspaces", "troi-runtime-agent"));
    assert.equal(updatedEntry.agentDir, path.join(profileHome, "agents", "companion-agent", "agent"));
    assert.equal(updatedEntry.model, "codex/gpt-5.4@codex:manual");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("real apply updates model only when explicitly confirmed", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-confirmed-update-"));
  const profileHome = path.join(tempDir, "openclaw-dev");
  const mainAgentDir = path.join(profileHome, "agents", "main", "agent");
  const mainWorkspaceDir = path.join(profileHome, "workspaces", "main");
  const configPath = path.join(profileHome, "openclaw.json");

  await mkdir(mainAgentDir, { recursive: true });
  await mkdir(mainWorkspaceDir, { recursive: true });
  await writeFile(
    path.join(mainAgentDir, "auth-profiles.json"),
    JSON.stringify({ version: 1, profiles: { "codex:manual": { type: "token", provider: "codex", token: "test-key" } } }),
    "utf8",
  );
  await writeFile(
    configPath,
    JSON.stringify({
      agents: {
        defaults: {
          model: { primary: "codex/gpt-5.4@codex:manual", fallbacks: [] },
        },
        list: [
          {
            id: "companion-agent",
            name: "companion-agent",
            workspace: path.join(profileHome, "workspaces", "troi-runtime-agent"),
            agentDir: path.join(profileHome, "agents", "companion-agent", "agent"),
            model: "codex/gpt-4.1@codex:manual",
          },
        ],
      },
    }),
    "utf8",
  );

  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  try {
    const blockedResult = await applyOpenClawManagementPack({
      pack,
      targetProfileKey: "openclaw-dev",
      dryRun: false,
      profileHome,
    });
    const blockedConfig = JSON.parse(await readFile(configPath, "utf8"));
    const blockedEntry = blockedConfig.agents.list.find((entry) => entry.id === "companion-agent");

    assert.equal(blockedResult.agentPlans.some((entry) => entry.agentId === "companion-agent" && entry.action === "blocked_update"), true);
    assert.equal(blockedEntry.model, "codex/gpt-4.1@codex:manual");

    const confirmedResult = await applyOpenClawManagementPack({
      pack,
      targetProfileKey: "openclaw-dev",
      dryRun: false,
      profileHome,
      confirmedFields: ["model"],
    });
    const confirmedConfig = JSON.parse(await readFile(configPath, "utf8"));
    const confirmedEntry = confirmedConfig.agents.list.find((entry) => entry.id === "companion-agent");

    assert.equal(
      confirmedResult.agentPlans.some((entry) => entry.agentId === "companion-agent" && entry.action === "updated_confirmed_fields"),
      true,
    );
    assert.equal(confirmedEntry.model, "codex/gpt-5.4@codex:manual");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("doctor script reports aligned when actual managed agents match the exported pack", () => {
  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  const report = buildOpenClawManagementDoctorReport({
    pack,
    actualManagedAgents: pack.agents,
    targetProfileKey: "openclaw-dev",
  });

  assert.equal(report.aligned, true);
  assert.deepEqual(report.missingAgents, []);
  assert.deepEqual(report.extraAgents, []);
  assert.deepEqual(report.fieldMismatches, []);
});

test("doctor script reports missing and extra agents when actual managed agents drift", () => {
  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  const actualManagedAgents = [...pack.agents.slice(1), {
    agentId: "extra-agent",
    runtimeAgentId: "extra-runtime-agent",
    displayName: "Extra",
    soulFilePath: "openclaw/souls/extra.md",
    managementProfileKey: "openclaw-dev",
    managementWorkspaceName: "extra-runtime-agent",
    capabilities: {
      canFront: false,
      canConsult: false,
      canWritePlans: false,
      canGovernMemory: false,
    },
    supportedWorkflows: ["coach_front_state"],
  }];

  const report = buildOpenClawManagementDoctorReport({
    pack,
    actualManagedAgents,
    targetProfileKey: "openclaw-dev",
  });

  assert.equal(report.aligned, false);
  assert.deepEqual(report.missingAgents, [pack.agents[0].agentId]);
  assert.deepEqual(report.extraAgents, ["extra-agent"]);
});

test("doctor script treats legacy extra agents as non-blocking when all expected persona agents are present", () => {
  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  const actualManagedAgents = [
    ...pack.agents,
    {
      agentId: "chief-agent",
      runtimeAgentId: "chief-agent",
      displayName: "Chief Agent",
      soulFilePath: "openclaw/souls/unmanaged/chief-agent.md",
      managementProfileKey: "openclaw-dev",
      managementWorkspaceName: "chief-agent",
      capabilities: {
        canFront: false,
        canConsult: false,
        canWritePlans: false,
        canGovernMemory: false,
      },
      supportedWorkflows: [],
    },
  ];

  const report = buildOpenClawManagementDoctorReport({
    pack,
    actualManagedAgents,
    targetProfileKey: "openclaw-dev",
  });

  assert.equal(report.aligned, true);
  assert.deepEqual(report.missingAgents, []);
  assert.deepEqual(report.extraAgents, ["chief-agent"]);
  assert.deepEqual(report.fieldMismatches, []);
});

test("doctor script writes a JSON report to disk", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-doctor-"));
  const outputPath = path.join(tempDir, "doctor-report.json");
  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  try {
    const result = await writeOpenClawManagementDoctorReport({
      pack,
      actualManagedAgents: pack.agents,
      outputPath,
      targetProfileKey: "openclaw-dev",
    });

    const raw = await readFile(outputPath, "utf8");
    const parsed = JSON.parse(raw);

    assert.equal(result.outputPath, outputPath);
    assert.equal(parsed.aligned, true);
    assert.equal(parsed.targetProfileKey, "openclaw-dev");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("doctor script accepts a pack-shaped object as actual managed agent input", () => {
  const pack = buildOpenClawManagementPack({
    managementProfileKey: "openclaw-dev",
    generatedAt: "2026-03-28T00:00:00.000Z",
  });

  const normalized = normalizeOpenClawManagedAgentsInput(pack);

  assert.ok(Array.isArray(normalized));
  assert.equal(normalized.length, pack.agents.length);
});

test("reads actual managed agents from a real OpenClaw profile home", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-actual-profile-"));
  const profileHome = path.join(tempDir, "openclaw-dev");
  const configPath = path.join(profileHome, "openclaw.json");

  await mkdir(profileHome, { recursive: true });
  await writeFile(
    configPath,
    JSON.stringify({
      agents: {
        list: [
          {
            id: "director-agent",
            name: "Director Agent",
            workspace: path.join(profileHome, "workspaces", "picard-runtime-agent"),
            agentDir: path.join(profileHome, "agents", "director-agent", "agent"),
            model: "codex/gpt-5.4@codex:manual",
          },
          {
            id: "companion-agent",
            name: "Companion Agent",
            workspace: path.join(profileHome, "workspaces", "troi-runtime-agent"),
            agentDir: path.join(profileHome, "agents", "companion-agent", "agent"),
            model: "codex/gpt-5.4@codex:manual",
          },
        ],
      },
    }),
    "utf8",
  );

  try {
    const actualManagedAgents = await readOpenClawManagedAgentsFromProfile({
      profileHome,
      managementProfileKey: "openclaw-dev",
    });

    assert.equal(actualManagedAgents.length, 2);
    assert.deepEqual(actualManagedAgents[0], {
      ...buildOpenClawManagementPack({ managementProfileKey: "openclaw-dev" }).agents.find((agent) => agent.agentId === "director-agent"),
      managementWorkspaceName: "picard-runtime-agent",
    });
    assert.equal(actualManagedAgents[1].agentId, "companion-agent");
    assert.equal(actualManagedAgents[1].managementWorkspaceName, "troi-runtime-agent");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("writes a real profile alignment report from profile home", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-alignment-report-"));
  const profileHome = path.join(tempDir, "openclaw-dev");
  const configPath = path.join(profileHome, "openclaw.json");
  const packOutputPath = path.join(tempDir, "management-pack.json");
  const reportOutputPath = path.join(tempDir, "management-alignment-report.json");

  await mkdir(profileHome, { recursive: true });
  await writeFile(
    configPath,
    JSON.stringify({
      agents: {
        list: buildOpenClawManagementPack({
          managementProfileKey: "openclaw-dev",
          generatedAt: "2026-03-28T00:00:00.000Z",
        }).agents.map((agent) => ({
          id: agent.agentId,
          name: agent.agentId,
          workspace: path.join(profileHome, "workspaces", agent.managementWorkspaceName),
          agentDir: path.join(profileHome, "agents", agent.agentId, "agent"),
          model: "codex/gpt-5.4@codex:manual",
        })),
      },
    }),
    "utf8",
  );

  try {
    const result = await writeOpenClawManagementProfileAlignmentReport({
      profileHome,
      managementProfileKey: "openclaw-dev",
      packOutputPath,
      reportOutputPath,
      generatedAt: "2026-03-28T00:00:00.000Z",
    });

    const pack = JSON.parse(await readFile(packOutputPath, "utf8"));
    const report = JSON.parse(await readFile(reportOutputPath, "utf8"));

    assert.equal(result.packOutputPath, packOutputPath);
    assert.equal(result.reportOutputPath, reportOutputPath);
    assert.equal(pack.managementProfileKey, "openclaw-dev");
    assert.equal(report.aligned, true);
    assert.equal(report.actualAgentCount, 6);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("syncs official OpenClaw persona workspaces with MindAnchor soul bundle", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-openclaw-workspace-sync-"));
  const profileHome = path.join(tempDir, "openclaw-dev");
  const picardWorkspace = path.join(profileHome, "workspaces", "picard-runtime-agent");
  const configPath = path.join(profileHome, "openclaw.json");

  await mkdir(picardWorkspace, { recursive: true });
  await writeFile(path.join(picardWorkspace, "SOUL.md"), "# old soul\n", "utf8");
  await writeFile(path.join(picardWorkspace, "IDENTITY.md"), "# old identity\n", "utf8");
  await writeFile(path.join(picardWorkspace, "USER.md"), "# old user\n", "utf8");
  await writeFile(path.join(picardWorkspace, "BOOTSTRAP.md"), "# should be removed\n", "utf8");
  await writeFile(
    configPath,
    JSON.stringify({
      agents: {
        list: buildOpenClawManagementPack({
          managementProfileKey: "openclaw-dev",
          generatedAt: "2026-03-28T00:00:00.000Z",
        }).agents.map((agent) => ({
          id: agent.agentId,
          name: agent.displayName,
          workspace: path.join(profileHome, "workspaces", agent.managementWorkspaceName),
          agentDir: path.join(profileHome, "agents", agent.agentId, "agent"),
          model: "codex/gpt-5.4@codex:manual",
        })),
        defaults: {
          model: { primary: "codex/gpt-5.4@codex:manual", fallbacks: [] },
        },
      },
    }),
    "utf8",
  );

  try {
    const result = await syncOpenClawPersonaWorkspaces({
      profileHome,
      managementProfileKey: "openclaw-dev",
    });

    const soul = await readFile(path.join(picardWorkspace, "SOUL.md"), "utf8");
    const identity = await readFile(path.join(picardWorkspace, "IDENTITY.md"), "utf8");
    const user = await readFile(path.join(picardWorkspace, "USER.md"), "utf8");
    let bootstrapExists = true;
    try {
      await readFile(path.join(picardWorkspace, "BOOTSTRAP.md"), "utf8");
    } catch {
      bootstrapExists = false;
    }

    assert.equal(result.syncedAgents.length, 6);
    assert.equal(soul.includes("# Picard"), true);
    assert.equal(identity.includes("Picard"), true);
    assert.equal(user.includes("MindAnchor"), true);
    assert.equal(bootstrapExists, false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
