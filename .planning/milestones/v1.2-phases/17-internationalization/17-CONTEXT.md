# Phase 17: Internationalization - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Evaluate the current i18n approach (sveltekit-i18n v2.4.2) against Svelte-specific alternatives and either confirm it or migrate to a better one. All 740 `$t()` translation call sites across 147 files must work correctly, language switching must update all visible text (full page reload acceptable), routes must handle locale detection/redirect correctly, and API routes must work with locale parameters. Content migration (Svelte 4 → 5 runes/snippets) is deferred to v1.3.

</domain>

<decisions>
## Implementation Decisions

### Evaluation result — Paraglide JS chosen
- **Decision:** Migrate to Paraglide JS (inlang) with a runtime override wrapper for backend `translationOverrides`
- **Rationale:** Paraglide is compile-time, tree-shakeable, Svelte 5 native, type-safe, actively maintained. sveltekit-i18n is unmaintained (seeking maintainer since 2023). svelte-i18n has unclear maintenance trajectory. intlayer's Svelte support is immature (still adapting from React).
- **Override wrapper:** Paraglide cannot inject translations at runtime, but OpenVAA needs `translationOverrides` from backend. Solution: a thin wrapper that checks a runtime override store first, falls back to Paraglide compiled messages. Only the ~30 keys in `dynamic.json` are typically overridden — small surface area.
- **TypeScript type safety:** Paraglide compiler generates type-safe message functions — superior to current custom TranslationKey generator
- **ICU support:** Via Paraglide's inlang message format plugins. Runtime overrides use `intl-messageformat` for ICU parsing.
- **All translation keys migrated to Paraglide format** — full adoption, no legacy key format preserved

### Migration tolerance
- **Appetite:** Eager to migrate — this is the right time since infrastructure milestone is in progress
- **API change:** Migrate all call sites to Paraglide format (`m.translationKey()` instead of `$t('key')`)
- **Strategy:** Big-bang replacement of all 740 call sites in one pass — no incremental dual-library period
- **File reorganization:** Required — Paraglide uses its own message file format (inlang project structure)
- **Key format:** Current dot-notation keys (`dynamic.appName`, `candidateApp.basicInfo.title`) migrated to Paraglide's naming convention. No underscores currently used — research what Paraglide generates.
- **Locale merge first:** Before migration, merge French and Luxembourgish locales from `deploy-luxemburg-vaa-2025` branch (brings locale count from 5 to 7)

### Runtime translation loading
- **Backend overrides:** Must preserve — each VAA deployment customizes labels via `translationOverrides` from `appCustomization`
- **Default payload keys:** Drop the `DEFAULT_PAYLOAD_KEYS` pattern (candidateSingular, partyPlural, adminEmailLink). Replace with hardcoded terms in translations. Note for future: build admin tool for bulk term replacement across translations — the placeholder pattern doesn't work well for polymorphic languages
- **ICU runtime parsing:** Claude's discretion — check actual `parse()` usage and evaluate necessity
- **Future source:** Hybrid approach — static translation files ship with app build, database overrides (Supabase in future) layer on top. Similar to current Strapi pattern
- **Backend content:** Multi-locale objects from backend (elections, candidates, etc.) are picked by `translate()`/`translateObject()` utilities independent of the i18n library — the library only handles static UI strings and locale state

### Locale routing
- **URL pattern:** Keep current `[[lang=locale]]` optional prefix — well-established, SEO-friendly
- **Server hooks:** Simplify if the chosen library handles routing/detection natively — remove unnecessary sveltekit-i18n-specific calls (e.g. `setRoute('')`). Keep custom hooks only for what the library doesn't cover
- **Language switching:** Full page reload is acceptable on locale change
- **Soft locale matching:** Preserve — browser locale codes like `en-US` or `fi-FI` must gracefully match supported locales (`en`, `fi`)
- **API routes:** Must work correctly with locale parameter handling (existing pattern in hooks.server.ts)

### Claude's Discretion
- Whether `translate()`/`translateObject()` should be integrated into Paraglide or kept as separate utilities
- ICU runtime `parse()` function — keep or simplify based on actual usage analysis
- Exact codemod strategy for converting 740 `$t()` call sites to Paraglide `m.key()` calls
- Override wrapper architecture details (store shape, ICU formatting for overrides, fallback chain)
- How Paraglide's inlang project structure maps to the current 56 JSON files × 7 locales
- Whether Paraglide's built-in SvelteKit reroute hook replaces all custom hooks.server.ts logic or just part of it

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### i18n implementation
- `apps/frontend/src/lib/i18n/init.ts` — Core i18n initialization, custom `t` store wrapper, `translate()`/`translateObject()` utilities, ICU `parse()` function, default payload injection
- `apps/frontend/src/lib/i18n/translations/index.ts` — Translation file registry, locale definitions, loader setup, DEFAULT_PAYLOAD_KEYS
- `apps/frontend/src/lib/i18n/README.md` — Translation architecture docs, file organization, key conventions, TranslationKey type info
- `apps/frontend/src/lib/i18n/utils/` — Locale matching, accepted language parsing, canonization utilities

### Routing and hooks
- `apps/frontend/src/hooks.server.ts` — Server hooks: locale detection from Accept-Language, redirect logic, html lang attribute, candidate auth redirect
- `apps/frontend/src/params/locale.ts` — Route param matcher using soft locale matching
- `apps/frontend/src/routes/[[lang=locale]]/+layout.ts` — Layout loader: translation loading, locale setting, backend translation override injection
- `apps/frontend/src/routes/[[lang=locale]]/+layout.svelte` — Root layout: i18n context initialization

### Context and type system
- `apps/frontend/src/lib/contexts/i18n/i18nContext.ts` — Svelte context provider wrapping i18n exports
- `apps/frontend/src/lib/types/generated/translationKey.ts` — Generated TranslationKey type (auto-generated from translation files)
- `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` — TranslationKey type generator tool

### Settings
- `packages/app-shared/src/settings/staticSettings.ts` — `supportedLocales` configuration (locale codes, names, default flag)

### Locale branch to merge
- Branch `deploy-luxemburg-vaa-2025` — Contains French and Luxembourgish locale translations to merge before migration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `translate()` / `translateObject()` in `init.ts`: Locale-aware object picker for backend content — independent of i18n library, just needs current locale
- `matchLocale()` in `utils/matchLocale.ts`: Soft locale matching utility — useful regardless of library choice
- `parseAcceptedLanguages()` in `utils/parseAcceptedLanguages.ts`: Accept-Language header parser
- `TranslationKey` generated type and generator tool: Pattern for type-safe keys — may need adaptation for new library
- `editTranslations` tool in `frontend/tools/`: Bulk translation management utility

### Established Patterns
- `$t('key.nested.path', {payload})` — 740 call sites across 147 files, the primary translation interface
- `translate(localizedObject)` — Used for backend-provided multi-locale content (separate from i18n lib)
- Lazy loading per locale+key via dynamic JSON imports — each translation file loaded on demand
- ICU message format with `intl-messageformat` — plurals, selects, number/date formatting
- `addTranslations()` for runtime override injection from backend `appCustomization`
- Svelte store-based reactivity (`derived(i18n.t, ...)`) — will need runes adaptation in v1.3

### Integration Points
- `initI18nContext()` in root layout — provides `locale`, `locales`, `t`, `translate` to all components
- `+layout.ts` loader — loads translations, applies backend overrides, sets locale
- `hooks.server.ts` — locale detection, redirect, html lang attribute
- `params/locale.ts` — route param validation
- 5 locale directories under `translations/` (en, fi, sv, da, et) + 2 incoming (fr, lb)
- 56 translation key files per locale

</code_context>

<specifics>
## Specific Ideas

- Backend content arrives as multi-locale objects `{en: "...", fi: "..."}` — with future Supabase migration, the data adapter or frontend picks the right locale. The i18n solution must be compatible with this pattern.
- Merge locales from `deploy-luxemburg-vaa-2025` branch (French, Luxembourgish) before any migration work begins — brings total to 7 locales
- Default payload keys (`{candidateSingular}`, `{partyPlural}`, etc.) should be dropped — hardcode terms directly in translations. The placeholder pattern doesn't work well for polymorphic languages where the term form depends on grammatical context.
- Future: admin tool for en masse replacement of common terms across all translations — deferred but note the need
- The `editTranslations` tool exists for bulk translation management — leverage for migration

</specifics>

<deferred>
## Deferred Ideas

- **Admin term replacement tool** — Bulk find-and-replace for common terms (candidate/party/etc.) across all translation files. Needed because DEFAULT_PAYLOAD_KEYS pattern is being dropped. Deferred to future milestone.
- **Database-driven translations** — Full Supabase-backed translation management. Current hybrid approach (static + overrides) preserved for now. Deferred to Supabase migration milestone.
- **Svelte 5 runes migration** — Paraglide is Svelte 5 native, so i18n itself won't need runes migration. Component content migration still deferred to v1.3.

</deferred>

---

*Phase: 17-internationalization*
*Context gathered: 2026-03-15*
