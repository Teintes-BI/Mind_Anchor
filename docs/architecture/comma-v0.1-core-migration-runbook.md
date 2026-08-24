# Comma v0.1-A Core migration runbook

1. Back up the legacy JSON file and record its path.
2. Run the dry-run first:

   `node scripts/migrate-json-to-core.mjs --input data/mindanchor.json --sqlite data/comma-personal-core.sqlite --dry-run`

3. Review `counts` and `unmapped`. Value profiles, traces, memory, and other unmapped data are never promoted automatically.
4. Apply only after review:

   `node scripts/migrate-json-to-core.mjs --input data/mindanchor.json --sqlite data/comma-personal-core.sqlite --apply`

5. Export the Core profile and compare the imported event/state counts with the dry-run report.
6. If the source hash changes, use a new target SQLite path. The tool never deletes or overwrites the source JSON.
7. To recover, remove the target SQLite file after verifying the source backup, then rerun dry-run and apply.

State assessments are imported as unconfirmed snapshots. Legacy value profiles remain an unmapped report and require a new user-created Life Compass candidate plus explicit confirmation.
