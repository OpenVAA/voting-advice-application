/**
 * A rune-shaped read handle: a value exposed via a `current` getter so a producer can take a reactive read-dependency without a store bridge.
 */
export type ReactiveHandle<TValue> = { readonly current: TValue };

/**
 * A rune-shaped read+write handle: a value exposed via a `current` getter together with a `set` that replaces it.
 */
export type WritableHandle<TValue> = ReactiveHandle<TValue> & { set(v: TValue): void };

/**
 * A `WritableHandle` that also offers `update`, which replaces the value with a function of the current one.
 */
export type UpdatableHandle<TValue> = WritableHandle<TValue> & { update(fn: (v: TValue) => TValue): void };
