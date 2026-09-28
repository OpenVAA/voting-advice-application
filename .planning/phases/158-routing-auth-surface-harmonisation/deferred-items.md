# Phase 158 — deferred items

Out-of-scope discoveries made during execution. Logged, **not** fixed, per the executor scope
boundary (only issues directly caused by the current task's changes are auto-fixed).

---

## DEF-158-01 — `access.underMaintenance: true` in the `app_settings` column does not put the app into maintenance

**Found during:** 158-04 Task 4, while measuring the rendered `<title>` for the maintenance branch.

**Symptom.** With the DB column flipped to maintenance:

```sql
update app_settings set settings = jsonb_set(settings,'{access,underMaintenance}','true'::jsonb);
```

the served SSR HTML **carries the flag** in its serialized loader payload —

```
… "answersLocked": false, "underMaintenance": true}, "header": {…
```

— but the page renders normally: `<title>Election Compass</title>` with no maintenance suffix, and
the `{:else if underMaintenance}` branch that renders `MaintenancePage` does not render. The only
occurrence of the string "maintenance" in the response is inside the data payload itself, never in
markup. Measured twice, with 10 s and 12 s settles and cache-busting query strings, on a freshly
started dev server.

**Reading.** The raw loader data reaches the client, so the defect is downstream of the loader: the
merged `appSettings` the layout reads (`appCtx.appSettings`) does not reflect the column's `access`
block. `+layout.svelte` explicitly claims the opposite in its own comment — *"a column that
explicitly carries `access` still overrides it"* — so either that claim or the merge is wrong.

**Why it is not fixed here.** 158-04 Task 4 changes the title's *markup*, not the `underMaintenance`
derivation. The diff touches neither `const underMaintenance = …` nor the `{:else if underMaintenance}`
branch, and the branch was equally unreachable before the edit — so this is pre-existing and
independent of this plan.

**Consequence for 158-04's evidence.** The maintenance arm of the new title could not be exercised
end-to-end. The default arm IS measured from served bytes. See `158-04-SUMMARY.md`.

**Suggested owner.** A settings-merge phase, not a routing one. Worth a characterisation test at the
merge boundary: column `access` block → merged `appSettings.access`.

## STATE.md frontmatter is not valid YAML (found 158-16, PRE-EXISTING)

`last_activity_desc` is a double-quoted YAML scalar containing unescaped `"` characters, written by
`158-15` (`expected "parseResponse" to not be called at all`) and again earlier. Any consumer that
parses the frontmatter as YAML fails with `expected <block end>, but found '<scalar>'`.

**Proven pre-existing:** `git show HEAD:.planning/STATE.md` at `ea687ce0c` — before `158-16` touched
the file — fails to parse with the same error.

Out of scope for `158-16` (the scope boundary forbids fixing pre-existing failures in files this plan
did not cause) and NOT fixed here, because the remedy is rewriting another plan's own record of its
work. The fix is mechanical: single-quote the offending inner quotes, or move
`last_activity_desc` to a YAML block scalar (`>-`). `158-16` wrote its own contribution with inner
quotes already normalised to `'`, so it does not add to the problem.

Related, and also not fixed here: `gsd-tools query state.advance-plan` and `state.update-progress`
both refuse this STATE.md ("Cannot parse Current Plan or Total Plans in Phase", "Progress field not
found"), so plan-position and progress were updated by hand — the same way `158-13`, `158-14` and
`158-15` evidently were.

### RESOLVED 2026-09-02 by `56a5608f4` — not by `158-16`

`docs(158): commit 158-16 tracking and repair STATE.md frontmatter YAML` landed two minutes after
`158-16`'s summary commit and repaired the frontmatter. The diagnosis above stands as the record of
what was wrong and why `158-16` did not fix it; the item itself is CLOSED. Verified: `ea687ce0c` and
`6e2ac8857` both fail to parse, the working file parses.
