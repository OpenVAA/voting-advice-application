import type { HTMLAttributes } from 'svelte/elements';

/**
 * Props for the `MultilingualTextPart` component — the per-locale field stack rendered by `Input` for its `text-multilingual` and `textarea-multilingual` kinds.
 *
 * The part renders the fields and reports edits; it owns no value. The label above the stack, the translation-visibility toggle, the info text and the error message all stay with `Input`, which is why this contract carries neither of them.
 */
export type MultilingualTextPartProps = {
  /**
   * The id of the owning `Input`. Per-locale field ids are derived from it, and the group label it renders is referenced as `{id}-label` by every field's `aria-labelledby`.
   */
  id: string;
  /**
   * Which multilingual kind to render: a single-line input per locale, or a textarea per locale.
   */
  type: 'text-multilingual' | 'textarea-multilingual';
  /**
   * The current value. A `LocalizedString` in practice; typed loosely because `Input`'s own `value` is the union across every kind and is narrowed by the branch that renders this part. @default undefined
   */
  value?: unknown;
  /**
   * The placeholder shown in every locale's field. @default undefined
   */
  placeholder?: string | null;
  /**
   * Whether the fields are disabled. @default false
   */
  disabled?: boolean;
  /**
   * Whether the non-displayed locales are revealed. When `false` only the current locale renders, and the per-locale language labels are held at zero opacity. @default false
   */
  isTranslationsVisible?: boolean;
  /**
   * The owning `Input`'s focus-target array, indexed by locale position. `Input` refocuses its first entry after the translation toggle is pressed. Always supplied, so the part can bind into it without a non-null assertion.
   */
  mainInputs: Array<HTMLElement>;
  /**
   * Any remaining attributes the caller passed to `Input`, spread onto every locale's field. @default {}
   */
  restProps?: HTMLAttributes<HTMLElement>;
  /**
   * Event handler triggered when a locale's field changes.
   * @param event - The originating change event.
   * @param locale - The locale whose field changed.
   */
  onChange?: (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }, locale: string) => void;
};
