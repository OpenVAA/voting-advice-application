# Deferred items: quick 260927-kjb

## `audit-skill-links.sh spike-findings-voting-advice-application-gsd` exits 1 (pre-existing)

- **Found during:** Task 3 gate.
- **State at planning base `3f95dd5c8`:** exit 1, with 173 checked and 113 dangling. Measured by restoring the two base skill files and rerunning the audit.
- **State after this plan:** exit 1, with 175 checked and 112 dangling. This plan removed one dangling citation (the short-form opener path in the SKILL.md mapping row is now the full `apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts` path, which resolves) and added none.
- **Nature:** citations of files the Svelte 5 migration and later refactors removed or renamed (`answerStore.svelte.ts`, `matchStore.svelte.ts`, `routes/Header.svelte`, `svelte/store`, bare `page.url` tokens and others) across the spike-findings references. They are historical spike records, not the drawer host.
- **Why deferred:** fixing 112 unrelated citations across the spike corpus is outside this plan's scope boundary. Each one needs either a corrected path or a `<!-- skill-link-allow: <token> -->` marker.
- **The `components` audit exits 0** (30 checked, 0 dangling).
