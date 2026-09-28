---
created: '2026-09-03T07:10:00.000Z'
title: '"Remove default." on PUBLIC_IDENTITY_PROVIDER_TYPE - the duplication is already gone, the residual question is fail-loudly posture'
area: auth
files:
  - apps/frontend/src/lib/utils/constants.ts
  - apps/frontend/src/lib/api/utils/auth/providers/index.ts
blocked_on: Phase 157.1 - Fail-Loudly Parse Posture + Production Logging
---

## Status: filed, NOT implemented - the change the plan specified would have been a regression

Phase 159 plan 11 was scoped to implement this comment as a one-line, provably-zero-delta change. **The
premise that made it zero-delta is false on this tree, and the change was not made.** This entry records
the measurement and routes what is genuinely left of the comment to the phase that owns it.

## The review comment

`apps/frontend/src/lib/utils/constants.ts:10` - PR #869 (kaljarv), verbatim:

> Remove default.

Pointing at:

```ts
PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat',
```

## What the plan assumed, and what is actually on the tree

`159-RESEARCH.md` (§ "The six uncovered triage comments", row 3) and `159-11-PLAN.md`'s first `must_haves`
truth both rest on a **second, authoritative default sitting downstream** in the provider selector:

> `lib/api/utils/auth/providers/index.ts:31` - `const providerType = (constants.PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat') as ProviderType;`

That line no longer exists. Measured at `a2cfe9104`:

```ts
// apps/frontend/src/lib/api/utils/auth/providers/index.ts:27
const providerType = constants.PUBLIC_IDENTITY_PROVIDER_TYPE as ProviderType;
```

and the module's own header, three lines up, states the inversion explicitly:

> The `'signicat'` default for backward compatibility with existing deployments is applied **once, at
> `$lib/utils/constants`; this module applies none of its own.**

**Who changed it:** `55c9c07e9` - `refactor(157-13): remove the doubly-applied provider default in
getActiveProvider`, 2026-08-30. Its own commit body names the reasoning and the direction of the choice:

> - `constants.PUBLIC_IDENTITY_PROVIDER_TYPE` already applies `?? 'signicat'`, so the `|| 'signicat'` here
>   could only fire on an explicitly empty env var
> - an empty `PUBLIC_IDENTITY_PROVIDER_TYPE` now reaches the existing throw branch, which names the
>   expected values, instead of silently selecting Signicat
> - the `default: throw` branch is unchanged; `constants.ts` is untouched

So **the duplication the review comment named was already collapsed**, three days before Phase 159 plan 11
ran, and it was collapsed in the opposite direction to the one the plan assumed: the surviving default is
the upstream one, in `constants.ts`.

## Why the planned edit was not made

With no downstream default, replacing `?? 'signicat'` with `?? ''` is **not** a runtime no-op. It is a
behaviour change on the candidate bank-authentication path:

- `getActiveProvider()` switches on the value with `case 'idura'` / `case 'signicat'` and a `default:` that
  throws `Unknown identity provider type: …`. There is no case for the empty string.
- With `PUBLIC_IDENTITY_PROVIDER_TYPE` unset, the resolved value becomes `''`, so every call throws.
- **Four callers**, all server-side: `routes/api/oidc/authorize/+server.ts:22`,
  `routes/api/oidc/token/+server.ts:20`, `routes/api/oidc/callback/+server.ts:64`, and
  `routes/candidate/preregister/+layout.server.ts:41`.

That is precisely the outcome `159-11-PLAN.md`'s own threat model forbids: T-159-34 is rated **high** and
its mitigation is stated as "keeping the resolution outcome provably identical". It is not identical.

Two of the plan's acceptance criteria for the task are therefore **unsatisfiable by any correct
implementation**, and were measured and reported rather than met by bending the code:

| Criterion | Measured | Note |
|---|---|---|
| `grep -c "signicat" constants.ts` returns 0 | returns **1** | satisfying it requires the regression above |
| `grep -cE "\?\? ''" constants.ts` returns 10 | returns **9** | same |
| `grep -c "signicat" providers/index.ts` >= 1 | returns **3** | passes, but NOT for the stated reason - the matches are the `case 'signicat'` arm and two doc mentions, not a surviving default. This is the criterion that would have let the regression through unnoticed. |

The plan's `<success_criteria>` line - "exactly one authoritative identity-provider default remains, with
the resolved outcome proven unchanged and no environment file edited" - is satisfied by the tree as it
stands, without an edit.

## What was done instead

A comment was added directly above the line, so the next reader who lands on this review comment finds the
measurement rather than repeating it. No functional change; no environment file edited (and none needs to
be - `.env.example:46` already sets `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat` explicitly, so the default is
not what local or documented deployments rely on).

## What is genuinely left, and who owns it

One real question survives the measurement, and it is **not** the one the comment appears to ask:

> Should an unconfigured deployment silently get Signicat, or should it fail loudly?

That is a fail-loudly-posture decision about an authentication-path environment variable, not a
duplicate-removal cleanup. **Phase 157.1 - Fail-Loudly Parse Posture + Production Logging** is the phase
whose entire subject is that question, and `157-13` already moved this exact variable one step in that
direction (empty now throws instead of silently selecting Signicat). Removing the last default would be
the next step in the same programme, and it needs the same treatment the rest of that phase's variables
get: a decision on the posture, and a deployment note, because it changes what an unconfigured deployment
does.

**Do not implement it as a drive-by one-liner.** If Phase 157.1 takes it, the work is: remove `?? 'signicat'`
(using `?? ''` to preserve the type, matching the object's other nine entries), decide what
`getActiveProvider()` should do with an empty value beyond throwing an internal error at four server
routes, and document that deployments must now set the variable.
