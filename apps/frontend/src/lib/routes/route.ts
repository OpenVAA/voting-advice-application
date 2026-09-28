/**
 * The SvelteKit route-group segment marking a route that sits behind an auth gate.
 *
 * This is the single definition of the pattern. `CANDIDATE_PROT` and `ADMIN_PROT` below are built from it, every `(protected)` route id in `ROUTE` is built from those two, and `isProtectedRoute` reads it — so the request hook, the route tree and the route map cannot drift into two agreeing strings.
 */
export const PROTECTED_GROUP = '(protected)';

/** Root route id of the Candidate App. */
export const CANDIDATE = '/candidate';
/** Route-id prefix of the Candidate App routes that require a signed-in candidate. */
export const CANDIDATE_PROT = `${CANDIDATE}/${PROTECTED_GROUP}`;
/** Root route id of the Voter App. */
export const VOTER = '/(voters)';
/** Route-id prefix of the Voter App routes that require a selected election and constituency. */
export const VOTER_LOCATED = `${VOTER}/(located)`;
/** Root route id of the Admin App. */
export const ADMIN = '/admin';
/** Route-id prefix of the Admin App routes that require the admin role. */
export const ADMIN_PROT = `${ADMIN}/${PROTECTED_GROUP}`;

/**
 * True when `routeId` names a route inside the Candidate App.
 *
 * Takes a SvelteKit ROUTE ID, never a pathname. A route id carries no base path and no locale prefix, and its dynamic segments are placeholders rather than values, so this cannot be tripped by serving the app from a `/candidate/…` subpath, nor by a voter route whose params happen to contain the word (an entity id, a constituency slug).
 *
 * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
 * @returns `true` when the id is the Candidate App root or sits below it.
 */
export function isCandidateRoute(routeId: string): boolean {
  return routeId === CANDIDATE || routeId.startsWith(`${CANDIDATE}/`);
}

/**
 * True when `routeId` names a route behind the `(protected)` route group.
 *
 * Splits on the path separator and compares whole segments. A substring test would also match a route id that merely CONTAINS the group name inside a larger segment, which is the privilege-escalation shape this predicate exists to rule out.
 *
 * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
 * @returns `true` when any segment of the id is exactly the protected group.
 */
export function isProtectedRoute(routeId: string): boolean {
  return routeId.split('/').includes(PROTECTED_GROUP);
}

/**
 * Available routes and their ids.
 */
export const ROUTE = {
  // Voter App
  About: `${VOTER}/about`,
  Elections: `${VOTER}/elections`,
  Constituencies: `${VOTER}/constituencies`,
  /** The Help route is currently redirected to About */
  Help: `${VOTER}/about`,
  Home: VOTER,
  Info: `${VOTER}/info`,
  Intro: `${VOTER}/intro`,
  Nominations: `${VOTER}/nominations`,
  Privacy: `${VOTER}/privacy`,
  Question: `${VOTER_LOCATED}/questions/[questionId]`,
  QuestionCategory: `${VOTER_LOCATED}/questions/category/[categoryId]`,
  Questions: `${VOTER_LOCATED}/questions`,
  // Results routes — 4-segment optional shape (see `src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`).
  // Route params:
  //   - electionTab   (freeform)              — SELECTED election (singular) whose results are being rendered.
  //   - entityTab     (matcher etPl)          — `candidates` | `organizations` | `alliances` (list tab).
  //   - entity        (matcher etSg)          — `candidate`  | `organization`  | `alliance`  (drawer entity type).
  //   - id            (any)                   — entity id for the drawer.
  // Name-disjoint dissociation: `electionTab` (route key, SELECTED singular) and `electionId` (search key, AVAILABLE array; PERSISTENT_SEARCH_PARAMS member at `params.ts`) are literally different identifiers throughout the codebase — they never alias. `constituencyId` continues to travel as a persistent search param.
  ResultCandidate: `${VOTER_LOCATED}/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`,
  ResultEntity: `${VOTER_LOCATED}/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`,
  ResultParty: `${VOTER_LOCATED}/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`,
  Results: `${VOTER_LOCATED}/results`,
  Statistics: `${VOTER_LOCATED}/results/[[electionTab]]/statistics`,

  // Candidate App
  CandAppForgotPassword: `${CANDIDATE}/forgot-password`,
  CandAppHelp: `${CANDIDATE}/help`,
  CandAppHome: CANDIDATE,
  CandAppPreview: `${CANDIDATE_PROT}/preview`,
  CandAppPrivacy: `${CANDIDATE}/privacy`,
  CandAppProfile: `${CANDIDATE_PROT}/profile`,
  CandAppQuestion: `${CANDIDATE_PROT}/questions/[questionId]`,
  CandAppQuestions: `${CANDIDATE_PROT}/questions`,
  CandAppPreregister: `${CANDIDATE}/preregister`,
  CandAppPreregisterIdentityProviderCallback: '/api/oidc/callback',
  CandAppPreregisterElection: `${CANDIDATE}/preregister/elections`,
  CandAppPreregisterConstituency: `${CANDIDATE}/preregister/constituencies`,
  CandAppPreregisterEmail: `${CANDIDATE}/preregister/email`,
  CandAppPreregisterStatus: `${CANDIDATE}/preregister/status`,
  CandAppLogin: `${CANDIDATE}/login`,
  CandAppRegister: `${CANDIDATE}/register`,
  CandAppSetPassword: `${CANDIDATE}/register/password`,
  CandAppResetPassword: `${CANDIDATE}/password-reset`,
  CandAppSettings: `${CANDIDATE_PROT}/settings`,
  // The two auth endpoints sit under the generic API prefix rather than under the candidate app, so the admin app can address the same handlers. Their keys keep the candidate naming because their paths do: the token exchange and the cookie clearing are the candidate flow's, and only their location is generic.
  CandAppAuthCallback: '/api/candidate/auth/callback',
  CandAppAuthLogout: '/api/candidate/auth/logout',

  // Admin App
  AdminAppHome: ADMIN,
  AdminAppJob: `${ADMIN_PROT}/jobs/[jobId]`,
  AdminAppJobs: `${ADMIN_PROT}/jobs`,
  AdminAppFactorAnalysis: `${ADMIN_PROT}/factor-analysis`,
  AdminAppQuestionInfo: `${ADMIN_PROT}/question-info`,
  AdminAppArgumentCondensation: `${ADMIN_PROT}/argument-condensation`,
  AdminAppLogin: `${ADMIN}/login`
} as const;

/**
 * Any allowed route.
 */
export type Route = keyof typeof ROUTE;

/**
 * A special id used to mark the question to start from before question ids are available
 */
export const FIRST_QUESTION_ID = '__first__';

/**
 * Route parameters automatically added to certain routes.
 */
export const DEFAULT_PARAMS: Partial<Record<Route, Record<string, string>>> = {
  Question: { questionId: FIRST_QUESTION_ID },
  ResultCandidate: { entityTab: 'candidates', entity: 'candidate' },
  ResultParty: { entityTab: 'organizations', entity: 'organization' }
};
