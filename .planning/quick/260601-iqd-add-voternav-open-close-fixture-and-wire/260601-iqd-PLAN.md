---
phase: quick-260601-iqd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/tests/utils/testIds.ts
  - apps/frontend/src/routes/Header.svelte
  - tests/tests/fixtures/candidate/voterNavFixture.fixture.ts
  - tests/tests/fixtures/candidate/perm-l10n.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
autonomous: true
requirements: [PERM-L10N-POS-FIXTURE]

must_haves:
  truths:
    - "The voter nav drawer can be opened from a locale-independent anchor in any UI locale"
    - "A voterNav fixture exposes open() (returning a langSelector) and close(), both idempotent"
    - "perm-localisation-positive opens the nav drawer before every langSelector access"
    - "The entity-details modal is closed before the nav drawer is opened at spec step 10"
  artifacts:
    - path: "tests/tests/fixtures/candidate/voterNavFixture.fixture.ts"
      provides: "createVoterNav(page) function-fixture with open()/close()"
      contains: "createVoterNav"
    - path: "tests/tests/utils/testIds.ts"
      provides: "shared.navigation.menuToggle testid constant"
      contains: "menuToggle"
  key_links:
    - from: "apps/frontend/src/routes/Header.svelte"
      to: "testIds.shared.navigation.menuToggle"
      via: "data-testid attribute on the openDrawer button"
      pattern: "nav-menu-toggle"
    - from: "tests/tests/fixtures/candidate/voterNavFixture.fixture.ts"
      to: "tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts"
      via: "open() returns createLangSelector(page)"
      pattern: "createLangSelector"
    - from: "tests/tests/specs/perm/perm-localisation-positive.spec.ts"
      to: "tests/tests/fixtures/candidate/voterNavFixture.fixture.ts"
      via: "destructured voterNav fixture + voterNav.open()/close() calls"
      pattern: "voterNav"
---

<objective>
Add a `voterNav` open/close function-fixture and wire it into `perm-localisation-positive.spec.ts` so the language selector (which lives inside the voter nav drawer, closed by default) is reachable in every locale before the spec interacts with it.

Purpose: The spec currently calls `langSelector.expectVisible(...)` / `switchTo(...)` (lines 119, 139, 152, 310) without first opening the voter nav drawer. The LanguageSelection NavGroup only renders inside the drawer, so those calls fail. The fix introduces a locale-independent way to open/close the drawer and threads it through the spec.

Output: a locale-independent testid on the header menu-toggle button, a new `voterNavFixture.fixture.ts`, its wiring into the `perm-l10n.ts` composition root, and the spec updated to open the drawer before each language-selector access.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md

<interfaces>
<!-- Executor uses these directly — no codebase exploration needed. -->

testIds.shared.navigation (tests/tests/utils/testIds.ts:249-252):
  navigation: { menu: 'nav-menu', menuItem: 'nav-menu-item' }
  → ADD: menuToggle: 'nav-menu-toggle'

Header.svelte menu-toggle button (apps/frontend/src/routes/Header.svelte:82-93):
  <button onclick={openDrawer} bind:this={drawerOpenElement}
    aria-expanded={isDrawerOpen} aria-controls={menuId}
    aria-label={t('common.openMenu')} disabled={navigationSettings.current.hide}
    class="btn btn-ghost ...">  ← add data-testid={testIds.shared.navigation.menuToggle}
  NOTE: Header.svelte already imports testIds — confirm; if not, add the import.

Drawer nav element carries data-testid="nav-menu" (testIds.shared.navigation.menu).
  Hidden (Playwright-hidden) when closed, visible when open.

Close control (VoterNav.svelte:57):
  <NavItem onclick={navigation.close} ... id="drawerCloseButton" />
  → page.locator('#drawerCloseButton') is locale-independent.

langSelectorFixture (tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts):
  export function createLangSelector(page: Page): {
    expectVisible(locales: string[]): Promise<void>;
    expectHidden(): Promise<void>;
    switchTo(locale: string): Promise<void>;  // triggers FULL page reload
  }
  export type LangSelectorFixture = ReturnType<typeof createLangSelector>;
  RIGIDITY CONTRACT: NO expect.soft, NO try/catch around expect, NO .catch on
  assertion-bearing interactions.

perm-l10n.ts composition root: langSelector is wired as
  langSelector: async ({ page }, use) => { await use(createLangSelector(page)); }
  with type LangSelectorFixture in PermL10nFixtures. Mirror this for voterNav.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add locale-independent menu-toggle testid</name>
  <files>tests/tests/utils/testIds.ts, apps/frontend/src/routes/Header.svelte</files>
  <action>
In tests/tests/utils/testIds.ts, extend the `shared.navigation` object (currently `{ menu: 'nav-menu', menuItem: 'nav-menu-item' }`, lines 249-252) by adding `menuToggle: 'nav-menu-toggle'`. Keep the existing brief comment style consistent with the surrounding block.

In apps/frontend/src/routes/Header.svelte, add `data-testid={testIds.shared.navigation.menuToggle}` to the `<button onclick={openDrawer}>` element at lines 82-93. If `testIds` is not already imported in Header.svelte, add the import from the same path other test-id-bearing components use (`$lib/../tests/...` is NOT importable from app code — instead use a string literal `data-testid="nav-menu-toggle"` to avoid coupling app code to the test utils module). Prefer the string literal `"nav-menu-toggle"` matching the testIds constant value, since app components do not import from the tests workspace.

This gives a locale-independent open-menu anchor — required because by spec line 152 the page is on the Finnish locale and the English-only `/open menu/i` regex used elsewhere will not match.
  </action>
  <verify>
    <automated>grep -q "menuToggle: 'nav-menu-toggle'" tests/tests/utils/testIds.ts && grep -q 'data-testid="nav-menu-toggle"' apps/frontend/src/routes/Header.svelte && echo OK</automated>
  </verify>
  <done>testIds.shared.navigation.menuToggle === 'nav-menu-toggle' and the Header menu-toggle button renders data-testid="nav-menu-toggle".</done>
</task>

<task type="auto">
  <name>Task 2: Create voterNav fixture and wire into perm-l10n composition root</name>
  <files>tests/tests/fixtures/candidate/voterNavFixture.fixture.ts, tests/tests/fixtures/candidate/perm-l10n.ts</files>
  <action>
Create tests/tests/fixtures/candidate/voterNavFixture.fixture.ts following the header-comment + rigidity-contract style of langSelectorFixture.fixture.ts (NO expect.soft, NO try/catch around expect, NO .catch on assertion-bearing interactions). Export `createVoterNav(page: Page)` returning an object with:
  - `open(): Promise<LangSelectorFixture>` — idempotent. First check if the drawer nav (page.getByTestId(testIds.shared.navigation.menu)) is already visible via `.isVisible()`; if visible, skip the click. Otherwise click page.getByTestId(testIds.shared.navigation.menuToggle), then `await expect(menu).toBeVisible()`. Return `createLangSelector(page)` so callers chain language-selection ops.
  - `close(): Promise<void>` — idempotent. If the drawer nav is not visible, return early. Otherwise click page.locator('#drawerCloseButton') (locale-independent), then `await expect(menu).toBeHidden()`.
Import `createLangSelector` and the `LangSelectorFixture` type from './langSelectorFixture.fixture', `testIds` from '../../utils/testIds', and `expect` + `Page` type from '@playwright/test'. Export `type VoterNavFixture = ReturnType<typeof createVoterNav>`.

In tests/tests/fixtures/candidate/perm-l10n.ts, wire voterNav mirroring langSelector: add `import { createVoterNav } from './voterNavFixture.fixture';`, add `import type { VoterNavFixture } from './voterNavFixture.fixture';`, add `voterNav: VoterNavFixture;` to PermL10nFixtures, and add the fixture body `voterNav: async ({ page }, use) => { await use(createVoterNav(page)); }` in the base.extend block.
  </action>
  <verify>
    <automated>cd tests && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "voterNav|langSelector" ; cd .. && grep -q "voterNav: VoterNavFixture" tests/tests/fixtures/candidate/perm-l10n.ts && grep -q "createVoterNav" tests/tests/fixtures/candidate/voterNavFixture.fixture.ts && echo OK</automated>
  </verify>
  <done>voterNavFixture.fixture.ts exports createVoterNav (open returns a LangSelectorFixture, close returns void, both idempotent) and VoterNavFixture; perm-l10n.ts registers the voterNav fixture and type-checks clean.</done>
</task>

<task type="auto">
  <name>Task 3: Wire voterNav into perm-localisation-positive spec</name>
  <files>tests/tests/specs/perm/perm-localisation-positive.spec.ts</files>
  <action>
Add `voterNav` to the destructured fixtures in the test callback (alongside `langSelector`, around line 105). Then, at every point the spec accesses the language selector, open the drawer first and close it when leaving the drawer open would block subsequent page reads. Use the `open()` return value where convenient, but the spec already destructures `langSelector`, so calling `await voterNav.open()` before each `langSelector` access is sufficient.

Specific edits:
  - Before line 119 `langSelector.expectVisible(['en','fi','sv'])`: add `await voterNav.open()`. After the expectVisible call, add `await voterNav.close()` — the drawer overlay covers the home start button read at line 129/135, so the drawer must be closed before reading page content.
  - Before line 139 `langSelector.switchTo('fi')`: add `await voterNav.open()`. No close needed afterward — switchTo triggers a full page reload that tears down the drawer.
  - Before line 152 `langSelector.switchTo('en')`: add `await voterNav.open()`. (Page is on /fi here — the locale-independent toggle testid handles this.) No close needed — switchTo reloads.
  - Before line 310 `langSelector.switchTo('fi')`: the entity-details modal (page.getByRole('dialog'), visible from line 292) covers the header, so the menu-toggle is not clickable. Close the dialog first: press Escape (`await page.keyboard.press('Escape')`) and `await expect(dialog).toBeHidden()`, THEN `await voterNav.open()` before the switchTo. The spec already re-navigates to /fi/results and re-opens the card at lines 319-325 (Assumption A3), so tearing down the dialog here is acceptable. No drawer close needed — switchTo reloads.

Keep the rigidity contract: no expect.soft, no try/catch around expect, no .catch on assertion-bearing interactions.
  </action>
  <verify>
    <automated>grep -c "voterNav.open()" tests/tests/specs/perm/perm-localisation-positive.spec.ts | grep -qE "^[4-9]$" && grep -q "voterNav.close()" tests/tests/specs/perm/perm-localisation-positive.spec.ts && cd tests && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -q "perm-localisation-positive" && echo TSERR || echo OK</automated>
  </verify>
  <done>Spec destructures voterNav; voterNav.open() precedes every langSelector access (4 sites); voterNav.close() follows the line-119 expectVisible; the entity-details dialog is closed before opening the nav at the step-10 switchTo; spec type-checks clean.</done>
</task>

</tasks>

<verification>
- `cd tests && npx tsc --noEmit -p tsconfig.json` reports no errors in the new/edited files.
- `cd tests && yarn lint:check` (or repo lint) passes for the edited files.
- The voter nav drawer opens via a locale-independent testid anchor and closes via `#drawerCloseButton` in both en and fi locales.
- (Full E2E confirmation requires `yarn dev` + the perm-localisation-positive spec run — out of scope for autonomous execution; note in SUMMARY whether the spec was run and its result.)
</verification>

<success_criteria>
- New `voterNavFixture.fixture.ts` exports `createVoterNav` with idempotent `open()` (returns LangSelectorFixture) and `close()`.
- `menuToggle: 'nav-menu-toggle'` testid added to testIds and rendered on the Header menu-toggle button.
- `perm-l10n.ts` registers the `voterNav` fixture and type-checks clean.
- `perm-localisation-positive.spec.ts` opens the drawer before each language-selector access, closes it after the line-119 expectVisible, and closes the entity-details dialog before opening the nav at step 10.
- Only the 5 files this plan touches are staged for commit (NOT the pre-existing unrelated uncommitted changes).
</success_criteria>

<output>
Create `.planning/quick/260601-iqd-add-voternav-open-close-fixture-and-wire/260601-iqd-01-SUMMARY.md` when done.

Commit with `git -c core.hooksPath=/dev/null` (project memory: global hooks are broken). Stage ONLY the 5 files listed in `files_modified` — do NOT stage the pre-existing unrelated changes (LogoutButton.svelte, candidate/+layout.svelte, perm-localisation-positive.ts template, perm-missing-nominations.spec.ts).
</output>
