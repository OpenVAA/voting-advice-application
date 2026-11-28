# Review decisions: PRs 861–889

Operator answers to the decision items of the openvaa-review briefs posted on PRs 861–889 (2026-11-28). The PR comments were deliberately not updated; this file is the record. `/openvaa-review fix <PR#>` should take these as the decisions for the listed findings.

| PR | Finding | Decision |
|---|---|---|
| 877 | XC-1 two switches open the Voter App | **Single switch.** `open_for_voters` becomes the only publication switch; `access.voterApp` derives from it or is removed. |
| 881 | XC-1 `supabaseCookies` in the hydration payload | **Accept + comment.** Checked against the current Supabase SvelteKit guide (2026-11-28): its root `+layout.server.ts` returns `cookies: cookies.getAll()` and `+layout.ts` uses `isBrowser() ? createBrowserClient(...) : createServerClient(..., { cookies: { getAll() { return data.cookies } } })`. Ours is stricter (only `sb-` cookies). The advanced guide's FAQ says HttpOnly is unnecessary because the browser needs the refresh token; its CDN caveat (apply the cache headers `setAll` receives) is already met by `lib/supabase/server.ts`. Add a short comment saying so, and that the payload must never be CDN-cached. Also: the `mailedLink.ts` comment calls these cookies "httpOnly", which is wrong. |
| 880 | XC-1 fixed admin token can expire mid-run | **Accept for now; todo.** Admin app refactor in a later milestone. See `.planning/todos/pending/admin-jobs-token-expiry.md`. |
| 870 | DSN-1 theme colours/font hardcoded in `app.css` | **Derive from settings.** Generate the CSS variables from `staticSettings`. |
| 870 | NOM-1 `etPl`/`etSg` matcher names | **Rename** to descriptive names (e.g. `entityTypePlural`/`entityTypeSingular`), route folders included. |
| 886 | DEP-1 `prettier-plugin-sql` (89 MB parser) | **Drop the plugin.** Prettier no longer formats SQL. |
| 886 | DOC-5 incident-narrative guard headers (+ TST-3) | **Trim to what/why**, no history or ids. Derive the grant-enum list in TST-3 from the schema instead of hard-coding it. |
| 878 | BEH-1 reseed leaves the project closed | **Templates reset state.** Each seed run resets the project-open flags to the template's values (default open). |
| 868 | TST-4 soft-assertion pin at exactly 136 | **Ceiling for all specs** (per-spec maximum or a global ratio), not an exact pin. |
| 862 | XC-1 Arabic on by default | **Opt-in like Estonian.** Ship the translations, leave Arabic out of the default `supportedLocales`. |

Criticals (#869 A11Y-2, #877 DOC-1, #886 DOC-1) and all other findings: fix by default.
