---
created: "2026-09-01T00:00:00.000Z"
title: Parameterise `supabaseHandle` on the adapter configuration, and only then rename it
area: apps/frontend/src
severity: minor
source: PR #870 review comment (kaljarv) at apps/frontend/src/hooks.server.ts:17 — subject re-measured to the `supabaseHandle` declaration at HEAD 3c958cccc; line numbers for this file are BANNED phase-wide per Phase 158 decision C1(a) / obligation OB-4
files:
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/server/api/dataProvider.ts
  - apps/frontend/src/lib/supabase/server.ts
related_phase: 158
---

# `supabaseHandle`: parameterise on the adapter config before renaming

**Filed:** 2026-09-01, during Phase 158. The filename carries `2026-08-28`, the date the review
comments were bucketed in `.planning/PRE-SHIP-REVIEW-TRIAGE.md`; `created` carries the filing date.

**Classification: NON-BLOCKING.** The reviewer marked no blocking word here, and the entry is a
*deferral with a reason* rather than a defect: see "Why deferring is the right answer" below.

**Provenance note:** this entry arises from the **unbucketed** disposition pass
(`158-TRIAGE-DISPOSITIONS.md` § 2, item 1), not from D-G5's six-item list. It is the only one of the
seven unbucketed comments that earns a register entry.

## The comment

> Paramaterise this dependent on the adapter configuration and rename to dataAdapterHandle if
> possible.

## ⚠ Anchor: expression only. Line numbers for this file are banned.

The review anchor is `hooks.server.ts:17`. **At HEAD `3c958cccc` line 17 is
`const { level: logLevel, problem: logLevelProblem } = resolveLogLevel(`** — the log-level resolution
block, nothing to do with this comment.

| | Line | Content |
|---|---|---|
| **Review era** (`0a7939aff`) | `:17` | `const supabaseHandle: Handle = async ({ event, resolve }) => {` |
| **HEAD `3c958cccc`** | *(not recorded — deliberately)* | the same declaration, with its docblock immediately above |

**Anchor as an expression — use this, not a number:**

```ts
const supabaseHandle: Handle = async ({ event, resolve }) => {
```

…and the `/** Supabase session handler. … */` docblock immediately above it.

**Why no replacement number is recorded.** Obligation **OB-4**: this file's anchors have drifted
**four times in eight days**, twice through unrelated phases editing its imports (`157.1`'s
`configureLogger` block, `157-17`'s logger migration), and a correction pass once replaced a *right*
number with a *wrong* one. Phase 158 decision **C1(a)** bans line numbers for this file phase-wide. A
fifth transcription would repeat the mistake this ban exists to stop.

## Why deferring is the right answer, not a dodge

Two independent reasons, both measured:

### 1. There is no second adapter to parameterise against

`apps/frontend/src/lib/server/api/dataProvider.ts` at HEAD:

```ts
const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'local':
    module = import('./adapters/local/dataProvider');
    break;
  default:
    module = Promise.resolve({});
}
```

The `local` arm exists, but **the local adapter is not present** — the switch's `default` arm resolves
to an empty module, and per `CLAUDE.md` Supabase is the only production adapter. "Parameterise on the
adapter configuration" has exactly one value to parameterise over. The abstraction would be written,
merged and never exercised, which is the shape that rots.

**Cross-reference:** reintroducing the local adapter is itself a filed follow-up — the *"We should
add reintroducing the local adapter as a follow-up task"* review comment, which sits in **Phase 157's**
triage bucket and is 157's to file, not 158's. Its real anchor is
`apps/frontend/src/lib/server/api/dataProvider.ts:12` (the `default:` arm), **not** the
`lib/api/dataProvider.ts:12` the triage cites — that path is now a 78-line module and its `:12` is a
`createSupabaseAnonClient` re-export. **This entry is downstream of that one.** Parameterisation
becomes worth doing when a second adapter exists to be parameterised against.

### 2. The rename half would make the name lie if done first

The reviewer asks for *"rename to `dataAdapterHandle` if possible"*. Renaming a hard-coded Supabase
handle to a backend-neutral name, while its body still calls `createSupabaseServerClient(event)` and
assigns `event.locals.supabase`, produces a name that **asserts something the code does not do**. The
rename is honest only *after* the parameterisation, and is worthless before it.

**Order is therefore mandatory: parameterise first, rename second.** Do not take the rename as a
cheap independent win.

## Also downstream of the adapter boundary

`hooks.server.ts` is entry #8 of the second `ADAPTER_BOUNDARY_ALLOWLIST` group in
`apps/frontend/eslint.config.mjs`, annotated *"158-OWNED, outside criterion 6's stated scope: this
file POPULATES `event.locals.supabase`, which is the structural reason the eight route files above
can reach Supabase without importing it."* Whatever parameterisation lands has to keep that
population working, or move it, and either way changes what the allowlist entry means.
