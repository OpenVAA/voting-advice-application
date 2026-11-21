# Phase 178 — where execution paused (2026-10-15)

Paused by the operator to clear context. Resume with `/gsd-execute-phase 178`; it skips the 20 plans that
have a summary and starts at 178-21.

## State

- **Plans 178-01 to 178-20 are complete**, each with a committed summary. Last green full run:
  `tests/e2e-runs/178-e2e/178-20-close-r2` (473 of 473, 119 projects).
- **Plan 178-21 is partly done; it has no summary.** Its executor's session ended on a network error
  (ENOTFOUND), not on a defect.
  - Committed: `9b7b74c9f` test(178-21): every signed-out screen of the entry flow is scanned by axe, in
    both themes. Task 1's verify was being run "as written and as restated" when it stopped
    (`tests/e2e-runs/178-unit/178-21-t1-verify-r2.*`).
  - Gate set `tests/e2e-runs/178-gates/178-21-close`: verdict PASS, not stale at `9b7b74c9f`.
  - Full run `tests/e2e-runs/178-e2e/178-21-close`: **VOID** (exit 8, `VOID-host-suspend.txt`). Not
    evidence either way. Make it again under a new label (`178-21-close-r2`); never delete the void
    directory.
  - The tree was clean (`?? CAND-APP-PLAN.md` only); nothing in flight; port 5273 free.
- **Whoever resumes 178-21** dispatches a fresh executor with the plan, these notes and
  `178-DISPATCH.md`. It reads the committed spec and Task 1's verify logs rather than redoing Task 1,
  re-derives which tasks remain, makes the closing run as `178-21-close-r2`, and writes the summary.
- Tracking: ROADMAP/STATE were updated by the orchestrator after each plan through 178-20
  (`roadmap.update-plan-progress`); 178-21 is not yet marked.

## How the orchestrator ran the chain

- One sequential executor per plan (`gsd-executor`, model opus), prompt as for plans 178-13 to 178-21:
  the dispatch file, the plan, the execution rules, the "for later plans" sections of the summaries
  the plan builds on, the plan's notes from the dispatch file's "After 178-NN" sections.
- After each plan: spot-check the summary and commits, append an "After 178-NN" section to
  `178-DISPATCH.md` with what binds later plans, `roadmap.update-plan-progress 178 178-NN complete`,
  commit DISPATCH/ROADMAP/STATE/state.json together.
- An executor cut off by an API error is resumed with SendMessage from its own transcript when it is
  still addressable; otherwise a fresh one starts from the disk state.

## Open items for the operator, collected during execution

The orchestrator made interim rulings on items 7, 8 and 11 so the chain could go on; each is the
operator's to confirm or overrule at the phase's close.

1. (178-02) P7: password sign-in timing tells no-account / no-password / wrong-password apart at the auth service (6 / 13 / 65 ms). Documented as a residual by 178-23; no fix planned.
2. (178-05) A project that stores no registration-mode matrix honours no candidate/organization invitation; seed.sql's default project stores {}.
3. (178-06) lint and typecheck gate rows do not read the Edge Functions' source (Phase 180's).
4. (178-08) Swedish common.login reads "Registrera dig"; other catalogue oddities listed in 178-06/178-08 summaries. 264+36+6 constructed translations unreviewed.
5. (178-10) commit f7212f546 alone fails svelte-check (fixed by ff7c4d150); history not rewritten.
6. (178-12) a flow has exactly the reserved rows it names (departs from the plan's per-key default).
7. (178-13) adapter-boundary lint allowlist gained an entry for login/email/+page.server.ts — orchestrator let it stand, same form as the old login action; alternative is a shared server module.
8. (178-13) a no-script refused sign-in does not keep the typed address (plan ruling 4 vs UI contract sentence) — built as the plan's ruling.
9. (178-11) main button label is a whole sentence while the password is invalid; N-6/N-7 password-manager checks for a person.
10. (178-14) Not in a browser: first-time user with no contestant grant passing F and terms to "nothing to edit"; saving label, failed-save sentence, focus move, Log Out from F. invitation-landing.spec.ts unchanged though listed. Bank-auth opt-in projects not run until 178-24.
11. (178-15) Finding: the registration guard is a layout load and does not stand over D2's form action, so a post signs in a used code's claimant even with the code mode off or answers locked. Orchestrator ruled: 178-16 makes the action ask the guard too (D-19/D-05). Operator may overrule.
12. (178-15) claimAndRefresh's signature takes a context, not (locals, fetch), because of the adapter-boundary lint; D2 clears the entry flow after applying the redirect, not before.
13. (178-16) The server's code-sign-in operation does not ask the mode matrix or the answers lock (read from source): D2's form action is the only line; a direct call to the Edge Function with a used code and the claimant's password still signs in with the code mode off. Gives nothing password sign-in does not. Not changed.
14. (178-16) Answers-lock E2E case moved to perm-answers-locked.spec.ts (4 -> 5 tests); in a closed project with answers locked the registration addresses are served until 178-18 copies the fourth config value.
15. (178-16) Pre-commit full run was red once (2 failed, 318 did not run) from two test-side causes (emoji in alert text; menu item renamed to "Register"); fixed, rerun green 452/452. login page branch on newUserEmail now unreachable; six message keys without reader, for 178-23.
16. (178-17) Not walked in a browser: a switched-off mode; a true reload of D1/D2 with a code held; a code registered and re-entered in one run; 65 s vs the server's 60 s slot. Auth rate budget: full run peaks at 22 of 30 password sign-ins per five minutes from the host address (headroom 8).
17. (178-18) The a11y wiring gate (scripts/assert-a11y-scan-wiring.mjs) was edited: it now reads entryAxeScan.ts under the same prohibition as contestantAxeScan.ts; said to relax nothing — worth a read. Two expectations changed in Task 1 (journey "submit disabled" soft assertion -> email error after empty press; invitation-landing stranger refused with login.noProfile, not error.403). Two red pre-commit runs from test steps (logout navigation race; /en/ prefix), fixed. Footer placed last in actions vs UI contract sketch. Fixed latent bug: ?errorMessage=constructor handed a function to the translator. Auth peak 23/30. Finnish/Luxembourgish rewordings unreviewed.
18. (178-19) Commit 250e4215b alone turns the journey red (a step read a stale mail from an earlier run's catcher before the new one arrived); fixed by 5ad63f88d, history kept. The old reset page also threw "Cannot call goto(...) on the server" for a visitor with no session (fixed at root by the new server load). Auth peak now 25/30 password sign-ins per five minutes. Executor interrupted once by the account spend limit and resumed.
19. (178-20) Local auth now requires 8-char passwords (old shorter ones still sign in) and sends no mail of its own (no-op hook). Under the hook a change of address gets no confirmation mail — Phase 179 must send it. P6-OTP: the auth OTP endpoint answers 200 for a registered address, 422 otp_disabled for an unknown one (an oracle; todo). Plan 178-02's Task 1 verify no longer holds. Disk floor blocked once; images pruned (other stacks were gone by then).
