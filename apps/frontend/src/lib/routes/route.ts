import { API_ROOT, UNIVERSAL_API_ROUTES } from '../api/base/universalApiRoutes';

/**
 * The SvelteKit route-group segment marking a route that sits behind an auth gate.
 *
 * This is the single definition of the pattern. `CONTESTANT_PROT` and `ADMIN_PROT` below are built from it, every `(protected)` route id in `ROUTE` is built from those two, and `isProtectedRoute` reads it — so the request hook, the route tree and the route map cannot drift into two agreeing strings.
 */
export const PROTECTED_GROUP = '(protected)';

/** Root route id of the Contestant App. */
export const CONTESTANT = '/contestant';
/** Route-id prefix of the Contestant App routes that require a signed-in candidate. */
export const CONTESTANT_PROT = `${CONTESTANT}/${PROTECTED_GROUP}`;
/**
 * Route-id prefix of every entity-level route of the Contestant App: the entity home and the pages below it, which show or edit one entity.
 *
 * The two param segments name the selected entity: `entityType`, admitted by the `servedEntityType` matcher, and `entityId`, admitted by the `uuid` matcher. A path whose segments fail either matcher matches no entity route.
 *
 * Every entity key of `ROUTE` is built from it, so the place of an entity in a route id is stated once.
 */
export const CONTESTANT_ENTITY = `${CONTESTANT_PROT}/[entityType=servedEntityType]/[entityId=uuid]`;
/**
 * Route-id prefix of the entity pages that open only while the entity has a nomination: the profile, the questions with each question's page, and the preview.
 *
 * The group adds no URL segment. Its server load leads an entity with no nomination to the entity's home, so the rule is stated once for every page below it. The entity's home, its nominations and its settings are outside the group.
 */
export const CONTESTANT_NOMINATED = `${CONTESTANT_ENTITY}/(nominated)`;
/**
 * Route-id prefix of the three steps of the nomination editor of the entity being edited: the election step, the constituency step and the details step.
 *
 * The group adds no URL segment, so the steps sit directly below the address of the entity's nominations. Its load decides whether the editor is served at all, so the rule is stated once for every step below it. The group is outside the pages that open only while the entity has a nomination, so an entity with none reaches the editor.
 */
export const CONTESTANT_NOMINATION_EDITOR = `${CONTESTANT_ENTITY}/nominations/(edit)`;
/**
 * The search param that carries the elections chosen in the nomination editor from one step to the next. It may be repeated.
 *
 * It is not a persistent search param: a step passes it on by name, so it is on no link that leaves the editor.
 */
export const NOMINATION_ELECTION_PARAM = 'nominationElectionId';
/**
 * The search param that carries the constituencies chosen in the nomination editor from one step to the next. It may be repeated, and like the election param it is not persistent.
 */
export const NOMINATION_CONSTITUENCY_PARAM = 'nominationConstituencyId';
/** Root route id of the Voter App. */
export const VOTER = '/(voters)';
/** Route-id prefix of the Voter App routes that require a selected election and constituency. */
export const VOTER_LOCATED = `${VOTER}/(located)`;
/** Root route id of the Admin App. */
export const ADMIN = '/admin';
/** Route-id prefix of the Admin App routes that require the admin role. */
export const ADMIN_PROT = `${ADMIN}/${PROTECTED_GROUP}`;

/**
 * True when `routeId` names a route inside the Contestant App.
 *
 * Takes a SvelteKit ROUTE ID, never a pathname. A route id carries no base path and no locale prefix, and its dynamic segments are placeholders rather than values, so this cannot be tripped by serving the app from a `/contestant/…` subpath, nor by a voter route whose params happen to contain the word (an entity id, a constituency slug).
 *
 * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
 * @returns `true` when the id is the Contestant App root or sits below it.
 */
export function isContestantRoute(routeId: string): boolean {
  return routeId === CONTESTANT || routeId.startsWith(`${CONTESTANT}/`);
}

/**
 * True when `routeId` names an API endpoint rather than a page.
 *
 * Takes a SvelteKit ROUTE ID, never a pathname, for the reasons given on `isContestantRoute`.
 *
 * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
 * @returns `true` when the id is the API root or sits below it.
 */
export function isApiRoute(routeId: string): boolean {
  return routeId === API_ROOT || routeId.startsWith(`${API_ROOT}/`);
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
  // The statistics page sits BESIDE the election-tab segment rather than under it. Under it, the page would inherit the results layout chain, and those layouts render the results hero, ingress and election picker around their children, which would put the results chrome and a second `<h1>` on the statistics page.
  // This constant and the directory move together or the route 404s.
  Statistics: `${VOTER_LOCATED}/results/statistics`,

  // Contestant App
  ContestantAppForgotPassword: `${CONTESTANT}/forgot-password`,
  ContestantAppHelp: `${CONTESTANT}/help`,
  /** The home of the entity being edited. `ContestantAppHome` is the app root, which carries no entity. */
  ContestantAppEntityHome: CONTESTANT_ENTITY,
  /** Any entity page asked for without an entity, such as `/contestant/profile`. Its load redirects to the same page under the user's entity, so no link is built from this key. */
  ContestantAppEntityResolver: `${CONTESTANT_PROT}/[...page=contestantEntityPage]`,
  ContestantAppHome: CONTESTANT,
  /** The nominations of the entity being edited. It is outside the pages that open only while the entity has a nomination, so an entity with none reaches it too. */
  ContestantAppNominations: `${CONTESTANT_ENTITY}/nominations`,
  /** The constituency step of the nomination editor. */
  ContestantAppNominationConstituencies: `${CONTESTANT_NOMINATION_EDITOR}/constituencies`,
  /** The details step of the nomination editor, where the nominations are written. */
  ContestantAppNominationDetails: `${CONTESTANT_NOMINATION_EDITOR}/details`,
  /** The election step of the nomination editor, which is also the editor's entry: its load forwards to the step that has something to choose. */
  ContestantAppNominationElections: `${CONTESTANT_NOMINATION_EDITOR}/elections`,
  ContestantAppPreview: `${CONTESTANT_NOMINATED}/preview`,
  ContestantAppPrivacy: `${CONTESTANT}/privacy`,
  ContestantAppProfile: `${CONTESTANT_NOMINATED}/profile`,
  ContestantAppQuestion: `${CONTESTANT_NOMINATED}/questions/[questionId]`,
  ContestantAppQuestions: `${CONTESTANT_NOMINATED}/questions`,
  ContestantAppPreregister: `${CONTESTANT}/preregister`,
  ContestantAppPreregisterIdentityProviderCallback: `${API_ROOT}/oidc/callback`,
  ContestantAppPreregisterElection: `${CONTESTANT}/preregister/elections`,
  ContestantAppPreregisterConstituency: `${CONTESTANT}/preregister/constituencies`,
  ContestantAppPreregisterEmail: `${CONTESTANT}/preregister/email`,
  ContestantAppPreregisterStatus: `${CONTESTANT}/preregister/status`,
  ContestantAppLogin: `${CONTESTANT}/login`,
  /** The sign-in screen: the email and password form, and the request for a mailed sign-in link. */
  ContestantAppSignIn: `${CONTESTANT}/login/email`,
  /** The screen shown after a link was asked for by email. It renders only while the entry flow holds a link request, and leads a visitor who arrives with none to the login screen. */
  ContestantAppEmailSent: `${CONTESTANT}/email-sent`,
  /** The registration page, which lists the ways the project lets a visitor register. It is served only where at least one is listed, and leads to the login screen otherwise. */
  ContestantAppRegister: `${CONTESTANT}/register`,
  /** The screen that takes an email address for a registration code nobody has claimed. It renders only while the entry flow holds such a code, and leads a visitor who arrives with none to the registration page. */
  ContestantAppRegisterEmail: `${CONTESTANT}/register/email`,
  /** The screen that signs in the holder of a registration code somebody has claimed, with that code and a password. It renders only while the entry flow holds such a code, and leads a visitor who arrives with none to the registration page. */
  ContestantAppRegisterSignIn: `${CONTESTANT}/register/sign-in`,
  ContestantAppResetPassword: `${CONTESTANT}/password-reset`,
  ContestantAppSettings: `${CONTESTANT_ENTITY}/settings`,
  // The two auth endpoints sit under the generic API prefix because the contestant app and the admin app address the same handlers. Their keys carry no app name for the same reason.
  AuthCallback: `${API_ROOT}/auth/callback`,
  AuthLogout: UNIVERSAL_API_ROUTES.logout,

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
