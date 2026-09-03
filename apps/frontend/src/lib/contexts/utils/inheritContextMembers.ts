/**
 * Forward all own-enumerable members of a source context onto a target context,
 * **preserving accessor semantics**.
 *
 * `appContext` exposes `appSettings` / `dataRoot` / `locale` as BARE own-enumerable reactive accessors (`Object.defineProperty(this, …, { get, enumerable: true })`).
 *
 * An orchestrator context (voter / candidate / admin) that reproduced those members with `Object.assign(this, this.#appContext)` would be wrong: `Object.assign` invokes each accessor getter ONCE and copies the resulting **value** as a plain data property — so a bare reactive accessor is frozen at construction time and never re-evaluates. For `dataRoot` (populated after construction) and `appSettings` / `locale` this silently freezes reactivity for every consumer that reads `voterCtx.appSettings`, `candidateCtx.dataRoot`, etc. — the exact reactivity-loss bug this helper exists to prevent.
 *
 * This helper copies each own-enumerable member by its property descriptor:
 * - **Accessor** members (a `get`/`set` pair) are re-installed as a live
 *   forwarding accessor that delegates to `source` on every read/write, so the reactive read happens inside the consumer's tracking scope.
 * - **Data** members (functions, stable `{ current }` handles, plain values) are
 *   copied by value — the same as `Object.assign` would do, and reference-equal to a `{ ...source }` spread copy.
 */
export function inheritContextMembers<TSource extends object>(target: object, source: TSource): void {
  for (const key of Object.keys(source) as Array<keyof TSource & string>) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor) continue;

    if (descriptor.get || descriptor.set) {
      // Reactive accessor — install a live forwarding accessor instead of snapshotting its current value.
      Object.defineProperty(target, key, {
        get: descriptor.get ? () => source[key] : undefined,
        set: descriptor.set
          ? (value: TSource[keyof TSource & string]) => {
              source[key] = value;
            }
          : undefined,
        enumerable: true,
        configurable: true
      });
    } else {
      // Data property (function / stable handle / value) — copy by value, matching the former `Object.assign` / `{ ...source }` behaviour.
      Object.defineProperty(target, key, {
        value: descriptor.value,
        writable: descriptor.writable ?? true,
        enumerable: true,
        configurable: true
      });
    }
  }
}
