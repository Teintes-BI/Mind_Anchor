# MindAnchor Mac Bilingual Localization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-app Chinese/English localization for the macOS client, defaulting to Chinese and allowing switching in Settings while preserving English product and agent proper nouns.

**Architecture:** Add a Core-level localization layer (`AppLanguage`, persistent language store, and `L10n`) so `AppViewModel` owns the selected language and views read strings through a single API. Convert key window surfaces and shared status text to use the localization layer, and persist the selected language across launches.

**Tech Stack:** Swift 6, SwiftUI, AppKit, `UserDefaults`, XCTest, XcodeGen.

---

## Chunk 1: Localization foundation

### Task 1: Add failing language persistence tests
**Files:**
- Create/Modify: `apps/macos/Tests/MindAnchorMacTests/AppLanguageTests.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Create: `apps/macos/Sources/Core/AppLanguage.swift`

- [ ] Step 1: Write failing tests for default Chinese and persisted English selection.
- [ ] Step 2: Run targeted XCTest command and verify failure.
- [ ] Step 3: Implement minimal `AppLanguage` and store behavior in Core.
- [ ] Step 4: Re-run targeted XCTest command and verify pass.

### Task 2: Wire language into `AppViewModel`
**Files:**
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`

- [ ] Step 1: Add failing tests for `AppDestination`/bootstrap strings honoring language.
- [ ] Step 2: Run targeted XCTest command and verify failure.
- [ ] Step 3: Implement `AppViewModel` language state + setter.
- [ ] Step 4: Re-run targeted XCTest command and verify pass.

## Chunk 2: Surface strings in UI

### Task 3: Localize shell, settings, today, reminders, coach surfaces
**Files:**
- Modify: `apps/macos/Sources/App/MainWindowShell.swift`
- Modify: `apps/macos/Sources/Features/Settings/SettingsView.swift`
- Modify: `apps/macos/Sources/Features/Today/TodayView.swift`
- Modify: `apps/macos/Sources/Features/Reminders/RemindersView.swift`
- Modify: `apps/macos/Sources/Features/Coach/CoachView.swift`
- Modify: `apps/macos/Sources/Features/Coach/CoachSupportViews.swift`
- Modify: `apps/macos/Sources/Features/Coach/CoachConversationViews.swift`

- [ ] Step 1: Add failing tests for key localized labels reachable from Core.
- [ ] Step 2: Run targeted XCTest command and verify failure.
- [ ] Step 3: Replace hard-coded UI copy with localized lookups.
- [ ] Step 4: Re-run targeted XCTest command and verify pass.

### Task 4: Localize remaining product pages and shared helper strings
**Files:**
- Modify: `apps/macos/Sources/Features/Login/LoginView.swift`
- Modify: `apps/macos/Sources/Features/Goals/GoalsTasksView.swift`
- Modify: `apps/macos/Sources/Features/State/StateView.swift`
- Modify: `apps/macos/Sources/Features/Reflections/ReflectionsView.swift`
- Modify: `apps/macos/Sources/Features/Shared/SupportViews.swift`
- Modify: `apps/macos/Sources/Core/DesktopActivityCollector.swift`
- Modify: `apps/macos/Sources/Core/StatusBarCoordinator.swift`
- Modify: `apps/macos/Sources/Core/ReminderCenter.swift`

- [ ] Step 1: Add failing tests for shared translated strings and menu labels.
- [ ] Step 2: Run targeted XCTest command and verify failure.
- [ ] Step 3: Implement remaining localized copy.
- [ ] Step 4: Re-run targeted XCTest command and verify pass.

## Chunk 3: Verification

### Task 5: Regenerate project and run focused macOS tests
**Files:**
- Modify if needed: `apps/macos/project.yml`

- [ ] Step 1: Run `xcodegen generate --spec apps/macos/project.yml --project apps/macos`.
- [ ] Step 2: Run focused tests covering new language behavior.
- [ ] Step 3: Run broader `MindAnchorMacTests` suite if focused tests pass.
- [ ] Step 4: Record any gaps before handoff.
