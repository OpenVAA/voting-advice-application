import type { SvelteHTMLElements } from 'svelte/elements';

export type LayoutProps = {
  /**
   * The id of the navigation menu in the `menu` slot.
   */
  menuId: string;
  /**
   * A bindable boolean indicating whether the drawer is open or not. NB. To close the drawer, use the method in `LayoutContext.navigation`.
   */
  isDrawerOpen?: boolean;
  /**
   * Optional properties to be passed to the `<main>` element into which the components default slot is inserted.
   */
  mainProps?: Omit<SvelteHTMLElements['main'], 'id'>;
};
