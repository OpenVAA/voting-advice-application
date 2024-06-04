import type {SvelteHTMLElements} from 'svelte/elements';

export type PageProps = SvelteHTMLElements['div'] & {
  /**
   * The required page `title`.
   */
  title: string;

  /**
   * The id used for the `<main>` that contains the page's main content.
   * This is needed for the hidden skip link at the start of the page.
   *
   * @default 'mainContent'
   */
  mainId?: string | null;

  /**
   * The id used for the `<label>` element used by DaisyUI for toggling
   * the drawer. This must match the `for` attribute of the `<label>`
   * that's used to toggle the drawer open and closed.
   *
   * @default 'pageDrawer'
   */
  drawerToggleId?: string | null;

  /**
   * Optional class string to add to the `<header>` tag wrapping the
   * `drawerOpenButton` and `header` slots.
   */
  headerClass?: string;

  /**
   * Optional class string to add to the `<div>` tag wrapping the page's contents.
   */
  drawerContentClass?: string;

  /**
   * Optional class string to add to the `<main>` tag.
   */
  mainClass?: string;

  /**
   * Whether to invert the logo and accompanying menu button colors. Set
   * to true if the header is dark. @default false
   */
  invertLogo?: boolean;

  /**
   * The id for the `<nav>` element containing the navigation.
   *
   * @default 'pageNav'
   */
  navId?: string | null;

  /**
   * Optional value for the progress bar. The bar will be hidden
   * if the property is `undefined` or `null`. Use the bar to show the user's
   * progress in the application, not as a loading indicator: it uses the
   * `<meter>` element.
   */
  progress?: number | null;

  /**
   * Optional minimum value for the progress bar.
   *
   * @default 0
   */
  progressMin?: number | null;

  /**
   * Optional maximum value for the progress bar.
   *
   * @default 100
   */
  progressMax?: number | null;
};
