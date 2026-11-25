# Lens: Nomenclature · ID prefix `NOM`

**Applies when** the PR introduces a new **root term**: a noun or concept that becomes part of the codebase's vocabulary. That covers a new type, class, table, column, enum or enum member, RPC, context or context accessor, route segment, setting, event name, message-key namespace, or a user-facing name for a concept. Derived names (`fooId`, `getFooContext`, `FooView`, `foo.test.ts`) are not root terms; they are checked for consistency with the root.

Names outlive the code that introduced them. Once a term reaches the database, the settings, the docs or the UI copy it is expensive to rename, so this lens is worth raising even for small PRs.

## List

Every new root term as a table: _term_ → _where it is defined_ (file:line) → _what it denotes in one line_ → _where it surfaces_ (DB / package / context / route / settings / UI copy / docs). Group terms that are the same concept on different layers on one row.

## Evaluate (criterion slugs)

- `nom-ambiguous`: is the term understandable to someone who hasn't read the PR, and does it have one meaning? Flag generic words carrying a specific meaning (`item`, `data`, `info`, `config`, `result`), words that already mean something in the VAA domain, and one term used for two things in the same PR. The domain vocabulary: _entity_, _nomination_, _candidate_, _organization_ (party is UI copy only), _alliance_, _faction_, _election_, _constituency_ and _constituency group_, _question_ (opinion / info), _answer_, _category_, _voter_, _contestant_, _admin_, _project_, _account_, _grant_, _invitation_.
- `nom-conflict`: does the term collide with existing nomenclature? `git grep -wi <term> $HEAD_SHA` finds another concept with the same name, or the same concept under another name. Say which is canonical. The app for candidates and parties is the **Contestant App**; the older name for it is retired, and `yarn assert:no-candidate-app-names` reports it.
- `nom-abstract-pattern`: abstract terms follow the repo's established pairs. Measure the precedent with `git grep -c` for each alternative before claiming it: `settings` vs `config` vs `options`; `type` vs `subtype` vs `kind`; `name` vs `title` vs `label`; `id` vs `externalId`; `get` / `load` / `fetch`. Flag a new term that picks the other side of an established pair, or introduces a third option.
- `nom-layer-drift`: the same concept named differently across layers. snake_case in the database and camelCase through `PROPERTY_MAP` is expected; a _different word_ across a layer boundary is the finding. Name the canonical term and every divergent spelling.
- `nom-file-symbol`: the filename matches its main export. A component is `Foo.svelte` with props in `Foo.type.ts`; a context file `fooContext.svelte.ts` exports `getFooContext`. Flag mismatches, and folders whose name no longer describes their contents.
- `nom-i18n-namespace`: new message keys sit in an existing namespace of the catalogues unless the concept is genuinely new (`yarn assert:i18n-catalog-namespaces`).

## Where to look

`packages/data/src/objects/` (domain class names), `apps/supabase/supabase/migrations/` (tables, columns, enums), `apps/frontend/src/lib/contexts/` (accessor names), `apps/frontend/messages/en/` (user-facing terms), `packages/app-shared/src/settings/` (setting names).

## Promote to

`.agents/code-review-checklist.md`; `.claude/skills/data/SKILL.md` for domain names; `.claude/skills/database/SKILL.md` for schema names.

<!-- skill-link-allow: Foo.type.ts -->
<!-- skill-link-allow: foo.test.ts -->
<!-- skill-link-allow: fooContext.svelte.ts -->
