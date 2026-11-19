# Lens: Complexity and reuse · ID prefix `CPX`

**Applies when** the PR adds or changes application logic: utilities, helpers, context methods, adapter methods, server routes, load functions, scripts or package code. It almost always applies to non-trivial PRs.

This lens is the **adversarial** one. Assume each new piece of code is unnecessary until the repo proves otherwise.

## List

Every new feature, application-logic unit and utility (and every materially changed one), as _name_ → _file_ → _what it does in one line_ → _callers_.

Then the **searched population**: derive it at `$HEAD_SHA` rather than trusting a list, and record it in your `.md` so the reader can see coverage:

```bash
git ls-tree -d -r --name-only $HEAD_SHA | grep -E '/(utils|helpers|_shared|_helpers)$'
git ls-tree -r --name-only $HEAD_SHA -- packages | grep -E '^packages/[^/]+/src/index\.ts$'
```

As a guide only, today that is the frontend's `apps/frontend/src/lib/utils/` (with its `text`, `questions`, `matching`, `color`, `aria` and `password-validation` subfolders), `apps/frontend/src/lib/api/utils/`, `apps/frontend/src/lib/api/adapters/supabase/utils/`, `apps/frontend/src/lib/contexts/utils/`, `apps/frontend/src/lib/i18n/utils/`, `apps/frontend/src/lib/admin/utils/`, `apps/frontend/src/lib/contestant/utils/` and `apps/frontend/src/lib/analytics/`; every package under `packages/` (`core`, `data`, `matching`, `filters`, `app-shared`, `dev-seed`, `llm`, `question-info`, `argument-condensation`, `supabase-types`, `shared-config`, `dev-tools`) with their `src/utils` folders; `apps/supabase/supabase/functions/_shared/`; `apps/docs/src/lib/utils/` and `apps/docs/scripts/utils/`; and the three component libraries.

## Evaluate (criterion slugs)

For each item, actively search the population at `$HEAD_SHA` (`git grep` on the verbs and nouns involved, not only the name):

- `cpx-duplicate-existing`: something equivalent or near-equivalent already exists. Name it with its path and show the overlap (`G-reuse`).
- `cpx-generalise-existing`: an existing unit would cover this with one more parameter. Propose the signature change and check that existing callers are unaffected.
- `cpx-replace-existing`: the new unit is better than an older sibling, and the older one should be migrated to it. Name the sibling and count its callers. The PR might be the one to consolidate.
- `cpx-overbuilt`: an abstraction with a single caller, configurability nobody uses (including a setting with one value nobody varies), speculative generality, or defensive code for states the types exclude (`G-less-code`). A back-compat shim is overbuilt by definition while nothing is deployed.
- `cpx-file-split`: see `G-split-files`.
- `cpx-wrong-layer`: logic in a component that belongs in a context or a utility; server-only code outside `apps/frontend/src/lib/server/`; a frontend helper that belongs in a package. Logic over data-model objects is owned by the domain-packages lens (`pkg-elevate-method`).

Don't list an item as fine. Only list the ones with a finding. "Searched N folders, found nothing" is never a finding.

## Where to look

The searched population above; `packages/README.md` for what each package owns; the component libraries `apps/frontend/src/lib/components/`, `apps/frontend/src/lib/dynamic-components/`, `apps/frontend/src/lib/contestant/components/`, `apps/frontend/src/lib/admin/components/`.

## Promote to

`.agents/code-review-checklist.md` (the "no repeated code" item); the owning skill: `.claude/skills/components/SKILL.md` for UI, `.claude/skills/data/SKILL.md` for domain helpers.

<!-- skill-link-allow: src/utils -->
