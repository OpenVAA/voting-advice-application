---
created: 2026-10-09T00:00:00.000Z
title: Three default locales that nothing connects — the adapters' fallback, the i18n default and projects.default_locale
area: Frontend / i18n; Supabase
severity: minor
source: Phase 175 (175-RESEARCH.md § Open Questions 1 and disagreement T-6; orchestrator ruling 4; plan 175-04 ruling 5); filed by 175-13
owner: the operator's ruling on which one is "the project's default locale"; Phase 179 reads the answer for its registration form
files:
  - apps/frontend/src/lib/i18n/init.ts
  - apps/frontend/src/lib/contestant/utils/nameRule.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
  - apps/frontend/src/lib/api/dataProvider.ts
  - apps/supabase/supabase/schema/100-tenancy.sql
  - apps/supabase/supabase/schema/010-utility-functions.sql
---

## Finding

"The default locale" has three sources, and no code makes one follow another:

| Source | Where | Who reads it |
|---|---|---|
| The i18n default | `defaultLocale` in `apps/frontend/src/lib/i18n/init.ts`: the supported locale marked `isDefault` in the static settings, or the first one | `translate` and `getLocalized`'s fallback in the frontend; **the name rule**, through `requiredNameLocale()` in `nameRule.ts` |
| The adapters' fallback | `#defaultLocale = 'en'` in `supabaseAdapterMixin` (`supabaseAdapter.ts`), replaced only when the adapter's config carries `defaultLocale` | every `getLocalized` and `toDataObject` call of the Supabase data provider and writer |
| The project's column | `projects.default_locale text NOT NULL DEFAULT 'en'` (`100-tenancy.sql`) | `get_localized` in the database, used by the email helpers alone |

The adapter config's `defaultLocale` is documented in `supabaseAdapter.type.ts` as "from projects.default_locale", and nothing under `apps/frontend/src` reads that column (`git grep -n "default_locale" -- apps/frontend/src` finds the comment and nothing else).

### Which one the name rule reads

An organization's name is required in **the i18n default**: `requiredNameLocale()` returns `defaultLocale` of `$lib/i18n`, and it is the one place that says so (orchestrator ruling 4). The profile page, the context's "profile complete" clause and Phase 179's registration form all go through that helper.

### What is measured and what is inferred

- Measured: the three declarations and their readers, by search, on the tree at the close of Phase 175.
- Measured: in the shipped configuration all three are `en`, so nothing diverges today.
- Inferred: what happens when they differ. A project whose `default_locale` is `fi` in a deployment whose static default is `en` would require the English name of a party, fall back to English in the adapters, and send emails that fall back to Finnish. Not reproduced.

Related: `2026-05-30-paraglide-baselocale-vs-runtime-default-divergence.md` is a fourth, compile-time default (Paraglide's `baseLocale`).

## Options

1. **One source: the static settings.** Drop the column's role as a default (keep it for the email helpers, or pass the locale to them), and construct the adapters with the i18n default. Smallest change; a project cannot have a default of its own.
2. **One source: the project's column.** Load `projects.default_locale` with the project, hand it to the adapters' config (as the type comment already says) and to `requiredNameLocale()`. A multi-project deployment then has a default per project; the i18n default remains the fallback for interface text only.
3. **Leave the three, and name them.** Rename so that no two are called "default locale", and document which decides what.

`requiredNameLocale()` is the single seam for the name rule under every option.
