import { redirect } from '@sveltejs/kit';
import { parseParams } from '$lib/routes';
import type { LayoutLoad } from './$types';

/**
 * Server-side electionTab validation + auto-canonicalization.
 *
 * Name-disjoint dissociation:
 *   - ROUTE side: `params.electionTab` (new) = SELECTED singular election whose results page is being rendered.
 *   - SEARCH side: `?electionId=…` / `electionId[N]=…` (existing PERSISTENT_SEARCH_PARAMS member at `$lib/routes/params.ts`) = AVAILABLE array (zero-or-more), surfaced via `voterContext.selectedElections`. Drives nomination + question filtering; set by the voter at `/elections`.
 * The two keys (`electionTab` vs `electionId`) are literally different identifiers throughout the codebase — they never alias.
 *
 * This loader does NOT force-fill `entityTab` into the URL. Force-filling it (`/results/{electionId}` → `/results/{electionId}/candidates`, `/results` → `/results/candidates`) bounces navigation, because downstream consumers (`buildListRoute`, `+page.ts` coupling-guard) emit same-shape URLs. The implied entity tab lives on `voterContext.currentResultsEntityType`; the URL carries `entityTab` only when the user explicitly selects a tab. The `+layout.svelte` `activeEntityType` derivation + `filterContext` scope tuple read the implied value uniformly.
 *
 * Guard branches (in order):
 *
 * 1. **Invalid `params.electionTab`** (present but NOT a member of the
 *    AVAILABLE array): strip-and-redirect 307 to `/results` with `url.search` preserved. The AVAILABLE-array surface carries through so the picker can render. This catches stale deeplinks after the voter changes their `/elections` selection.
 *
 * 2. **Absent `params.electionTab` AND exactly 1 AVAILABLE election**:
 *    auto-canonicalize 307 to `/results/{availableArray[0]}` with `url.search` preserved. Kills the spurious-picker case `voter-journey.spec.ts:292-294` currently exercises. The URL carries NO `entityTab` segment — `voterContext.currentResultsEntityType` implies the active tab; the layout renders the entity-type selector only when 2+ types are available for the election.
 *
 * 3. **Absent `params.electionTab` AND 2+ AVAILABLE elections**: render
 *    the existing election-picker shape — fall through to the layout's normal render. The picker UI lives in `+layout.svelte` (the `AccordionSelect` block).
 *
 * 4. **Absent `params.electionTab` AND 0 AVAILABLE elections**: defer to
 *    the parent `(located)/+layout.ts` redirect chain, which already redirects to `/elections` when the AVAILABLE-array is empty.
 *
 * No fallback 308 anymore. Anything that reaches the bottom of this loader is a valid render shape (electionTab + optional entityTab/entity/id, or the bare `/results` picker case with 2+ available elections).
 */
// eslint-disable-next-line func-style -- reason: SvelteKit LayoutLoad type-binding requires const-form annotation
export const load: LayoutLoad = async ({ params, url }) => {
  // Skip-condition for detail URLs: when entity/id are present we have a drawer-shape URL. GUARD 1 still validates the electionTab segment (a stale electionTab still strips-and-redirects); GUARD 2 must not fire because the user has navigated to a specific entity via a deeplink and we don't want to rewrite that URL.
  const isDetailUrl = !!(params.entity || params.id);

  // Read the AVAILABLE-array surface from the search-side persistent params (`?electionId=…` / `electionId[N]=…`). This is the same source `voterContext.selectedElections` reads from; here we just need the raw id-array for membership validation.
  const parsed = parseParams({ url });
  const availableRaw = parsed.electionId;
  const available = Array.isArray(availableRaw) ? availableRaw : availableRaw ? [availableRaw] : [];

  // GUARD 1 — Invalid electionTab: present but not a member of AVAILABLE.
  // Only check when AVAILABLE is non-empty (when it's empty, the parent
  // (located) layout will have already redirected to /elections).
  if (params.electionTab && available.length > 0 && !available.includes(params.electionTab)) {
    throw redirect(307, `/results${url.search}`);
  }

  // GUARD 2 — Absent electionTab + exactly 1 AVAILABLE: auto-canonicalize.
  // Redirects to /results/{availableId} (NO entityTab segment) — the layout implies the active entity tab via voterContext.currentResultsEntityType and renders a selector only when 2+ types exist for the election.
  // Skip when on a detail URL (entity/id present) — the URL is already well-formed and the child +page.ts handles drawer coupling.
  if (!params.electionTab && available.length === 1 && !isDetailUrl) {
    throw redirect(307, `/results/${available[0]}${url.search}`);
  }

  // Everything else falls through — the layout renders the election picker (2+ available) or the per-election results (electionTab present), and voterContext implies the active entity tab when entityTab is absent.
  return {};
};
