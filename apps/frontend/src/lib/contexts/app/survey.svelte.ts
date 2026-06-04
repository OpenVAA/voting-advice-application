/**
 * A rune-shaped read handle: a value exposed via a `current` getter so the
 * producer can take a reactive read-dependency without a store bridge.
 */
type ReactiveHandle<TValue> = { readonly current: TValue };

/**
 * A link to the user survey, including the session ID, or `undefined` if the survey is not configured.
 *
 * Pure-rune producer (CTX-06): reads its `appSettings` / `sessionId` inputs via
 * `.current` getters — no store bridge over the inputs nor the output. The
 * store-shaped exported surface (`$surveyLink` consumers) is owned by the
 * `appContext` seam, which wraps this handle back to a readable store.
 */
export function surveyLink({
  appSettings,
  sessionId
}: {
  appSettings: ReactiveHandle<AppSettings>;
  sessionId: ReactiveHandle<string | undefined>;
}): ReactiveHandle<string | undefined> {
  const linkValue = $derived.by(() => {
    const linkTemplate = appSettings.current.survey?.linkTemplate;
    return linkTemplate ? linkTemplate.replace(/\{\s*sessionId\s*\}/, sessionId.current ?? '') : undefined;
  });

  return {
    get current() {
      return linkValue;
    }
  };
}
