# Phase 158 — where the admin E2E projects land in the schedule, and what shares their phase

**Measured:** 2026-09-02
**Produced by:** `158-16`, Task 2
**Subject:** the settings-singleton relationship of `data-setup-admin-auth`, `admin-access` and
`data-teardown-admin-access`

The plan required this to be a **measurement**, not an assumption, because the `app_settings`
singleton is the failure class that cost Phase 124 a full debugging cycle (`EFLOW-06`, recorded as a
perm `app_settings` singleton-contamination flake, not a product bug).

---

## Method, and its one stated limitation

Two independent readings, taken together because neither alone answers the question.

1. **The layering, computed from the config as it stands.** A throwaway script imported
   `tests/playwright.config.ts` and layered the project dependency graph the way Playwright does —
   a project may start once every project in its `dependencies` has completed (Kahn layering). Run
   twice per configuration: once over the config as it stands, and once over the same config with
   the three admin projects removed and any edge naming them dropped, so "how many projects moved
   phase" is a difference between two computations rather than a recollection.

   **Stated limitation:** teardown projects carry no `dependencies`, so this model puts every
   `data-teardown-*` in phase 0. That is an artifact of the model, not a reading: Playwright runs a
   teardown in a separate reverse pass once its setup project's dependents have finished. The
   teardown's real position is taken from reading 2 instead.

2. **The observed order of a real full-suite run** (`yarn test:e2e`, the same command the gate
   uses), read off the reporter's own progress lines.

Both readings agree, and reading 2 is what settles the teardown.

---

## Reading 1 — the layering

### Default run (`PLAYWRIGHT_BANK_AUTH` unset — the configuration the gate uses)

| Quantity | Value |
|---|--:|
| Projects in the config | **95** |
| Total scheduling phases WITH the admin projects | **55** |
| Total scheduling phases WITHOUT them | **53** |
| `data-setup-admin-auth`'s phase | **54th** (index 53) |
| `admin-access`'s phase | **55th** (index 54) |
| Projects that moved phase when the three were added | **0** |

**What shares each admin phase:** nothing.

| Phase | Members |
|---|---|
| 54th | `data-setup-admin-auth` — **alone** |
| 55th | `admin-access` — **alone** |

**Does the admin spec share a phase with any project that REPLACES the settings singleton?**
**NO.** Neither admin phase has a second member of any kind, let alone a settings-replacing one.

The 55th-phase figure is corroborated from outside this measurement: `playwright.config.ts`'s own
docblock on the a11y family, written before this plan existed, says appending a project to the tail
of the perm serial chain "would enter as the **55th** scheduling phase". The spec project lands
exactly there.

### Opt-in run (`PLAYWRIGHT_BANK_AUTH=1`) — where an overlap DOES exist

| Quantity | Value |
|---|--:|
| Projects in the config | **99** |
| Total scheduling phases WITH the admin projects | **55** |
| Total scheduling phases WITHOUT them | **55** |
| Projects that moved phase | **0** |

| Phase | Members |
|---|---|
| 54th | `data-setup-bank-auth-journey`, `data-setup-admin-auth` |
| 55th | `bank-auth-journey`, `admin-access` |

**Does the admin spec share a phase with a settings-replacing project? YES — under the opt-in flag
only.** `data-setup-bank-auth-journey` calls `setupFromTemplate`, and every `setupFromTemplate` call
performs an **authoritative REPLACE** of `app_settings.settings` (its own docblock says so).

**Measured consequence: benign, and the reason is data rather than luck.** Two facts, both read from
source:

1. **The admin projects write NO settings at all.** `admin-auth.setup.ts` mints an identity and logs
   in; `admin-access.spec.ts` reads pages and writes one `admin_jobs` row. Neither calls
   `updateAppSettings` nor `setupFromTemplate`. So the sharing is one-directional — the admin side
   cannot perturb anyone.
2. **The object the bank-auth setup replaces WITH keeps the admin surface open.** Its template
   spreads `MINIMAL_BASE_APP_SETTINGS` (`packages/dev-seed/src/templates/e2e/perm/shared.ts`), whose
   `access` block carries `adminApp: true` and `underMaintenance: false` — exactly the two flags
   `routes/admin/+layout.svelte` gates its `MaintenancePage` branches on. There is therefore no arm
   of the race in which the admin surface renders the maintenance page.

**The residual risk, named rather than mitigated.** That benign-ness rests on a data value in a
template, not on an ordering guarantee. If a future opt-in template ever replaced the singleton with
`access.adminApp: false` or `underMaintenance: true`, `admin-access` would fail **only** under
`PLAYWRIGHT_BANK_AUTH=1`, intermittently, with a symptom (a maintenance page) that looks nothing
like a scheduling problem. The mitigation if that day comes is one line: make
`data-setup-admin-auth`'s dependency `['bank-auth-journey']` under the opt-in flag and
`['voter-prefs-tracking']` otherwise. It is **not** applied now, deliberately — a conditional edge
the default suite can never exercise is untested wiring, and the measurement says it is not needed.

---

## Reading 2 — the observed order of a real run

From the full-suite reporter's own progress lines (`yarn test:e2e`, 153 collected):

```
[123/153] [voter-prefs-tracking]        … user-preferences round-trip: consent + feedback + survey survive a reload
[124/153] [data-setup-admin-auth]       … mint + authenticate as project admin
[125/153] [admin-access]                … an authenticated admin: cold entry, reload, the gate, …
[126/153] [data-teardown-admin-access]  … remove the admin identity and the job rows it caused
[127/153] [data-teardown-perm-analytics-tracking] … delete perm-analytics-tracking dataset
```

The three admin projects run **consecutively and alone**, immediately after the perm chain's last
spec and immediately before the perm teardown cascade begins. This is what settles the teardown's
position, which reading 1's model could not: it runs as soon as the spec that depends on its setup
has finished, ahead of every perm teardown — so the admin identity and its job rows are gone before
any other teardown starts, and nothing else is ever concurrent with the removal.

---

## The decision, and the dependency edge it took

**The projects JOIN THE TAIL OF THE PERM SERIAL CHAIN.** `data-setup-admin-auth` declares
`dependencies: ['voter-prefs-tracking']` — quoted verbatim from `tests/playwright.config.ts` — which
is the **same edge** `data-setup-bank-auth-journey` takes.

That precedent is an explicit operator decision recorded in the config's own docblock: an earlier
design had the bank-auth journey stand alone, and it was superseded because standing alone "bought a
fast isolated gate at the cost of `app_settings` singleton safety, and the singleton wins."

Both arms of this plan's question were real, and the measurement chose between them on evidence:

- **The measurement shows NO overlap in the default configuration.** By the plan's own rule, this
  record may therefore *propose* standing free in a later phase — and it does, as a proposal only.
- **This phase ships the chained form regardless**, because the precedent is an operator decision
  and the cost of the chain is wall-clock rather than correctness — and because the opt-in
  configuration measured above *does* overlap, so the chain is not merely precedent there.

**The accepted cost, in one sentence:** an isolated `--project=admin-access` run now pulls the whole
perm serial chain transitively and takes full-suite time (~10.5 min) rather than seconds.

### The escape hatch that makes that cost survivable

Measured during this plan: `--no-deps` reduces the isolated admin gate from ~10.5 minutes to **2.8
seconds**, against a database seeded by hand (`yarn db:reset && yarn db:seed --template e2e/base`)
and a session minted by running `--project=data-setup-admin-auth --no-deps` first. That is a
debugging affordance, not a gate — it skips the setup ordering the chain exists to guarantee — but
it is what made the GREEN → RED → GREEN proof of the gate assertion affordable, and a later reader
chasing an admin failure should know it exists.

---

## Reproduction

```
# reading 1
npx tsx <script importing tests/playwright.config.ts, Kahn-layering `dependencies`>
PLAYWRIGHT_BANK_AUTH=1 npx tsx <the same script>

# reading 2
yarn db:reset && yarn dev        # one fresh server, warmed
yarn test:e2e                    # read the [n/153] progress lines around the admin projects
```

The layering script lived in the session scratchpad for the duration of the measurement and is not
committed; `git status --porcelain apps packages tests scripts` prints nothing attributable to it.
