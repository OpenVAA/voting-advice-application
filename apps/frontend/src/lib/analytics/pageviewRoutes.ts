/**
 * The page routes that produce a pageview, each with the route parameters its pageview may carry.
 *
 * A page route added to the tree must be listed here before it ships; a unit test walks the route tree and fails until it is. Listing a route with no names sends its pageview with no parameter. A parameter that identifies an entity or a nomination, or that carries a free path, is never listed, and a listed parameter travels only when its value passes the validator beside it.
 */
import { ROUTE } from '$lib/routes/route';
import { ID_PATTERN } from './constants';
import { match as isEntityTypePlural } from '../../params/etPl';
import { match as isEntityTypeSingular } from '../../params/etSg';
import { match as isServedEntityType } from '../../params/servedEntityType';

/** A check on the value of one route parameter. */
export type ParamValidator = (value: string) => boolean;

/**
 * True when `value` has the form of an identifier.
 *
 * @param value - A route parameter value.
 * @returns Whether the value matches `ID_PATTERN`.
 */
function isId(value: string): boolean {
  return ID_PATTERN.test(value);
}

/** The allowlist of a route whose pageview carries no parameter. */
const NO_PARAMS: Readonly<Record<string, ParamValidator>> = Object.freeze({});

/** The allowlist of every contestant route below the selected entity: the entity type, never the entity id. */
const CONTESTANT_ENTITY_PARAMS: Readonly<Record<string, ParamValidator>> = Object.freeze({
  entityType: isServedEntityType
});

/**
 * Every page route of the three apps, mapped to the parameter names its pageview may carry, each with the validator its value must pass.
 *
 * A key is written with its `ROUTE` constant where `ROUTE` holds that id, and as the literal route id otherwise.
 */
export const PAGEVIEW_ROUTES: Readonly<Record<string, Readonly<Record<string, ParamValidator>>>> = Object.freeze({
  // Voter App
  [ROUTE.Home]: NO_PARAMS,
  [ROUTE.About]: NO_PARAMS,
  [ROUTE.Constituencies]: NO_PARAMS,
  [ROUTE.Elections]: NO_PARAMS,
  [ROUTE.Info]: NO_PARAMS,
  [ROUTE.Intro]: NO_PARAMS,
  [ROUTE.Nominations]: NO_PARAMS,
  [ROUTE.Privacy]: NO_PARAMS,
  [ROUTE.Questions]: NO_PARAMS,
  [ROUTE.Question]: Object.freeze({ questionId: isId }),
  [ROUTE.QuestionCategory]: Object.freeze({ categoryId: isId }),
  // The drawer's entity id is left out: it names the entity the voter opened.
  [ROUTE.ResultEntity]: Object.freeze({
    electionTab: isId,
    entityTab: isEntityTypePlural,
    entity: isEntityTypeSingular
  }),
  [ROUTE.Statistics]: NO_PARAMS,

  // Contestant App
  '/contestant/(protected)': NO_PARAMS,
  // The rest parameter is left out: it can hold any one path segment, and the route only redirects.
  [ROUTE.ContestantAppEntityResolver]: NO_PARAMS,
  [ROUTE.ContestantAppEntityHome]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppNominations]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppNominationConstituencies]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppNominationDetails]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppNominationElections]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppPreview]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppProfile]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppQuestions]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppQuestion]: Object.freeze({ entityType: isServedEntityType, questionId: isId }),
  [ROUTE.ContestantAppSettings]: CONTESTANT_ENTITY_PARAMS,
  [ROUTE.ContestantAppEmailSent]: NO_PARAMS,
  [ROUTE.ContestantAppForgotPassword]: NO_PARAMS,
  [ROUTE.ContestantAppHelp]: NO_PARAMS,
  [ROUTE.ContestantAppLogin]: NO_PARAMS,
  [ROUTE.ContestantAppSignIn]: NO_PARAMS,
  [ROUTE.ContestantAppResetPassword]: NO_PARAMS,
  [ROUTE.ContestantAppPreregister]: NO_PARAMS,
  '/contestant/preregister/(authenticated)/constituencies': NO_PARAMS,
  '/contestant/preregister/(authenticated)/elections': NO_PARAMS,
  '/contestant/preregister/(authenticated)/email': NO_PARAMS,
  [ROUTE.ContestantAppPreregisterStatus]: NO_PARAMS,
  [ROUTE.ContestantAppPrivacy]: NO_PARAMS,
  [ROUTE.ContestantAppRegister]: NO_PARAMS,
  [ROUTE.ContestantAppRegisterEmail]: NO_PARAMS,
  [ROUTE.ContestantAppRegisterSignIn]: NO_PARAMS,

  // Admin App
  '/admin/(protected)': NO_PARAMS,
  [ROUTE.AdminAppArgumentCondensation]: NO_PARAMS,
  [ROUTE.AdminAppJobs]: NO_PARAMS,
  [ROUTE.AdminAppQuestionInfo]: NO_PARAMS,
  [ROUTE.AdminAppLogin]: NO_PARAMS
});

/**
 * True when `routeId` is a page route that produces a pageview.
 *
 * Only the map's own keys count, so a name every object inherits, such as `constructor`, is not a route.
 *
 * @param routeId - A SvelteKit route id, e.g. `page.route.id`.
 * @returns `true` when the id is a key of `PAGEVIEW_ROUTES`.
 */
export function isPageviewRoute(routeId: string): boolean {
  return Object.hasOwn(PAGEVIEW_ROUTES, routeId);
}

/**
 * The route parameters a pageview of `routeId` may carry.
 *
 * Keeps only the names listed for the route whose value is a non-empty string that passes its validator. A failing value is dropped and the rest are kept, so a value typed into the address bar cannot travel as free text. It never throws.
 *
 * @param routeId - A SvelteKit route id, e.g. `page.route.id`.
 * @param params - The route parameters, e.g. `page.params`.
 * @returns A new object holding the allowed parameters; empty for a route that is not listed.
 */
export function allowedPageviewParams(
  routeId: string,
  params: Readonly<Record<string, string | undefined>>
): Record<string, string> {
  const kept: Record<string, string> = {};
  if (!isPageviewRoute(routeId)) return kept;
  for (const [name, isValid] of Object.entries(PAGEVIEW_ROUTES[routeId])) {
    const value = Object.hasOwn(params, name) ? params[name] : undefined;
    if (typeof value === 'string' && value !== '' && isValid(value)) kept[name] = value;
  }
  return kept;
}
