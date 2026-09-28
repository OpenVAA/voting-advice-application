# Resume point — v2.15 overnight run, 2026-08-28/29

Written at a deliberate pause so the context could be cleared. **Read this first, then
`OVERNIGHT-RUN-2026-08-28.md` for the per-plan detail.**

## Where things stand

| Phase | Plans | Verified | State |
|---|---|---|---|
| **152** Comment & Naming Hygiene | 15/15 | ✅ passed | complete |
| **154** dev-seed Determinism | 4/4 | ✅ passed | complete |
| **155** Edge Function Hardening | 6/6 | see note | complete; verifier was resumed after a stall |
| **153** Build & Tooling Config | 0/**11** | — | **not started — this is the next action** |

**224 commits** on `integration/ship-12-squash` (measured 2026-08-29 via `git rev-list --count
origin/main..HEAD`; this file previously said 133, which was wrong by ~90 and was repeated downstream).
Working tree clean apart from planning docs.
Disk 149 GiB free. No stray dev servers.

Wave order (operator decision O3): `A: 152` ✅ → `B: 153 · 154 · 155` (153 outstanding) →
`C: 156` → `D: 157` → `E: 158` → `F: 159 · 161` → `G: 163 · 164` → `H: 160`.

## The next action

**Phase 153 — Build & Tooling Config Correctness. Run all eleven plans: 153-01 … 153-11.**

Two plans were added on 2026-08-29 after the pause, both `autonomous: true`, both depending only on
153-01:

- **`153-10` — cross-runtime env pair guards.** Four variables exist twice (`SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_TYPE`, each with a
  `PUBLIC_` twin) and that pair has drifted **twice, both times undetected**. Ships a *static*
  registry guard (derives pairs from source, proves the `.env.example` pairing contract, runs in
  `lint:check` without secrets) and a *runtime* agreement checker (compares values where they
  exist). It deliberately does **not** unify the pairs — see the plan's `<why_not_unify>`.
- **`153-11` — closes the three operator rulings** below and finally settles `REVIEW-HYG-01`/`-02`.

- **`153-02` is pre-answered by operator decision O5** — D-B5 is REVERSED: enforce `engines` via a
  preinstall script, because Yarn 4.13.0 has no `.yarnrc.yml` setting that makes an engine
  mismatch an error, and D-B5's rejection of the preinstall option rested on a false premise.
  **Tell the executor this so it does not re-raise the blocking-human checkpoint and stall.**
- **`153-09` NO LONGER DEFERRED — ruled 2026-08-29 (D1).** Its checkpoint is pre-answered: the E2E
  disposition is **RAN**. It runs the full suite at close and records the counts verbatim; `0 failed`
  and `0 did-not-run` with the preflight confirmed, or the phase does not close. The ruling
  pre-authorises the *branch*, not the *result* — the suite must actually be run, and a "did not run"
  is a FAILURE. The amendment is appended to `153-09-PLAN.md`; pass it to the executor.
- **`153-04` needs no amendment before executing.** At execution time the tree genuinely has 11
  aliases and 816 tests, so the plan is correct as written; the amendment (D2) governs Phase 159
  in wave F and is recorded in `159-CONTEXT.md`.
- **The full plan set is therefore 153-01 … 153-11 — all eleven**, with `153-02` pre-answered by O5
  and `153-09` pre-answered by D1.

Execution is SEQUENTIAL — `workflow.use_worktrees=false`, so one executor at a time on the main
tree regardless of wave grouping. Dispatch `gsd-executor` per plan with the house rules below.

## Decisions waiting on the operator — ALL RULED 2026-08-29

**Nothing is outstanding.** Every item below was ruled in session on 2026-08-29 and recorded in
`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md`. Each ruling names work that has yet to land;
none of them is marked complete.

| # | Ruling | Where the work lives |
|---|---|---|
| **D1** | `153-09` E2E disposition is **RAN** — run the full suite at close, record counts verbatim, `0 failed` and `0 did-not-run` or the phase does not close | amendment appended to `153-09-PLAN.md`; checkpoint pre-answered |
| **D2** | 153-04's `11 aliases` / `816 tests` are **point-in-time gates, not invariants** — 153-04 runs unamended; **Phase 159 may add a 12th alias** and must re-derive both numbers | `159-CONTEXT.md` |
| **D3** | Add **`integration/**`** to the push trigger **and** `workflow_dispatch`; removal condition recorded (the `integration/**` half comes out at merge to `main`) | owned by `163-01`; checkpoint pre-answered in `163-CONTEXT.md`. **Not applied yet** — the first run is a baseline to read, not a regression |
| **D4** | Phase 162 stays **blocking ship**; § K **closed** (K1–K4 ruled) so 162 is plannable — planned when wave F is reached, not ahead of 153 | § K of `v2.15-DISCUSSION-POINTS.md`; ROADMAP 162 `**Plans**` line |
| **D8** | Fix the matcher, not the cells — **DONE**: `milestone.cjs:188` now anchors on the leading status word and **preserves the annotation** | patch mirror + revert-detection: `.planning/tool-patches/milestone-cjs-d8-status-matcher.md` |
| **drift guard** | **Full agreement**: drop the zero-consumer `country` from the frontend, then assert byte-agreement on the whole provider config (`identityMatchProp` AND `extractClaims`) | `158-CONTEXT.md`; WINDOWS 160 now `ruled` |
| ~~D6/D7/D7b~~ | ~~hygiene classes~~ | ✅ ruled earlier; work in `153-11` |

**§ K rulings (Phase 162), in brief:** K1 one rewrite with `has_role`/`can_access_project` shims over
`user_can(scope, uuid, verb)`, **shims deleted in-phase**. K2 the paired assertion, **amended by the
operator: the storage schema must cater to separate read and write permissions** — storage policies
must honour the `verb` argument, and the assertion is **per-verb** (a read-denial and a write-denial
observed separately at the storage level). K3 typed enum-backed columns on `projects`. K4 level-1 is
**editor minus editor-management**, defined in the phase SPEC, then the registration and
nomination-confirmation flows checked against the matrix.

**D5 is not a decision** — it is the list of downstream checkpoints in phases 157–163 that this run
will reach later. They are still live and still need a human when they arrive.

**`REVIEW-HYG-01` and `REVIEW-HYG-02` are still Pending, but no longer blocked.** They were unmet
as literally worded (19 forced line breaks in `apps/**/*.css`; 117 attributed reference-gate
survivors). The three rulings above are now made — `153-11` does the work and re-measures. It must
mark **only** what is genuinely ready; nothing force-marked.

**The rulings are recorded in**
`.planning/phases/152-comment-naming-hygiene-sweep/152-HYGIENE-CLASS-RULING.md`, and WINDOWS
entries **120, 122, 129** now read `ruled` — a status meaning *the question is answered, the work
is not yet done*. They become `fixed` when `153-11` lands, and not before.

## Environment variables — resolved 2026-08-29

The operator added `SITE_URL`, `SMTP_HOST`, `SMTP_PORT` and `SMTP_FROM` to the root `.env`, which
phase 155 made **required** rather than silently defaulted. Nothing further is needed to serve the
Edge Functions locally.

The follow-on question — whether the duplicated cross-runtime variables should be unified — is
answered by `153-10`: **no**, keep the pairs and detect drift instead. The two Supabase pairs are
injected automatically by the Edge runtime (reading the `PUBLIC_` twin would mean configuring what
the platform already provides), and `PUBLIC_` is a **bundling contract** meaning *embedded in client
JS*, not a naming convention — reusing it in a server-only runtime erodes the only browser-safety
signal a reviewer has.

## House rules to pass to every executor

Earned across 25 plans tonight; they are the reason this run found real defects rather than
ticking boxes.

1. **Unsatisfiable criteria are REPORTED and FLIP-TESTED, never engineered around** — but a
   criterion is unsatisfiable only when what it forbids is what the task **requires**. If
   rewording satisfies it without losing meaning, revise instead.
2. **A gate that examines nothing also reports green.** Flip-test both halves. Phase 152 caught a
   scan reporting `bare = 0 … OK` over **40 live violations**.
3. **Trust your own measurement over an inherited number OR an inherited argument.** Corrected
   **25+ times** tonight. Nearly all line numbers written before phase 152 are stale — its sweep
   shortened hundreds of files. **Navigate by symbol and call expression, never by line number.**
4. **Scans lie silently.** `git grep -E` has **no `\b` on this git** — it reported zero
   hard-coded ports repo-wide over a file whose line 10 is `port = 54321`. Use `-P`. A pathspec
   glob like `packages/*/src` matches nothing silently. A `git ls-files` scan cannot see an
   **unstaged** file. **Stage before counting; prove any zero can be non-zero.**
5. **A premise is a property of each FILE, not of the codebase.** Two of three Edge Functions
   contradicted their own plan's threat model about catch-arm behaviour.
6. **COUNT FIRST, THEN WRITE THE COMMIT MESSAGE** — interactive rebase is unavailable on this
   shared branch, so a message is permanent.
7. **`git checkout --` is only a safe flip-test undo if the work is already committed.**
8. **Never bare `git stash`** — the stash stack is shared across worktrees and sessions.
9. **E2E:** decide on your own diff and prove the reasoning — two plans declined on an argument a
   third then disproved. If you run it: `run_in_background: true`, tee to a log, poll every
   60-90 s (a foreground ~11 min run trips the 600 s watchdog and **kills the executor**),
   `yarn db:reset` first, ONE fresh dev server on :5173, check BOTH `lsof -nP -iTCP:5173
   -sTCP:LISTEN` and `docker ps | grep 5173`; `pkill -f 'vite dev'` does **not** match — use
   `pkill -f 'vite.js dev'`. Decode counts from the report payload, not the console tail.
   **A did-not-run test is a FAILURE.**

## Known-good baselines at this point

`build` 14/14 · `test:unit` 25/25 · `lint:check` 22/22 (**8 of 8** guard links) ·
supabase 55/55 · dev-seed 584/50 · comment-hygiene 0 / 1,577 files · **`test:e2e` 150/150,
zero skipped** · opt-in bank-auth **8/8**.

**`yarn db:lint:sql` is PRE-EXISTING RED and cannot be otherwise** — its failing half lints the
live database and reads no working-tree file (three named PL/pgSQL warnings). Never score it as a
regression.

## Recovery notes

- A `gsd-executor` or `gsd-verifier` that stalls at the 600 s watchdog should be **resumed via
  SendMessage, never respawned** — check disk state first. This happened once tonight; the
  verifier had done ~40 minutes of work that a respawn would have discarded.
- A task-notification saying `failed` may fire **after** a plan has already completed. Check the
  commits and SUMMARY on disk before believing it — it happened twice tonight, both spurious.
- Verifiers write `NNN-VERIFICATION.md` but do **not** commit it. Check for untracked
  verification reports and commit them.
