# Lens: Behaviour · ID prefix `BEH`

**Applies when** the PR adds or changes something a voter, contestant or admin can do or see: a button, link, form, dialog, drawer, filter, question flow step, results view, default, or automatic behaviour. It also applies to a server-side or settings change that alters what a user experiences, such as a changed default in `dynamicSettings` or a new automatic redirect.

## List

Every user affordance introduced or changed, as a table: _affordance_, _app_ (voter / contestant / admin), _route_, _what it does_, _new or changed_. Then trace each non-trivial affordance's action chain in one line, e.g. `Save answer button → getContestantContext().answers.set() → dataWriter.setAnswers → supabase adapter → upsert RPC → answers`. Mark a missing link with `✗`.

## Evaluate (criterion slugs)

- `beh-interaction`: how the new affordances interact with each other and with existing ones. Look for two ways to do the same thing that behave differently, an affordance that silently undoes another, and state changed in one app that another does not reflect (a contestant's edit not reaching the voter view, an admin setting honoured by one app only).
- `beh-mental-model`: does it follow a journey already in the app, or introduce a new one? The voter app runs intro → constituency / election selection → questions → results; the contestant app runs register or login → protected pages; the admin app has its own protected flow. A new model needs a reason, and the explanation should name it so the reviewer can decide.
- `beh-action-chain`: the chain runs component → context method → universal adapter / data writer → Supabase adapter → RPC, table or Edge Function. Flag a component calling Supabase directly, a page re-deriving state its context already exposes, and a write that bypasses the data writer.
- `beh-settings-respected`: the affordance honours the settings that govern its surface. A feature hidden by an `appSettings` flag must be hidden on every surface that reaches it, not only the view the PR edited. Grep the flag at `$HEAD_SHA` and list each reader.

## Where to look

`apps/frontend/src/lib/contexts/voter/`, `apps/frontend/src/lib/contexts/contestant/`, `apps/frontend/src/lib/contexts/admin/`, `apps/frontend/src/lib/contexts/app/`, `apps/frontend/src/lib/api/base/universalAdapter.ts`, `apps/frontend/src/lib/api/adapters/supabase/`, `packages/app-shared/src/settings/dynamicSettings.ts`. `apps/frontend/src/lib/contexts/README.md` describes the contexts.

## Promote to

`.agents/code-review-checklist.md`; `.claude/skills/components/SKILL.md` (context API usage).
