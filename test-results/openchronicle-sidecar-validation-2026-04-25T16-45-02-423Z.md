# OpenChronicle Sidecar Validation

- generatedAt: `2026-04-25T16:45:02.424Z`
- startedAt: `2026-04-25T16:45:02.424Z`
- completedAt: `2026-04-25T16:45:02.502Z`
- durationMs: `78`
- mcpUrl: `http://127.0.0.1:8742/mcp`
- passed: `true`

## Summary

- requiredToolsPresent: `true`
- toolCount: `8`
- requiredToolCount: `3`
- successfulCallCount: `3`
- failedCallCount: `0`

## Tools

- list_memories: **ALWAYS CALL FIRST** on the first personal-context turn of a conversation.

        List all memory files with descriptions + entry counts. Cheap (one SQLite
        query, no file reads), so the cost of calling is essentially zero.

        Call whenever the user asks about themselves, their schedule, preferences,
        or ongoing work — the response tells you which files exist and what they're
        about (e.g. `event-YYYY-MM-DD.md` for a given day's session-level activity
        log; `user-profile.md` for identity; `user-preferences.md` for habits;
        `project-*.md` / `person-*.md` / `org-*.md` for specific entities).

        If you're about to answer from chat history alone when the user has asked
        about themselves, you've skipped this tool. Go back and call it.
        
- read_memory: Read the full contents of ONE memory file the user has on disk.

        Use after `list_memories` / `search` points you at a promising file.
        Entries come back chronological. Supports `since` / `until` (ISO timestamps),
        `tags` (filter by any matching tag), and `tail_n` (most recent N entries only).
        
- search: **ALWAYS CALL** before saying "I don't know" about something with a keyword in it.

        BM25 full-text search across every entry in COMPRESSED memory files.
        This searches the distilled Markdown layer — what the user has decided
        is durable knowledge (preferences, decisions, schedules, project state,
        people, summaries). It does NOT search raw screen content; for keywords
        the user merely typed or read on screen (error messages, code symbols,
        file paths from a doc), use `search_captures` instead, OR call both in
        parallel.

        Returns the top-k matching entries with file path + timestamp.

        Examples:
          search(query="interview")         — find scheduled interviews in memory
          search(query="Alice Q3 roadmap")  — find mentions of that conversation
          search(query="deadline Friday")   — find time-bounded commitments

        `paths` takes GLOB patterns to scope search, e.g. `['event-*.md']` for
        scheduled events only, or `['project-*.md']` for project notes.
        
- recent_activity: **ALWAYS CALL** when the user references "yesterday / last week / earlier / 刚才 / 上周" etc.

        Newest-first cross-file feed of recent memory entries. Best tool for
        open-ended "what's new / what has the user been up to" questions:

          "what happened today?" / "今天做了啥？"
          "what was I doing yesterday afternoon?"
          "anything recent about <topic>?"
          "catch me up on this week"

        Use `since` (ISO timestamp) to limit to entries newer than a point in
        time, and `prefix_filter` (e.g. `['event-', 'project-']`) to scope.
        Without filters, returns the most recent N entries across ALL files.

        If the user's question has any temporal recency dimension, this tool
        runs in constant time and is strictly better than guessing.
        
- read_recent_capture: Hydrate ONE raw screen capture — the actual visible_text, focused
        input value, URL, and (optionally) screenshot from the buffer.

        Use this whenever a compressed memory entry isn't specific enough
        (e.g. an event-daily entry says "edited main.py at 14:30" but you
        need the actual code, or "read article" but you need the text).
        Most event-daily sub_tasks include an inline `raw:
        read_recent_capture(at=..., app_name=...)` breadcrumb — call it
        verbatim. For keyword-driven searches across the whole buffer, prefer
        `search_captures` first; this tool fetches one specific moment.

        Arguments:
          at                      — ISO timestamp ("2026-04-22T14:30") or bare
                                    "HH:MM[:SS]" (today local). Omit for the
                                    newest matching capture.
          app_name                — case-insensitive substring of the app name
                                    (e.g. "Cursor", "Claude", "Chrome").
          window_title_substring  — case-insensitive substring of the window
                                    title (e.g. a filename, tab title).
          include_screenshot      — include the base64 JPEG. Default false —
                                    screenshots are large and rarely needed.
          max_age_minutes         — when `at` is given, only return captures
                                    within this many minutes of `at`. Default 15.

        Returns the matching capture as JSON with `timestamp`, `app_name`,
        `window_title`, `url`, `focused_element.value` (what the user was
        typing), and `visible_text` (~10 k chars of rendered AX text). The buffer
        retention is bounded (see `[capture]` in config); older captures have
        their `screenshot` field stripped but keep text. Returns `null` if
        nothing matches.

        Typical flow: read an event-daily entry, notice `[HH:MM-HH:MM, <app>]`,
        then call this with `at="HH:MM"` and `app_name="<app>"` to see the
        actual content from that moment.
        
- search_captures: **ALWAYS CALL** (usually in parallel with `search`) when the user mentions a keyword they'd have typed or read on screen.

        Keyword search over RAW screen captures (the uncompressed S1 layer).
        PREFER this over `search` when the user mentions a keyword they would
        have *typed* or *read on screen* but that may not have made it into a
        compressed memory entry yet — e.g. "find when I saw the term
        'rate limiter'", "what was that error about pyobjc", "the URL I had
        open about Postgres replication". `search` only sees compressed memory;
        this sees every captured screen. When you're not sure which layer has
        it, call both — they're independent indexes and neither is expensive.

        Returns the top-`limit` matching captures (BM25-ranked) with snippet
        highlighting (matched tokens wrapped in `[...]`). Each hit includes
        `file_stem` — pass that as `at` to `read_recent_capture` to get the
        full visible_text.

        Examples:
          search_captures(query="rate limiter")             — find any time it appeared
          search_captures(query="error", app_name="Cursor") — keyword scoped to one app
          search_captures(query="todo", since="2026-04-22T09:00:00+08:00")

        Arguments:
          query     — free-text keywords. FTS5-tokenized (case-insensitive).
          since     — ISO timestamp lower bound on capture time.
          until     — ISO timestamp upper bound on capture time.
          app_name  — case-insensitive substring on the capturing app name.
          limit     — top-K BM25 hits to return.
        
- current_context: **ALWAYS CALL** for present-tense or ambiguous-pronoun questions about the user's state.

        Two high-value trigger patterns:
          1. Present-tense: *"right now / currently / just now / what am I /
             what's open / 现在 / 刚才 / 我在"* — this is the tool.
          2. Pronoun with no in-conversation antecedent: *"that / this / it /
             the bug / the error / the file / 那个 / 这个 / 这段 / 这个问题"* —
             the user is pointing at their screen, not at chat history.

        Never reply with "I don't have code/context to look at" or ask the user
        to paste something — call this tool first. If it comes back empty,
        then ask. Asking for a paste when this tool would have worked is a
        tool-selection failure.

        Returns a one-shot snapshot of the current screen state — the same kind of
        context you would get if every chat turn began with the user narrating
        their environment. Triggers include:

          - "what am I working on?" / "我在干嘛？"
          - "what's open in front of me?"
          - "is the deploy log still streaming?"
          - "summarize the doc I'm reading"

        Returns three sections:

          recent_captures_headline    : last ~5 captures as compact lines
                                        ([HH:MM] App — Window [Role]) — quick
                                        scan of "what apps + windows are live".
          recent_captures_fulltext    : top ~3 captures deduplicated by
                                        (app, window) carrying the FULL
                                        visible_text and focused_element.value
                                        — the actual content on screen.
          recent_timeline_blocks      : the last ~8 1-minute timeline blocks
                                        (LLM-summarized activity slices) so
                                        you can see how the current moment
                                        was reached.

        For drill-down on any specific capture or moment, call
        `read_recent_capture(at=..., app_name=...)` next.
        
- get_schema: Return the memory organization spec (file naming, what each prefix means).

        Rarely needed at query time. Useful only if you need to reason about WHERE
        a new fact would be stored, or explain to the user how their memory is
        organized. For normal "look up a fact" flows, use `search` / `list_memories`
        directly.
        

## Tool Calls

| tool | ok | summary |
| --- | --- | --- |
| current_context | `true` | {"recent_captures_headline": [{"time": "00:44", "app_name": "Codex", "window_title": "Codex", "focused_role": "", "file_stem": "2026-04-26T00-44-58p08-00"}, {"time": "00:44", "app_… |
| recent_activity | `true` | {"count": 0, "entries": []} |
| list_memories | `true` | {"count": 0, "files": []} |

## Feasibility Conclusion

- 与 MindAnchor 桌面端旁路集成可行性: `可进入 adapter 原型`
- 判断边界：本报告只验证 OpenChronicle MCP sidecar 的本机可达性、工具存在性和基础查询能力；不代表长期采集质量已经合格。

## Error Samples

- 无
