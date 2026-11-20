# 189-02 — the two frontend-URL variables (B-03, F-03, H-02)

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `a8ffa1455` before this plan.

## Task 1 — the re-grep, the reader and its four mocks

Command: `git grep -n FRONTEND_URL -- ':!.planning'`

B03_HITS_BEFORE=15
B03_HITS_AT_PLAN_01_BASE=18

The plan pinned 18, the research count. That count was taken before plan 189-01, at
`22e6d0939`. Plan 189-01 removed three of those lines: `render.example.yaml:47` and `:49`, with
the file, and the deployment guide's line 45, with its Render section. The 15 lines left at
execution:

| File | Lines | Kind |
|------|-------|------|
| `apps/frontend/src/lib/utils/constants.ts` | 4, 5 | the only reader |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | 41, 42 | test mock |
| `apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts` | 44, 45 | test mock |
| `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts` | 43, 44 | test mock |
| `apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts` | 36, 37 | test mock |
| `.env.example` | 114, 115 | template (Task 2) |
| `docker-compose.dev.yml` | 17, 18 | root compose (Task 2) |
| `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md` | 97 | docs, rewritten by plan 189-09 |

`git grep -n FRONTEND_URL -- apps/docs packages infra .github tests` finds only the env page line
above. No hit in `packages/`, `infra/`, `.github` or `tests/`. Because `git grep` covers every
tracked file, `.svelte` files are included.

Dynamic reads of the constants object:
`git grep -nE "(publicConstants|constants)\[|\.\.\.(publicConstants|constants)\b|Object\.(keys|entries|values)\((publicConstants|constants)\)" -- apps/frontend/src`
exits 1 with no output. The same pattern under `git grep -nP` also exits 1, so the `\b` blind spot
found by plan 189-01 hides nothing here.

B03_DYNAMIC_READS=0
B03_NON_TEST_READERS=0

Edits: the two entries were deleted from the exported `constants` object in `constants.ts`,
leaving its other entries and comments as they were. The two mock entries were deleted from each
of the four test files. Afterwards `git grep -l FRONTEND_URL -- apps/frontend/src` lists no file.

- `yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth`: 9 files, 255 tests passed
- `yarn workspace @openvaa/frontend typecheck`: 2427 files, 0 errors, 0 warnings

B03_UNIT_EXIT=0
B03_TYPECHECK_EXIT=0
