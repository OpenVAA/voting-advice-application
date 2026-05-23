import { redirect } from '@sveltejs/kit';
import { parseParams } from '$lib/utils/route';
import type { LayoutLoad } from './$types';

/**
 * Server-side electionTab validation + auto-redirect guards (Phase 88 Plan
 * 88-02 Task 6).
 *
 * Name-disjoint dissociation:
 *   - ROUTE side: `params.electionTab` (Plan 88-02 new) = SELECTED singular
 *     election whose results page is being rendered.
 *   - SEARCH side: `?electionId=…` / `electionId[N]=…` (existing
 *     PERSISTENT_SEARCH_PARAMS member at `$lib/utils/route/params.ts`) =
 *     AVAILABLE array (zero-or-more), surfaced via
 *     `voterContext.selectedElections`. Drives nomination + question
 *     filtering; set by the voter at `/elections`.
 * The two keys (`electionTab` vs `electionId`) are literally different
 * identifiers throughout the codebase — they never alias.
 *
 * Guard branches (in order):
 *
 * 1. **Invalid `params.electionTab`** (present but NOT a member of the
 *    AVAILABLE array): strip-and-redirect 307 to `/results` with
 *    `url.search` preserved. The AVAILABLE-array surface carries
 *    through so the picker can render. This catches stale deeplinks
 *    after the voter changes their `/elections` selection.
 *
 * 2. **Absent `params.electionTab` AND exactly 1 AVAILABLE election**:
 *    auto-redirect 307 to `/results/{availableArray[0]}/candidates` with
 *    `url.search` preserved. Kills the spurious-picker case
 *    `voter-journey.spec.ts:292-294` currently exercises. The
 *    `/candidates` default tab matches the existing canonicalization
 *    behavior (the bare `/results` → `/results/candidates` redirect
 *    below).
 *
 * 3. **Absent `params.electionTab` AND 2+ AVAILABLE elections**: render
 *    the existing election-picker shape — fall through to the layout's
 *    normal render. The picker UI lives in `+layout.svelte` (the
 *    `AccordionSelect` block).
 *
 * 4. **Absent `params.electionTab` AND 0 AVAILABLE elections**: defer to
 *    the parent `(located)/+layout.ts` redirect chain, which already
 *    redirects to `/elections` when the AVAILABLE-array is empty.
 *
 * After the three guard branches, the legacy canonicalization
 * (bare `/results` → `/results/candidates`) preserved from the
 * pre-88-02 +layout.ts runs as a fallback for the picker-render path.
 */
// eslint-disable-next-line func-style -- reason: SvelteKit LayoutLoad type-binding requires const-form annotation
export const load: LayoutLoad = async ({ params, url }) => {
  // Skip-conditions for detail-URL pass-through (preserved from pre-88-02):
  // - `entityTab` already present → canonical list URL, validation below
  //   still runs for the electionTab segment.
  // - `entity` or `id` present → detail URL; the child `+page.ts`
  //   coupling-guard handles it; skip canonicalization but still
  //   validate the electionTab (guard 1 may strip-and-redirect).
  const isDetailUrl = !!(params.entity || params.id);

  // Read the AVAILABLE-array surface from the search-side persistent
  // params (`?electionId=…` / `electionId[N]=…`). This is the same
  // source `voterContext.selectedElections` reads from; here we just
  // need the raw id-array for membership validation.
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
  // Append `/candidates` deterministically to match the existing default-tab
  // shape (the legacy bare-/results redirect at the bottom of this file).
  // Skip when on a detail URL (entity/id present) — the existing detail
  // URL is already well-formed and the child +page.ts handles coupling.
  if (!params.electionTab && available.length === 1 && !isDetailUrl) {
    throw redirect(307, `/results/${available[0]}/candidates${url.search}`);
  }

  // After the new guards, the legacy canonicalization runs as a fallback.
  // If we got here with electionTab present, we're already canonical.
  if (params.electionTab) return {};
  // Detail URL on /results without an electionTab — leave it alone so the
  // child +page.ts coupling-guard can handle it (it will redirect with
  // the same electionTab-absent shape).
  if (isDetailUrl) return {};
  // entityTab already present (e.g. /results/candidates) → canonical list
  // URL without an electionTab segment; this is the 2+ AVAILABLE picker
  // case (guard 3) — let the layout render the picker.
  if (params.entityTab) return {};
  // GUARD 4 — Fall-through: bare /results with 0 AVAILABLE. The parent
  // (located)/+layout.ts has already redirected on this case; the
  // legacy canonicalization fallback below preserves the pre-88-02
  // behavior for any path that slips through.
  throw redirect(308, `/results/candidates${url.search}`);
};
