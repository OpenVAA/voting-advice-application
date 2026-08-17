import type { ReactiveHandle } from './reactiveHandle.type';

/**
 * A link to the user survey, including the session ID, or `undefined` if the survey is not configured.
 *
 * Pure-rune producer: reads its `appSettings` / `sessionId` inputs via
 * `.current` getters — no store bridge over the inputs nor the output. The
 * store-shaped exported surface (`$surveyLink` consumers) is owned by the
 * `appContext` seam, which wraps this handle back to a readable store.
 */
class Survey {
  readonly #appSettings: ReactiveHandle<AppSettings>;
  readonly #sessionId: ReactiveHandle<string | undefined>;

  #linkValue = $derived.by(() => {
    const linkTemplate = this.#appSettings.current.survey?.linkTemplate;
    return linkTemplate ? linkTemplate.replace(/\{\s*sessionId\s*\}/g, this.#sessionId.current ?? '') : undefined;
  });

  constructor({
    appSettings,
    sessionId
  }: {
    appSettings: ReactiveHandle<AppSettings>;
    sessionId: ReactiveHandle<string | undefined>;
  }) {
    this.#appSettings = appSettings;
    this.#sessionId = sessionId;
  }

  // Prototype getter is SAFE here: surveyLink is consumed via DIRECT property
  // access at appContext (`surveyLink: survey`), never spread.
  get current(): string | undefined {
    return this.#linkValue;
  }
}

export function surveyLink({
  appSettings,
  sessionId
}: {
  appSettings: ReactiveHandle<AppSettings>;
  sessionId: ReactiveHandle<string | undefined>;
}): ReactiveHandle<string | undefined> {
  return new Survey({ appSettings, sessionId });
}
