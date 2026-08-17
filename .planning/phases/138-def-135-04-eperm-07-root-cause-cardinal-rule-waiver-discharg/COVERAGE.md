# Phase 138 — API Coverage Declaration

**No external API integration: this phase diagnoses an intermittent E2E failure using instruments
already installed in the tree — the Playwright test runner, its bundled Chrome DevTools Protocol
control channel, the local Supabase dev stack, and the project's own dev server. No third-party
service, SDK or hosted API is called, configured or credentialed.**

## Judgement recorded

The deterministic detector was not resolvable in this runtime (`gsd-tools query api-coverage` is not
a registered command in the installed build), so the judgement below is made against the phase scope
directly and recorded here rather than assumed.

| Candidate that could look like an API integration | Verdict | Reason |
|---|---|---|
| **Chrome DevTools Protocol** (`Emulation.setCPUThrottlingRate`, via `page.context().newCDPSession`) | Not an external API integration | CDP is a browser-automation control channel over a local socket, exposed by the already-installed `playwright-core` and typed by its bundled protocol definitions. It has no service endpoint, no credential, no rate limit, no version negotiation with a vendor, and no runtime presence in the shipped application. It is the test harness talking to the browser it launched. |
| **Local Supabase** (`yarn db:reset`, the REST and Storage readiness poll in the run wrapper) | Not an external API integration | The local dev stack is existing project infrastructure exercised by existing scripts. This phase adds a readiness poll against it; it does not integrate a new service or add a capability surface. |
| **The project's own dev server** (spawned and log-redirected by `tests/scripts/e2e-run.sh`) | Not an external API integration | First-party, in-repo, started by an existing package script. |
| **Playwright reporter output env vars** (`PLAYWRIGHT_JSON_OUTPUT_FILE`, `PLAYWRIGHT_HTML_OUTPUT_DIR`) | Not an external API integration | Local file-output configuration of an installed test runner. |

## Package position

**No packages are installed by this phase.** Every instrument was version-verified against the
installed tree during research: `@playwright/test` 1.58.2, `playwright-core` 1.58.2,
`@sveltejs/kit` 2.55.0. `138-RESEARCH.md` § Package Legitimacy Audit records that no registry lookup
was required and no package name was sourced from model output, and that there are no `[SLOP]` or
`[SUS]` verdicts to carry. No package-legitimacy checkpoint is therefore planned, because no plan
contains an install task.
