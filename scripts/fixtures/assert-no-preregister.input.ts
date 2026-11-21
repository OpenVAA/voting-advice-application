/**
 * Fixture INPUT for `node scripts/assert-no-preregister.mjs --self-test`.
 *
 * NOT compiled, NOT imported, NOT linted, NOT formatted (see .prettierignore). Its sibling `assert-no-preregister.expected.ts.violations` is the exact list of findings the guard must report against this file.
 *
 * Two blocks. Every code line and every `@path` line of the POSITIVE block spells the stem in a scanned tree and must be reported. No line of the NEGATIVE block may be reported: each spells a near form the rule leaves alone, or the stem outside the scanned trees.
 *
 * A line `// @as <path>` makes the guard treat the code lines after it as if they sat in that path. A line `// @path <path>` is a tracked path the guard judges as a path; it is not read as content.
 */

// @as apps/frontend/src/lib/fixture.ts

// ── POSITIVE: contents ──
const route = buildRoute({ route: 'ContestantAppPreregisterEmail' });
const heading = t('contestantApp.preregister.title');
const response = await fetch('/api/contestant/preregister', { method: 'POST' });
await dataWriter.preregisterWithIdToken({ idToken, email });
const done = contestantCtx.isPreregistered;
const target = buildRoute({ route: PREREGISTER_ROUTE });
throw new Error(CONTESTANT_PREREGISTRATION_ERROR);

// ── POSITIVE: paths ──
// @path apps/frontend/src/routes/contestant/preregister/+page.svelte
// @path apps/frontend/messages/en/contestantApp.preregister.json
// @path apps/frontend/src/routes/api/contestant/preregister/+server.ts
// @path apps/frontend/src/lib/contestant/utils/preregistrationError.ts
// @path tests/tests/fixtures/contestant/contestantPreregisterPage.fixture.ts

// ── NEGATIVE ──
const stored = { preRegistration: { enabled: true } };
expect(issue).toMatchObject({ keys: ['preRegistration'] });
const docs = '/developers-guide/contestant-app/pre-registration-and-invitation';
const flag = PRE_REGISTRATION_ENABLED;
// @path packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
// @path .planning/phases/179/preregister-notes.md
// @path scripts/fixtures/preregister-vocabulary.ts
// @as .planning/phases/179/notes.md
const planned = 'the preregister route';
// @as scripts/assert-other-gate.mjs
const vocabulary = /preregisterWithIdToken/;
