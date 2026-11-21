import type { BrowserContext, Page, Request, Route } from '@playwright/test';

/** What a route is set on: a page, or a browser context and so every page of it. */
export type RouteTarget = Pick<Page, 'route'> | Pick<BrowserContext, 'route'>;

/** The URLs a route answers, in any form `page.route()` takes. */
export type RouteUrl = Parameters<Page['route']>[0];

/** A route's handler, as `page.route()` takes it. */
export type RouteHandler = (route: Route, request: Request) => Promise<unknown> | unknown;

/** Ends a route made by {@link routeUntilEnded}. Calling it again does nothing. */
export type EndRoute = () => void;

/**
 * Route requests through a handler until the returned function is called, without ever turning the browser's request interception off while the test runs.
 *
 * Removing a page's last route with `unroute()` turns Chromium's request interception off, and a request the page starts while that is being done can be held by the browser and never answered: nothing tells the test, and the page waits for it for good. So the handler stays registered for the life of the page or context. Once ended, it passes every request on with `route.fallback()`, to the routes set before it and then to the network, as if it were not there.
 *
 * The suite's lint configuration forbids `unroute()` and `unrouteAll()`; end a route with this instead.
 *
 * @param target - The page or browser context whose requests are routed.
 * @param url - The URLs the handler answers.
 * @param handler - The handler, called for each such request until the route is ended.
 * @returns The function that ends the route.
 */
export async function routeUntilEnded(target: RouteTarget, url: RouteUrl, handler: RouteHandler): Promise<EndRoute> {
  let ended = false;
  await target.route(url, async (route, request) => {
    if (ended) return route.fallback();
    return handler(route, request);
  });
  return () => {
    ended = true;
  };
}
