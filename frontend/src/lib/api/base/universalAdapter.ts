/**
 * The abstract base class for all the universal Data API services. It implements initialisation, i.e. `fetch` handling for all of these.
 */
export abstract class UniversalAdapter {
  public fetch: typeof fetch | undefined;

  /**
   * The `init` method must be called before using any of the `DataProvider` methods.
   * @returns Self for method chaining.
   */
  init({ fetch }: AdapterConfig): this {
    this.fetch = fetch;
    return this;
  }
}

type AdapterConfig = {
  /**
   * The `fetch` function the `DataProvider` will use to make API calls.
   */
  fetch: typeof fetch | undefined;
};
