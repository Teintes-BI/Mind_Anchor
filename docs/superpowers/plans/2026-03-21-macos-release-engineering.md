# MindAnchor macOS Release Engineering Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reproducible macOS release pipeline that archives the app, packages a DMG, and supports optional signing/notarization without changing the current V1 product scope.

**Architecture:** Keep `apps/macos` unchanged at the product layer and add a release-engineering layer around it. The new shell scripts own `xcodegen`, `xcodebuild archive`, release staging, DMG creation, and optional signing/notarization hooks. Docs explain both unsigned and signed paths.

**Tech Stack:** XcodeGen, `xcodebuild`, `hdiutil`, Bash, pnpm workspace, Markdown docs.

---

## Chunk 1: Release Script Baseline

### Task 1: Add a failing release-script regression

**Files:**
- Create: `scripts/test-macos-release-scripts.sh`
- Test: `scripts/build-macos-release.sh`

- [ ] **Step 1: Write a shell regression that expects a release script to exist**
- [ ] **Step 2: Run it and confirm failure**
- [ ] **Step 3: Keep the assertions focused on `--help` and `--dry-run`**

### Task 2: Implement archive + DMG pipeline

**Files:**
- Create: `scripts/build-macos-release.sh`
- Modify: `apps/macos/package.json`

- [ ] **Step 1: Add `--help`, `--dry-run`, output-dir, version/build overrides**
- [ ] **Step 2: Implement `xcodegen` + `xcodebuild archive`**
- [ ] **Step 3: Extract the `.app` and build a DMG**
- [ ] **Step 4: Add optional signing/notarization env hooks**
- [ ] **Step 5: Re-run `scripts/test-macos-release-scripts.sh`**

## Chunk 2: Release Docs

### Task 3: Add release runbook

**Files:**
- Create: `docs/macos-release-runbook.md`
- Modify: `README.md`
- Modify: `docs/macos-v1-release-checklist.md`

- [ ] **Step 1: Document unsigned candidate flow**
- [ ] **Step 2: Document signed/notarized flow**
- [ ] **Step 3: Document required env vars and failure modes**
- [ ] **Step 4: Link the runbook from existing docs**

## Chunk 3: Verification

### Task 4: Run the release pipeline end-to-end

**Files:**
- Generated: `dist/macos-release/*`

- [ ] **Step 1: Run the release script in unsigned mode**
- [ ] **Step 2: Confirm archive, app, DMG, and summary exist**
- [ ] **Step 3: Re-run existing macOS build/tests if the script touched app config**
- [ ] **Step 4: Record the release-candidate path in the final handoff**
