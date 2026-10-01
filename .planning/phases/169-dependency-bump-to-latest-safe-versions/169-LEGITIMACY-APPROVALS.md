# Phase 169 — Package Legitimacy Approvals (operator checkbox doc)

**Why this file exists.** The package-legitimacy gate requires a human to confirm a package that is
new to the repository before an agent installs it. D-32 and the orchestrator's ruling 11 keep every
plan except the Kit 3 plan autonomous, so the confirmation is collected **here, once, before
execution**, in the same one-pass checkbox form the operator used for the 166–169 discussion.

**How the plans use it.** The install task in each named plan carries a `<precondition>` that reads
this file. A ticked box (`[x]`) lets the plan proceed. An unticked box makes the executor stop with a
blocking human checkpoint (an unmet precondition is never auto-approved). Packages that already sit
in `yarn.lock` are not listed: their only research flag was "too new", which the 7-day age gate
removes by construction, and each plan re-runs the legitimacy check at execution and halts on any
other signal.

Tick a box to approve. Write `**NOTE:**` under an item to attach a condition.

---

## A. `eslint-plugin-import-x` and its native resolver (plan 169-03, D-17)

New to the repository. Replaces `eslint-plugin-import`, whose peer range stops at ESLint 9.

| Package | Registry | Source | Research verdict |
|---|---|---|---|
| `eslint-plugin-import-x` | https://www.npmjs.com/package/eslint-plugin-import-x | github.com/un-ts/eslint-plugin-import-x | OK (7.9M weekly downloads) |
| `unrs-resolver` (transitive) | https://www.npmjs.com/package/unrs-resolver | github.com/unrs/unrs-resolver | runs `postinstall: node postinstall.js` (checks for the native binding; may fetch the platform binding from the npm registry) |
| `@unrs/resolver-binding-<platform>` (transitive, optional) | https://www.npmjs.com/search?q=%40unrs%2Fresolver-binding | github.com/unrs/unrs-resolver | platform binaries |

- [ ] **Approved:** install `eslint-plugin-import-x` (latest version at least 7 days old) and let
  `unrs-resolver`'s postinstall run. 169-03 prints the postinstall script into `169-EVIDENCE.md`
  before the install commit.

## B. Supabase CLI platform packages (plan 169-06, D-10)

The `supabase` npm package has shipped the CLI as per-platform `optionalDependencies` since 2.100
(no postinstall, no `tar`). The platform package names are new to `yarn.lock`.

| Package | Registry | Source | Research verdict |
|---|---|---|---|
| `@supabase/cli-darwin-arm64`, `@supabase/cli-linux-x64`, `@supabase/cli-linux-x64-musl`, `@supabase/cli-linux-arm64`, `@supabase/cli-linux-arm64-musl` (whichever the chosen version declares) | https://www.npmjs.com/package/supabase (see its `optionalDependencies`) | github.com/supabase/cli | SUS: too-new (the age gate removes this), arm64 downloads unknown |

- [ ] **Approved:** let the `supabase` CLI bump bring in its official per-platform packages.

## C. The SvelteKit 3 migrator `sv` (plan 169-12, D-15 step 2) — only if Kit 3 clears the age rule

Run once through `npx`, not installed. 169-12 is non-autonomous anyway; its decision checkpoint
repeats this question with the exact version, so ticking here is optional.

| Package | Registry | Source | Research verdict |
|---|---|---|---|
| `sv` | https://www.npmjs.com/package/sv | github.com/sveltejs/cli | SUS: too-new |

- [ ] **Approved in advance:** 169-12 may run `sv` (a version at least 7 days old) if Kit 3 lands.
