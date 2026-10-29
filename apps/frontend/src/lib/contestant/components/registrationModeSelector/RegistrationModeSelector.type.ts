import type { RegistrationMode } from '@openvaa/app-shared';
import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type RegistrationModeSelectorProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The registration modes to choose among, in the order they are shown.
   */
  modes: ReadonlyArray<RegistrationMode>;
  /**
   * Bindable: The chosen mode. Nothing is chosen until the user chooses, and with a single mode it is never written.
   */
  selected?: RegistrationMode;
  /**
   * What a mode's panel holds. Rendered for the chosen mode alone, and directly for a single mode.
   */
  panel: Snippet<[mode: RegistrationMode]>;
  /**
   * Bindable: The message shown under the options while the group is in error. The caller decides when the group is in error; the selector clears the message when a mode is chosen.
   */
  error?: string;
  /**
   * The id of the fieldset. The error takes the id `<id>-error`. @default a generated id
   */
  id?: string;
};
