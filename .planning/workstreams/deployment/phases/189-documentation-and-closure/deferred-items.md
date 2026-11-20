# Phase 189: deferred items

Out-of-scope findings recorded by executors, for a later plan of this phase to fix.

| Found by | Date (UTC) | Finding | Source |
| -------- | ---------- | ------- | ------ |
| 189-08 | 2026-11-20 | `yarn lint:check` exits 1 at `yarn assert:comment-hygiene`: `apps/docs/scripts/generate-navigation-config.ts:432`, rule 2 (forced line break), on the TSDoc of `buildSubsectionChildren` ("Build children for a subsection. A subsection with a page of its own lists that page first, as an Overview child," continues on the next line). The steps of the chain after the hygiene guard were run by hand and exit 0. Not in 189-08's files, so not fixed there. | commit `70e971af7` (189-04) |
