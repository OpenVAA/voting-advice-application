---
created: "2026-08-28T00:00:00.000Z"
title: Reintroduce the local data adapter for static-data deployments
area: frontend
priority: medium
files:
  - apps/frontend/src/lib/api/dataProvider.ts
  - apps/frontend/src/lib/api/adapters/
  - apps/frontend/src/lib/server/api/adapters/local/
  - apps/frontend/src/lib/api/README.md
source: PR #869 review comment (kaljarv) on apps/frontend/src/lib/api/dataProvider.ts; filed during Phase 157 per D-N2.
related_phase: 157
---

## Problem

`apps/frontend/src/lib/api/dataProvider.ts` unconditionally re-exports the Supabase
provider. The whole file is one line:

```ts
export { dataProvider } from './adapters/supabase/dataProvider';
```

There is no client-side adapter switch, and `apps/frontend/src/lib/api/adapters/`
contains only `apiRoute/` and `supabase/`. A deployment that wants to serve a VAA from
static data has no client-side path to it.

**The surprising half, and the reason this is not a from-scratch build:** a local
adapter *does* still exist and *is* still wired, on the **server** side, under
`apps/frontend/src/lib/server/api/adapters/local/`
(`dataProvider/localServerDataProvider.ts`, `feedbackWriter/localServerFeedbackWriter.ts`,
`localPaths.ts`, `localServerAdapter.ts`). It is selected at runtime by
`staticSettings.dataAdapter.type === 'local'` in
`apps/frontend/src/lib/server/api/dataProvider.ts`:

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

So "reintroduce" means **restore the client-side local adapter**, not build a local
adapter from nothing. Record that before searching: the server-side half is already
there, and an agent that greps only `lib/api/` will conclude, wrongly, that the local
adapter was deleted outright.

## Solution

Reinstate a client-side selection path in `apps/frontend/src/lib/api/dataProvider.ts`
that mirrors the server-side switch — keyed on the same `staticSettings.dataAdapter.type`,
so the two halves cannot disagree — and add the corresponding
`apps/frontend/src/lib/api/adapters/local/` implementation beside `apiRoute/` and
`supabase/`.

Two things to settle first, because they decide the shape:

1. Whether a client-side local adapter is actually wanted, or whether static-data
   deployments should go through `apiRoute/` against the server-side local adapter. The
   second needs no new adapter at all and may be the real answer.
2. What `apps/frontend/data/` is for. `CLAUDE.md:246` says the frontend build "also
   copies `apps/frontend/data/` folder if present for local adapter" — that build step
   is the local adapter's data source and must survive whichever shape is chosen.

Update `apps/frontend/src/lib/api/README.md` when the answer lands; Phase 157 corrected
it to describe the server-side-only status quo, which will itself go stale on a fix.

## Context

Anchored to the FILE rather than to a line: the review comment cites
`dataProvider.ts:12`, but the file is one line long, so the line number is stale and
only the file identifies the site.

Cross-link: `.planning/todos/pending/2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md`
is the same boundary problem seen from the other side — Supabase-specific code that
escaped the adapter layer into routes, filed for Phase 158's territory. Both are
symptoms of the adapter boundary being advisory rather than enforced; a fix for either
should check whether it makes the other cheaper.

Phase 157 dispositioned this as a todo rather than fixing it in place (decision D-N2)
because it is a feature restoration with an open design question, not the small
documentation and typing corrections that phase was scoped to. The README half of the
same review comment WAS fixed in 157.
