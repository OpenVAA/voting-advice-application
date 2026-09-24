/**
 * A rune-shaped read handle: a value exposed via a `current` getter so a producer can take a reactive read-dependency without a store bridge.
 */
export type ReactiveHandle<TValue> = { readonly current: TValue };

/**
 * A rune-shaped read+write handle (e.g. the producer's `sendTrackingEvent` surface).
 */
export type WritableHandle<TValue> = { current: TValue; set: (v: TValue) => void };
