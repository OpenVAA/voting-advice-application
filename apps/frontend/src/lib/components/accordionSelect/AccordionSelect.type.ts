import type { SvelteHTMLElements } from 'svelte/elements';

export type AccordionSelectProps<TOption> = SvelteHTMLElements['div'] & {
  /**
   * The titles and other data related to the options.
   */
  options: Array<TOption>;
  /**
   * The index of the active option. Bind to this to change or read the active option. @default undefined
   */
  activeIndex?: number;
  /**
   * A callback used to get the label for each option. @default String
   */
  labelGetter?: (option: TOption) => string;
  /**
   * Callback for when the active option changes. The event `details` contains the active option as `option` as well as its `index`.
   */
  onChange?: (details: { index?: number; option: TOption }) => void;
};
