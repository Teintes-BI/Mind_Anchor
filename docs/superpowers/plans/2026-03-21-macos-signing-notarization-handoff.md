# MindAnchor macOS Signing / Notarization Handoff Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final repo-side handoff for Apple signing and notarization so the only remaining gap is the user's external credentials.

**Architecture:** Keep the existing release script intact and add one companion preflight script plus one final operator doc. The preflight script checks local tool availability and env wiring; the doc explains the exact Apple-side setup flow and how it plugs into the release pipeline already in-repo.

**Tech Stack:** Bash, Xcode command line tools, macOS `security`, Markdown docs.

---

## Chunk 1: Signing Preflight

### Task 1: Add a failing regression for signing preflight

**Files:**
- Modify: `scripts/test-macos-release-scripts.sh`
- Create: `scripts/check-macos-signing-prereqs.sh`

- [ ] **Step 1: Extend the release script regression to expect a signing-preflight script**
- [ ] **Step 2: Run the regression and confirm it fails**
- [ ] **Step 3: Keep the first assertion narrow: `--help` and `--report-only` output**

### Task 2: Implement signing preflight

**Files:**
- Create: `scripts/check-macos-signing-prereqs.sh`
- Modify: `package.json`

- [ ] **Step 1: Add `--help`, `--report-only`, `--strict`**
- [ ] **Step 2: Check local tools and required env variable presence**
- [ ] **Step 3: Print actionable next steps**
- [ ] **Step 4: Re-run `scripts/test-macos-release-scripts.sh`**

## Chunk 2: Final Operator Docs

### Task 3: Add final Apple-credential setup guide

**Files:**
- Create: `docs/macos-apple-signing-final-steps.md`
- Modify: `docs/macos-release-runbook.md`
- Modify: `docs/macos-v1-release-checklist.md`
- Modify: `README.md`
- Modify: `docs/local-development.md`

- [ ] **Step 1: Document required Apple-side artifacts**
- [ ] **Step 2: Document env vars used by `scripts/build-macos-release.sh`**
- [ ] **Step 3: Link the new doc from existing release docs**
- [ ] **Step 4: Run the new signing-preflight script in report mode**
