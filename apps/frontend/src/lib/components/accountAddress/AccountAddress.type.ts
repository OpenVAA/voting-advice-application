import type { SvelteHTMLElements } from 'svelte/elements';

export type AccountAddressProps = Omit<SvelteHTMLElements['dl'], 'data-testid'> & {
  /**
   * The label shown above the address, e.g. `t('contestantApp.nothingToEdit.signedInAs')`.
   */
  label: string;
  /**
   * The address to show.
   */
  address: string;
  /**
   * The test id of the address, which is set on the `<dd>` holding it rather than on the list.
   */
  'data-testid'?: string;
};
