import type { ReactiveHandle } from '../utils/reactiveHandle.type';

/**
 * A link to the user survey, including the visit id when it may be filled, or `undefined` if the survey is not configured.
 *
 * The visit id replaces the `{sessionId}` placeholder of `survey.linkTemplate`. That placeholder is a published setting, so it keeps its name: it is the one place the visit id is spelled `sessionId`.
 *
 * Pure-rune producer: reads its `appSettings` / `visitId` inputs via `.current` getters — no store bridge over the inputs nor the output. The store-shaped exported surface (`$surveyLink` consumers) is owned by the `appContext` seam, which wraps this handle back to a readable store.
 */
class Survey {
  readonly #appSettings: ReactiveHandle<AppSettings>;
  readonly #visitId: ReactiveHandle<string | undefined>;

  #linkValue = $derived.by(() => {
    const linkTemplate = this.#appSettings.current.survey?.linkTemplate;
    return linkTemplate ? linkTemplate.replace(/\{\s*sessionId\s*\}/g, this.#visitId.current ?? '') : undefined;
  });

  constructor({
    appSettings,
    visitId
  }: {
    appSettings: ReactiveHandle<AppSettings>;
    visitId: ReactiveHandle<string | undefined>;
  }) {
    this.#appSettings = appSettings;
    this.#visitId = visitId;
  }

  // Prototype getter is SAFE here: surveyLink is consumed via DIRECT property access at appContext (`surveyLink: survey`), never spread.
  get current(): string | undefined {
    return this.#linkValue;
  }
}

export function surveyLink({
  appSettings,
  visitId
}: {
  appSettings: ReactiveHandle<AppSettings>;
  visitId: ReactiveHandle<string | undefined>;
}): ReactiveHandle<string | undefined> {
  return new Survey({ appSettings, visitId });
}
