/**
 * Fixture INPUT for `node scripts/assert-no-candidate-app-names.mjs --self-test`.
 *
 * NOT compiled, NOT imported, NOT linted, NOT formatted (see .prettierignore). Its sibling `assert-no-candidate-app-names.expected.ts.violations` is the exact list of findings the guard must report against this file.
 *
 * Two blocks. Every code line of the POSITIVE block spells a name that says which app and must be reported. No line of the NEGATIVE block may be reported: each spells a name that says which entity type, one of the exempt names, or a form outside a pattern's path scope.
 *
 * A line `// @as <path>` makes the guard treat the lines after it as if they sat in that path.
 */

// ── POSITIVE: symbols ──
const a01 = settings.dataAdapter.supportsCandidateApp;
const a02 = t('candidateApp.common.greeting');
const a03 = getCandidateContext();
import a04 from './candidateContext.svelte';
appType.set('candidate');
if (appType.current === 'candidate') a01();
type A07 = 'admin' | 'candidate' | 'voter' | undefined;

// ── POSITIVE: urls ──
const b01 = '/api/candidate/auth/callback';
const b02 = 'apps/frontend/src/routes/candidate/+layout.svelte';

// ── POSITIVE: prose ──
const d01 = 'The Candidate App is closed.';
const d02 = 'a candidate application for parties';
const d03 = 'Candidate apps';

// ── POSITIVE: an app-level name beside an exempt name is still reported ──
const e01 = ['Candidate app', settings.candidateApp];
const e02 = 'Candidate app' + ' is the candidate app';

// ── NEGATIVE: entity-typed forms, the exempt names, forms outside a path scope ──
const n01 = 'apps/frontend/src/routes/candidates/+page.svelte';
const n02 = '/api/candidates';
type UserRole = 'candidate' | 'admin';
const n04 = testIds.voter.results.candidateSection;
const n05 = ENTITY_TYPE.Candidate;
import CandidateCard from './CandidateCard.svelte';
import n07 from './candidateRecord.ts';
const n08 = from('candidates').select('*');
const n09 = candidateNomination;
const n10 = 'nominationNoElection' ?? 'candidateNoNomination';
const n11 = userData.candidate;
const n12 = 'NOT A TIDY-UP CANDIDATE';
const n13 = 'node scripts/assert-no-candidate-app-names.mjs';
const n14 = 'yarn assert:no-candidate-app-names';
const n15 = { target_type: 'candidate' };
const n16 = { candidate: 'Candidate app', organization: "Party app", candidateAndOrganization: 'Candidate and party app' };
// @as apps/frontend/messages/en/example.json
const n17 = 'Candidate Application Not Available';
// @as apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md
const n18 = 'The Candidate App can be closed.';
