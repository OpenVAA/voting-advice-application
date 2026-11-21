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
const a01 = ROUTE.CandAppHome;
const a02 = settings.dataAdapter.supportsCandidateApp;
const a03 = t('candidateApp.common.greeting');
const a04 = customization.candPoster;
type A05 = CandidateUserData;
const a06 = data.candidateUserData;
const a07 = getCandidateContext();
import a08 from './candidateContext.svelte';
const candCtx = a07;
const candidateCtx = a07;
import CandidateNav from './nav';
if (isCandidateRoute(id)) a01();
const a13 = CANDIDATE_PROT;
const a14 = CANDIDATE_GATE;
import a15 from '$candidate/components/x';
import a16 from '$lib/candidate/utils/x';
import a17 from '$lib/contexts/candidate';
import a18 from '$lib/dynamic-components/navigation/candidate';
type A19 = CandidateLoginError | CandidatePreregistrationError;
const a20 = CANDIDATE_LOGIN_ERROR;
const a21 = CANDIDATE_PREREGISTRATION_ERROR;
const a22 = 'perm-disable-candidate-app';
const a23 = 'candidate-app-menu';
appType.set('candidate');
if (appType.current === 'candidate') a01();
type A26 = 'admin' | 'candidate' | 'voter' | undefined;
const a27 = ROUTE.ContestantAppAuthCallback;
// @as apps/frontend/src/lib/routes/route.ts
export const CANDIDATE = '/x';
// @as apps/frontend/src/lib/routes/appGates.ts
const gate = { name: 'Candidate App' };
// @as scripts/fixtures/assert-no-candidate-app-names.input.ts

// ── POSITIVE: urls ──
const b01 = '/api/candidate/auth/callback';
const b02 = ROUTE.CandAppAuthLogout;
const b03 = 'apps/frontend/src/routes/candidate/+layout.svelte';
await page.goto('/candidate/login');
const b05 = /\/candidate(\/|$|\?|#)/;
const b06 = { redirectTo: 'candidate/profile' };
const b07 = 'candidate%2Fprofile';
const b08 = '/images/hero-candidate.png';
const b09 = path.join('candidate', '+layout.server.ts');
import b10 from '../candidate/+layout.server';
const b11 = '/candidate-portal';

// ── POSITIVE: tests ──
import c01 from '../fixtures/candidate/x';
const c02 = 'candidate-bank-auth.spec.ts';
const c03 = 'cold-entry-dataroot-candidate';
const c04 = 'data-setup-candidate-journey';
const c05 = 'candidate-a11y-scan';
import c06 from './candidateJourneyConstants';
test('x @cand-session', () => {});
const c08 = 'candidate-preview-desktop.png';
const c09 = 'candidate-home-continue';
const c10 = testIds.candidate.home;
const c11 = new CandidateLoginPage(page);
const c12 = candidateLogoutButton;
type C13 = CandidateJourneyFixtures;
const c14 = candidateTest;
await setupCandidateSession();
const c16 = CANDIDATE_AXE_ROUTES;
type C17 = CandidateAxeRoute;
const c18 = candidateA11ySrc;
assertCandidateReach();
const candidateLoad = 1;
const c21 = candidateProjectMatch;
const c22 = 'cand-nav-menu';
const c23 = '[notif-cand]';
import c24 from './candidateHome.helpers';

// ── POSITIVE: prose ──
const d01 = 'the candidate-app login form';
const d02 = 'The Candidate App is closed.';
const d03 = 'a candidate application for parties';
const d04 = 'Candidate apps';

// ── POSITIVE: an app-level name beside an exempt name is still reported ──
// @as apps/supabase/supabase/functions/account-access/index.ts
const e01 = settings.candidateApp;
// @as scripts/fixtures/assert-no-candidate-app-names.input.ts
const e02 = functions.invoke('account-access') && data.candidateUserData;
const e03 = 'Candidate app' + ' is the candidate app';

// ── NEGATIVE: entity-typed forms, the exempt names, forms outside a path scope ──
const n01 = '/results/candidates/candidate/123';
const n02 = '/results/organizations/candidate';
const n03 = '/alliances/candidate';
import n04 from './variants/candidate';
const n05 = 'proj/candidate/portrait.jpg';
const n06 = 'entity/candidate/0000/editor';
const n07 = 'voter/candidate matching, a Voter/candidate pair, a user/candidate row, party/candidate and faction/candidate lists';
const n08 = 'candidate/party, candidate/faction, candidate/organization, candidate/question, candidate/voter';
const n09 = 'results/candidate and candidate/candidate';
const n10 = rpc('get_entity_user_data');
const n11 = functions.invoke('account-access');
import n12 from '../account-access/envConfig.ts';
type UserRole = 'candidate' | 'admin';
const n14 = 'voter-results-candidate-section';
const n15 = testIds.voter.results.candidateSection;
const n16 = ENTITY_TYPE.Candidate;
import CandidateCard from './CandidateCard.svelte';
import n18 from './candidateRecord.ts';
const n19 = from('candidates').select('*');
const n20 = candidateNomination;
const n21 = 'nominationNoElection' ?? 'candidateNoNomination';
const n22 = userData.candidate;
const n23 = 'NOT A TIDY-UP CANDIDATE';
const n24 = '/candidates';
const n25 = './candidate.svelte';
const n26 = 'node scripts/assert-no-candidate-app-names.mjs';
const n27 = 'yarn assert:no-candidate-app-names';
const n28 = { target_type: 'candidate' };
const n29 = { candidate: 'Candidate app', organization: "Party app", candidateAndOrganization: 'Candidate and party app' };
// @as apps/frontend/messages/en/example.json
const n30 = 'Candidate Application Not Available';
const n31 = 'Open /candidate/help, candidate/help or candidate%2Fhelp';
// @as apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md
const n33 = 'The Candidate App can be closed.';
// @as scripts/fixtures/assert-no-candidate-app-names.input.ts
const n35 = '/publishers-guide/data-collection/moderation-of-candidate-answers';
expect(rejection.message).toMatch(/candidate lookup failed/i);
const n37 = { candidateTab: /candidate/i };
const n38 = '/contestant/candidate/123/profile';
