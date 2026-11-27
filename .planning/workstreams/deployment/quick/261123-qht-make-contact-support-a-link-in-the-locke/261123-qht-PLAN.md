---
phase: quick-261123-qht
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 261123-qht
files_modified:
  - apps/frontend/messages/da/dynamic.json
  - apps/frontend/messages/en/dynamic.json
  - apps/frontend/messages/et/dynamic.json
  - apps/frontend/messages/fi/dynamic.json
  - apps/frontend/messages/fr/dynamic.json
  - apps/frontend/messages/lb/dynamic.json
  - apps/frontend/messages/sv/dynamic.json
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - .planning/workstreams/deployment/quick/261123-qht-make-contact-support-a-link-in-the-locke/261123-qht-BASE
autonomous: true
requirements: [QUICK-261123-qht]
user_setup: []

estimate:
  tokens: 90000
  raw_tokens: 90000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "On the Contestant App's profile page of a confirmed candidate and of a confirmed organization, the words that ask the user to contact support in the locked-name sentence are a real link (an `<a href>`) that opens an email to `appSettings.admin.email` with the `contestantApp.help.supportEmailSubject` subject, the same email the `ContactSupport` block's `'email'` action opens, in every one of the seven locales (da, en, et, fi, fr, lb, sv)."
    - "The link's words are the translation `contestantApp.common.contactSupportLink`, put in place of a `{contactSupportLink}` placeholder that each locale's two locked sentences hold exactly once; no English is spliced into another locale. The en, fi and sv sentences read word for word as before; da, et, fr and lb follow those locales' existing `<condition>, {contactSupportLink}.` sentences."
    - "The locked sentence is still one `<p>` with id `profile-name-note` and test id `contestant-profile-name-note`, still start-aligned (`mx-md`, not centred), and still the `aria-describedby` target of every name field; the editable sentence holds no link, and the answers-locked state shows no sentence."
    - "The candidate profile's two axe scans (light and dark) in `contestant-a11y-scan` pass with the link on the page, and their reach proves the link is there: the same assertion was red on the tree before the change and green after it."
    - "Every Playwright project whose tests drive the profile page (contestant-a11y-scan, contestant-journey, contestant-entity-selection, perm-localisation-positive, perm-organization-editing, perm-unnominated-entities) passes in one targeted run made after the last code commit, with each project's test count equal to its `--list` count at the plan's base commit (delta 0) and no test title changed."
    - "The profile page component test, the ContactSupport test, the translations test, the compiled-messages test, the frontend unit suite, `svelte-check --fail-on-warnings`, `yarn lint:check` and Prettier all pass."
  artifacts:
    - path: "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte"
      provides: "The locked-name sentence rendered through ContactSupport's sentence mode with the email action; the editable one as plain text"
      contains: "ContactSupport"
    - path: "apps/frontend/messages/en/dynamic.json"
      provides: "dynamic.contestantAppBasicInfo.identity.name.locked.{candidate,organization} with the {contactSupportLink} placeholder (and the same in the six other locales)"
      contains: "{contactSupportLink}"
    - path: "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts"
      provides: "Pins of the link, its mailto href, its words, the sentence's id and alignment, and of no link in the editable sentence"
      contains: "mailto:"
    - path: "tests/tests/specs/a11y/contestant-a11y.spec.ts"
      provides: "The cand-profile scan entry's reach, which proves the locked sentence's support link is on the scanned page"
      contains: "contact support"
  key_links:
    - from: "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte"
      to: "apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte"
      via: "<ContactSupport sentence={locked key} action=\"email\" id={NAME_NOTE_ID} class=\"mx-md text-start\" data-testid=\"contestant-profile-name-note\" />"
    - from: "apps/frontend/messages/*/dynamic.json"
      to: "apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte"
      via: "the {contactSupportLink} placeholder ContactSupport fills with the escaped mailto link before sanitizeHtml"
    - from: "tests/tests/specs/a11y/contestant-a11y.spec.ts"
      to: "tests/tests/utils/testIds.ts"
      via: "testIds.contestant.profile.identity and testIds.contestant.profile.nameNote in the cand-profile reach"
---

<objective>
Make "contact support" in the profile page's locked-name sentence a link that opens the support email, for the candidate and the organization sentence, in all seven locales, as todo `.planning/todos/pending/2026-11-23-link-contact-support-in-the-locked-name-message.md` asks.

Purpose: the page tells a candidate or a party whose name is locked to contact support but gives no way to do it; the link puts the support email one press away, from the sentence that asks for it.

How (reuse, nothing new): `apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte` already has a sentence mode, the `sentence` prop, that renders a translation holding `{contactSupportLink}` as one `<p>` with the link in place of the placeholder (link words `contestantApp.common.contactSupportLink`, href escaped, whole sentence passed through `sanitizeHtml`), and its `action="email"` builds exactly the mailto the todo names (`appSettings.admin.email`, subject `contestantApp.help.supportEmailSubject`). `EmailSentPanel.svelte` and the identity-provider error page already use it this way, and the messages `common.account.emailSent.support` and `contestantApp.identityProvider.error.*.support` already carry the placeholder in every locale. The profile page renders its locked sentence through that mode; no new component, helper or `{@html}` is added, and the mailto construction is not duplicated.

Output: seven edited `dynamic.json` catalogues, the profile page, its component test, the candidate-profile scan entry's reach, and one code commit.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/deployment/STATE.md
@.planning/todos/pending/2026-11-23-link-contact-support-in-the-locked-name-message.md
@CLAUDE.md
@.agents/code-review-checklist.md
@.claude/skills/components/SKILL.md
@apps/frontend/messages/README.md
@apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte
@apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte.test.ts

Paths below abbreviate the profile route directory `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/` as PROFILE/. Quote it in every shell command: it holds parentheses and brackets.

Facts measured while planning (2026-11-23, HEAD 46554181e):

- The packages were stale after the 2026-11-22 pull: before `yarn build`, seven tests of PROFILE/page.svelte.test.ts failed with `TypeError: isPlainObject is not a function` and `playwright --list` failed on a missing `@openvaa/app-shared` export. After `yarn build` (exit 0) the profile page test and the ContactSupport test passed, 80/80. Build first.
- `yarn workspace @openvaa/frontend check` (svelte-check `--fail-on-warnings`): 0 errors, 0 warnings.
- `playwright --list` on the current tree: `--project contestant-a11y-scan` lists 44 tests in 8 files with its setups, 34 of them in contestant-a11y-scan, two of which (light and dark) are titled with `cand-profile`. `--project perm-unnominated-entities` lists 450 tests in 100 files, because the perm chain pulls in its anchor and every earlier perm entry; inside it: contestant-a11y-scan 34, contestant-entity-selection 48, contestant-journey 3, perm-localisation-positive 2, perm-organization-editing 47, perm-unnominated-entities 70.
- The last full run is `tests/e2e-runs/189.1-final-20261122T094916Z` (729/729, HEAD d5216b03, frontend_port 5273). It was made on the history before the 2026-11-22 pull, which is no ancestor of HEAD (629 files differ): contestant-entity-selection had 51 tests there, and `perm-unnominated-entities` was then `perm-no-nomination` with 68. Its counts are recorded beside this plan's for the phase-end judgement, but the delta that this plan owns is measured against `--list` at its own base commit.
- Another project's Vite server (cwd `/Users/kallejarvenpaa/Desktop/Treader/treader/apps/web`) holds `*:5173`. Run every E2E run with the one-off prefix `FRONTEND_PORT=5273`, the port the last full run used; 5273 was free. Never stop or kill that process.
- Base candidate `test-e2e-base-ca-aa-1`, whose stored session the `contestant-a11y-scan` project uses, takes the import's confirmed default, so its profile is in the `locked-confirmed` name state and shows the locked sentence.
- tailwind-merge 3.7.0 `twMerge('text-center mx-md text-start')` gives `mx-md text-start`: a caller's `text-start` replaces the `text-center` that ContactSupport's sentence mode puts on its `<p>` (`concatClass` merges through `cn`).
- The two locked keys exist in `apps/frontend/src/lib/types/generated/translationKey.ts`; no key is added or removed, so that type needs no regeneration.

Standing rules for this executor:

- Stage only the files this plan names, by path. Never `git add -A`, `git add .` or `git commit -a`: the tree holds unrelated uncommitted changes in docs, infra and `.planning/` that are not yours. Do not move or edit the todo file.
- Never read a gate's status through a pipe: run the gate, take its exit status, and only then read its output from a file.
- Run every command that can take more than a few minutes (`yarn build`, `yarn lint:check`, the frontend unit suite, each `tests/scripts/e2e-run.sh`) in the background with its output redirected to a file, and poll for its exit; a foreground gate can trip the 600 s subagent watchdog.
- Ignore any "CONTEXT WARNING NN%" hook line: it belongs to the orchestrator, not to you.
- E2E: a red or "did not run" test in a run meant to be green blocks the plan; no retry-until-green and no flaky exemption. A run that exits 8 with `VOID-host-suspend.txt` is void: keep its directory, make the run again under a new `--run-dir` (append `-2`, `-3`), and do not diagnose it. Exit 9 is not green. If the harness refuses a stack or E2E command, or a run fails with ENOSPC, stop and report it as a blocker; do not work around the refusal.
- Comment hygiene (CLAUDE.md): any comment you add or change describes the code as it is now; no history, no plan or decision ids, nothing addressed to a reviewer.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: The locked-name sentence links to the support email, proven from the catalogue to the browser</name>
  <files>apps/frontend/messages/da/dynamic.json, apps/frontend/messages/en/dynamic.json, apps/frontend/messages/et/dynamic.json, apps/frontend/messages/fi/dynamic.json, apps/frontend/messages/fr/dynamic.json, apps/frontend/messages/lb/dynamic.json, apps/frontend/messages/sv/dynamic.json, apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte, apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts, tests/tests/specs/a11y/contestant-a11y.spec.ts, .planning/workstreams/deployment/quick/261123-qht-make-contact-support-a-link-in-the-locke/261123-qht-BASE</files>
  <precondition>The local Supabase stack is up with its edge runtime container running (`docker ps` lists a `supabase_edge_runtime` container as Up; if it is not, `yarn db:stop` then `yarn db:start`), nothing listens on ports 5273, 8777 or 9443, and Playwright's browsers are installed.</precondition>
  <behavior>
    - The candidate locked sentence renders as one P (id profile-name-note, test id contestant-profile-name-note, classes mx-md and text-start, no text-center) holding exactly one link, whose words are the link translation and whose href starts with mailto:support@example.org?subject=; the name inputs' aria-describedby still names profile-name-note.
    - The organization locked sentence renders the same way with its own key.
    - The candidate and the organization editable sentences hold no link.
    - In the browser, the base candidate's profile shows, inside the name note, one link named exactly "contact support" whose href starts with mailto: (red before the change, green after).
  </behavior>
  <action>
1. Record the base and build. Write the output of `git rev-parse HEAD` into `.planning/workstreams/deployment/quick/261123-qht-make-contact-support-a-link-in-the-locke/261123-qht-BASE` (one line). Run `yarn build` in the background and wait for exit 0. Then run, with `FRONTEND_PORT=5273` in the environment, `npx playwright test -c tests/playwright.config.ts --list --project contestant-a11y-scan` and the same with `--project perm-unnominated-entities`, each into a file under the scratch directory, and record in the SUMMARY the total line of each and the per-project counts of contestant-a11y-scan, contestant-entity-selection, contestant-journey, perm-localisation-positive, perm-organization-editing and perm-unnominated-entities (planning measured 44, and 450 with 34 / 48 / 3 / 2 / 47 / 70). These are the delta baseline; if they differ from the planning numbers, use yours and say so.

2. E2E red first. In `tests/tests/specs/a11y/contestant-a11y.spec.ts`, give the `cand-profile` entry of the scan table (the entry whose `name` is `'cand-profile'`, `routeId: 'ContestantAppProfile'`) a `reach`. It locates the identity section by `testIds.contestant.profile.identity`, expects its `data-name-state` attribute to be `locked-confirmed` within `TIMEOUTS.slowPage`, then locates inside it the name note by `testIds.contestant.profile.nameNote` and in that the role `link` with the name `contact support` and `exact: true`, and expects that locator to have a count of 1 and an `href` attribute matching the regular expression for a leading `mailto:`. Add one comment line above it beside the entry's existing two, in their style: the base candidate is confirmed, so its name is locked and the sentence saying so carries the link to the support email the scan reads. `expect`, `TIMEOUTS` and `testIds` are already imported; import nothing else. Change nothing else in the spec. Then, with the source still unchanged, run in the background `FRONTEND_PORT=5273 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/qht-a11y-red --no-db-reset --project contestant-a11y-scan`, then `node tests/scripts/e2e-evidence.mjs tests/e2e-runs/qht-a11y-red`. Accept the red only if the wrapper exited 1 and `node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/qht-a11y-red --failed-test cand-profile --failure-contains 'contact support'` exits 0: the two cand-profile scans, and nothing else, failed, at the link locator. A failure elsewhere, or at the name-state assertion, means a premise of this plan is wrong: stop and report it.

3. Component test red first. In PROFILE/page.svelte.test.ts, above the `fakeContestantContext` call, add a `SUPPORT_EMAIL` constant (`support@example.org`) and a small table of the two locked keys, `dynamic.contestantAppBasicInfo.identity.name.locked.candidate` and `.organization`, each mapped to the key itself followed by one space and `{contactSupportLink}`. In the fake's members, add `admin: { email: SUPPORT_EMAIL }` to `appSettings` (ContactSupport reads `appSettings.admin.email` for the email action and would throw without it) and a `t` that answers the table's sentence or, for every other key, the key, with each `{name}` replaced by the param of that name when one is given, the shape `ContactSupport.svelte.test.ts` already uses. Extend the file's docblock sentence "Messages are their keys." to say the two locked name sentences are their keys followed by the support link's placeholder. Update the cases: in "renders both name inputs locked for a confirmed candidate before the store holds its data" and in "renders both fields locked with no badge for a confirmed organization, and its colour editable", expect the note's text to be the key, one space and `contestantApp.common.contactSupportLink`; the note to be a `P` with classes `mx-md` and `text-start` and without `text-center`; exactly one `a` inside it, whose text is `contestantApp.common.contactSupportLink` and whose `href` starts with `mailto:` followed by SUPPORT_EMAIL and `?subject=`; and keep the existing id and `aria-describedby` pins. In the two editable cases ("renders both name inputs enabled and required for an unconfirmed candidate" and "renders an editable name that requires the default locale, an optional short name and one colour field") add that the note holds no `a`. Keep every test title. Run the test file and see the new assertions fail (red) before step 4.

4. The catalogues (per todo; every locale, both variants). In each `apps/frontend/messages/<locale>/dynamic.json`, change only `dynamic.contestantAppBasicInfo.identity.name.locked.candidate` and `.organization`. The placeholder stands where the locale's link words `contestantApp.common.contactSupportLink` read naturally, following the existing `{contactSupportLink}` sentences of the same locale; leave the first sentence of each string as it is. The second sentences become:
   - en: candidate "If it is wrong, please {contactSupportLink}."; organization "If they are wrong, please {contactSupportLink}." (renders exactly as before)
   - fi: "Jos nimessä on virhe, {contactSupportLink}."; "Jos niissä on virhe, {contactSupportLink}." (as before)
   - sv: "Om det är fel, {contactSupportLink}."; "Om de är fel, {contactSupportLink}." (as before)
   - da: "Hvis det er forkert, {contactSupportLink}."; "Hvis de er forkerte, {contactSupportLink}." (renders "kontakt support")
   - et: "Kui see on vale, {contactSupportLink}."; "Kui need on valed, {contactSupportLink}." (renders "võta ühendust toega")
   - fr: "S’il est incorrect, {contactSupportLink}."; "S’ils sont incorrects, {contactSupportLink}." (renders "contactez l’assistance"; keep the typographic apostrophe)
   - lb: "Wann e falsch ass, {contactSupportLink}."; "Wa se falsch sinn, {contactSupportLink}." (renders "kontaktéiert de Support")
   Edit no other key and no other file of `apps/frontend/messages/`; the messages README's rules 3 and 4 (same placeholder set in every locale) then hold.

5. The page. In PROFILE/+page.svelte, import `ContactSupport` from `$lib/dynamic-components/contactSupport`. Replace the `nameSentence` derived (a translated string) with a derived that answers, for the current name state, either nothing or the member from `NAME_SENTENCE` together with its translation key, typed `TranslationKey` (import the type from `$types`, as `ContactSupport.type.ts` does); keep `NAME_SENTENCE` and its TSDoc. In the identity section, where the `<p class="mx-md" id={NAME_NOTE_ID} data-testid="contestant-profile-name-note">` stands: for the `locked` member render `ContactSupport` with `sentence` set to that key, `action="email"`, `id={NAME_NOTE_ID}`, `class="mx-md text-start"` (start-aligned like today; `text-start` replaces the block's `text-center`) and the same `data-testid`; for the `editable` member keep the plain `<p>` with the `t()` of its key, unchanged. Both `aria-describedby` props of the name inputs (multilingual and single-line) read the new derived's presence where they read `nameSentence` today. Read `contestantCtx.X` for every reactive accessor; destructure nothing new (CLAUDE.md Context Destructuring Rule). In the page's top docblock, extend the identity-section bullet's "the section says which" so it says the sentence of a locked name links to an email to support. Change nothing in ContactSupport.

6. Green. Run the three unit files and the message gate of the verify block; all exit 0. Then run in the background `FRONTEND_PORT=5273 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/qht-a11y-green --no-db-reset --project contestant-a11y-scan` and `node tests/scripts/e2e-evidence.mjs tests/e2e-runs/qht-a11y-green`: wrapper exit 0, the verdict below exits 0, and contestant-a11y-scan shows its step-1 count, all passed.

7. Commit. Run `yarn prettier --write` on the ten changed source and test files, then stage exactly those ten files by path, and commit them as one commit `feat: link to support from the locked-name sentence`, its body saying that the locked-name sentence of the profile now links to the support email in every locale and that the candidate profile's scan proves the link is there, ending with the attribution lines your own system reminder gives. The BASE file is a planning record and is not part of the code commit.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit '(nominated)/profile/page.svelte.test.ts' src/lib/dynamic-components/contactSupport/ContactSupport.svelte.test.ts src/lib/i18n/tests/translations.test.ts && B=$(cat .planning/workstreams/deployment/quick/261123-qht-make-contact-support-a-link-in-the-locke/261123-qht-BASE) node -e 'const fs=require("fs"),cp=require("child_process");const B=process.env.B;const bad=[];let n=0;for(const l of ["da","en","et","fi","fr","lb","sv"]){const f="apps/frontend/messages/"+l+"/";const now=JSON.parse(fs.readFileSync(f+"dynamic.json","utf8")).dynamic.contestantAppBasicInfo.identity.name.locked;const was=JSON.parse(cp.execSync("git show "+B+":"+f+"dynamic.json").toString()).dynamic.contestantAppBasicInfo.identity.name.locked;const w=JSON.parse(fs.readFileSync(f+"contestantApp.common.json","utf8"))["contestantApp.common"].contactSupportLink;for(const t of ["candidate","organization"]){const s=now[t];if(s.split("{contactSupportLink}").length===2&&(s.endsWith(", {contactSupportLink}.")||s.endsWith(" please {contactSupportLink}.")))n++;else bad.push(l+"."+t);if(["en","fi","sv"].includes(l)&&s.replace("{contactSupportLink}",w)!==was[t])bad.push(l+"."+t+" rendered text changed");}}console.log("placeholders "+n+"/14",bad.join("; "));process.exit(n===14&&bad.length===0?0:1)' && test "$(grep -v '^\s*//' 'apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte' | grep -c 'ContactSupport')" -ge 2 && test "$(cat tests/e2e-runs/qht-a11y-red/wrapper-exit)" = 1 && node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/qht-a11y-red --failed-test cand-profile --failure-contains 'contact support' && test "$(cat tests/e2e-runs/qht-a11y-green/wrapper-exit)" = 0 && node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/qht-a11y-green --passed contestant-a11y.spec.ts --passed-test cand-profile</automated>
    Baselines measured at HEAD 46554181e: locked sentences holding the placeholder once, out of 14 [HEAD=0 EXPECT==14]; `ContactSupport` in PROFILE/+page.svelte outside `//` lines [HEAD=0 EXPECT>=2]; the two unit files pass 80 of 80 after `yarn build` and must still pass all of theirs (an invariant, not a change measure: the cases gain assertions, not tests, and their red is step 3's run); the run directories do not exist at HEAD. If a void run forced a rerun, substitute that run's directory.
  </verify>
  <done>A confirmed candidate's and a confirmed organization's profile show the locked sentence with its support words as a mailto link, in all seven locales, with en, fi and sv reading as before; the component test pins the link, its href and words, the sentence's id, test id, alignment and description role, and no link in the editable sentence; the candidate-profile scans were red at the link locator before the change and are green after it; one code commit holds the ten files.</done>
</task>

<task type="auto">
  <name>Task 2: The wide gates, and one targeted run of every project that drives the profile page</name>
  <files>(no file is edited unless a gate requires it; then only the Task 1 files it names)</files>
  <precondition>Task 1's commit is HEAD (`git log -1 --format=%s` reads `feat: link to support from the locked-name sentence`), and the Task 1 stack precondition still holds.</precondition>
  <action>
1. Gates, each run in the background into a file and judged by its exit status: `yarn workspace @openvaa/frontend paraglide:compile` then `yarn workspace @openvaa/frontend test:unit src/lib/i18n/tests/compiledMessages.test.ts` (every compiled message in every locale answers); `yarn workspace @openvaa/frontend test:unit` (the whole frontend unit suite); `yarn workspace @openvaa/frontend check` (svelte-check `--fail-on-warnings`, 0 errors and 0 warnings at HEAD); `yarn lint:check` (it includes the typechecks, `assert:a11y-scan-wiring`, `assert:i18n-catalog-namespaces` and `assert:comment-hygiene`); `yarn prettier --check` on the ten changed files. Run the frontend unit suite with the stack up: the root `yarn test:unit` needs the stack, and this plan does not use it.

2. If a gate is red because of this plan's change, fix the cause in the Task 1 file it names, stage only that file, and, while Task 1's commit is still HEAD, `git commit --amend --no-edit` (a local, unpushed commit; the history then shows only the final outcome). Re-run the gates the fix touches. A gate that is red for a reason this plan did not cause is reported in the SUMMARY with its evidence, not fixed here.

3. One targeted run after the last code commit. The source change serves the profile route, and the projects whose tests drive that page are contestant-a11y-scan, contestant-journey, contestant-entity-selection, perm-localisation-positive, perm-organization-editing (whose locked-confirmed organization profile and its axe scans show the organization sentence's link) and perm-unnominated-entities. The wrapper takes one `--project`; `--project perm-unnominated-entities` pulls all the others in as dependencies (the perm chain's anchor holds the first three, and the chain runs perm-localisation-positive and perm-organization-editing before it), so one run covers all six: run in the background `FRONTEND_PORT=5273 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/qht-profile-final --no-db-reset --project perm-unnominated-entities` (about 450 tests; poll, expect well over ten minutes), then `node tests/scripts/e2e-evidence.mjs tests/e2e-runs/qht-profile-final`. It must exit 0, not void, with no failed, flaky or did-not-run test, and with each of the six projects at its Task 1 `--list` count, all passed.

4. Record in the SUMMARY: the base commit and the code commit; the red and green run directories with their verdicts; for each of the six projects its count in this run, its `--list` count at base (delta 0) and its count in `tests/e2e-runs/189.1-final-20261122T094916Z` with the note that that run predates the 2026-11-22 pull (contestant-entity-selection 51 there, and perm-unnominated-entities then named perm-no-nomination with 68); that no test title changed (the cand-profile reach adds no test); and the phase-end full-suite run as still owed by phase 189.1 against these summed deltas (0).
  </action>
  <verify>
    <automated>test "$(git log -1 --format=%s)" = "feat: link to support from the locked-name sentence" && test "$(cat tests/e2e-runs/qht-profile-final/wrapper-exit)" = 0 && node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/qht-profile-final --passed contestant-a11y.spec.ts --passed contestant-journey.spec.ts --passed contestant-entity-selection.spec.ts --passed perm-localisation-positive.spec.ts --passed perm-organization-editing.spec.ts --passed perm-unnominated-entities.spec.ts && node -e 'const s=require("./tests/e2e-runs/qht-profile-final/summary.json");const want={"contestant-a11y-scan":34,"contestant-entity-selection":48,"contestant-journey":3,"perm-localisation-positive":2,"perm-organization-editing":47,"perm-unnominated-entities":70};let ok=s.wrapperExit===0&&!s.void&&s.counts.failed===0&&s.counts.flaky===0&&s.counts.didNotRun===0;for(const [p,n] of Object.entries(want)){const b=s.byProject[p];console.log(p,b?b.passed+"/"+b.total:"absent","expect",n);if(!b||b.total!==n||b.passed!==n)ok=false;}process.exit(ok?0:1)'</automated>
    The `want` counts are planning's `--list` counts at HEAD 46554181e (contestant-a11y-scan 34, contestant-entity-selection 48, contestant-journey 3, perm-localisation-positive 2, perm-organization-editing 47, perm-unnominated-entities 70). They are invariants this plan must not move (delta 0), not change measures, so they carry no HEAD/EXPECT pair; if Task 1 recorded different `--list` counts at base, use those. The step 1 gates are judged by their own exit statuses; svelte-check reported 0 errors and 0 warnings at HEAD and must still.
  </verify>
  <done>The frontend unit suite, the compiled-messages and translations tests, svelte-check with warnings as failures, `yarn lint:check` and Prettier pass; one targeted run after the last code commit is green with all six profile-driving projects at their base counts; the SUMMARY records the counts, deltas, title pins and run directories, and leaves the phase-end full run to phase 189.1.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| translation catalogue / runtime translation override -> rendered HTML | The locked sentence moves from text interpolation to ContactSupport's `{@html sanitizeHtml(...)}`, so markup a translation or an override carries is now parsed as HTML instead of shown as text |
| page -> mail client | The link hands the user's mail client a `mailto:` URL built from settings and a translated subject |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qht-01 | Tampering | PROFILE/+page.svelte through ContactSupport's sentence mode | medium | mitigate | No new `{@html}`: the page reuses ContactSupport, which escapes the href and the link words with `escapeHtml` and sanitises the whole sentence with `sanitizeHtml`; its existing "renders no script or event handler a translation carries, and keeps the link" case keeps proving that, and Task 2 runs it in the frontend unit suite |
| T-qht-02 | Information disclosure | the mailto subject and body (`getEmailUrl`, default metadata) | low | accept | The same email ContactSupport's `'email'` action already opens on the Help page; the user sees it in their own mail client before sending, and the address is the deployment's public support address |
| T-qht-SC | Tampering | npm/pip/cargo installs | high | accept | No package is installed or upgraded by this plan; the legitimacy gate has nothing to check |
</threat_model>

<verification>
- Task 1 verify: the unit files pass, the message gate reads 14/14 with en, fi and sv rendering as at base, the page renders ContactSupport, the red run failed only in the two cand-profile scans at the link locator, and the green run passed.
- Task 2 verify: the code commit is HEAD, the targeted run after it is green, and the six profile-driving projects hold their base counts.
- WCAG 2.1 AA: the link is a real `<a href>` with its words as its accessible name, reachable by Tab, underlined inside the sentence (ContactSupport's `underline` class), and scanned by axe in light and dark on the candidate profile (contestant-a11y-scan) and the confirmed organization profile (perm-organization-editing).
</verification>

<success_criteria>
- The locked-name sentence of both entity types links to the support email in all seven locales, through the existing ContactSupport sentence mode, with the link words translated.
- The component test and the candidate-profile scan reach pin the link; the scan assertion was red first and then green.
- Every frontend gate and `yarn lint:check` pass, and one targeted green E2E run after the code commit covers every project that drives the profile page with a test-count delta of 0.
- Only this plan's files are committed; the unrelated working-tree changes are untouched.
</success_criteria>

<output>
Create `.planning/workstreams/deployment/quick/261123-qht-make-contact-support-a-link-in-the-locke/261123-qht-SUMMARY.md` when done
</output>
