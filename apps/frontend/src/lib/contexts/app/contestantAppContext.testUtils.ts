/**
 * Present a fake contestant context as the app context of the Contestant App, for a component test whose subject renders a component that reads the app context.
 *
 * The contestant context holds the app context's members, so the fake is returned as it is, with `appType` answering `contestant`. A Proxy rather than a spread, so that the fake's getters are read when the component reads them and not once here.
 *
 * @param context - The fake contestant context.
 * @returns The same fake, read through a view that adds `appType`.
 */
export function asContestantAppContext<TContext extends object>(context: TContext): TContext {
  const appType = { current: 'contestant' as const };
  return new Proxy(context, {
    get: (target, key, receiver) => (key === 'appType' ? appType : Reflect.get(target, key, receiver))
  });
}
