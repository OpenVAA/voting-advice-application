import type {HTMLAttributes} from 'svelte/elements';

export interface PageProps extends HTMLAttributes<HTMLElementTagNameMap['div']> {
  /**
   * The page `title`.
   */
  title: string;

  /**
   * The id used for the `label` element used by DaisyUI for toggling
   * the drawer. This must match the `for` attribute of the `label`
   * that's used to toggle the drawer open and closed. Defaults to
   * 'pageDrawer'.
   */
  drawerToggleId?: string | undefined | null;

  /**
   * The id used for the `main`. This is needed for the hidden skip
   * link at the start of the page.
   */
  mainId?: string | undefined | null;

  /**
   * Optional class string to add to the `header` tag wrapping the
   * `navOpen` and `header` slots.
   */
  headerClass?: string;

  /**
   * Optional class string to add to the `div` tag wrapping both
   * the `aside` and default slots.
   */
  mainWrapperClass?: string;

  /**
   * Optional class string to add to the `main` tag wrapping the
   * `main` slot.
   */
  mainClass?: string;

  /**
   * Optional class string to add to the `nav` tag wrapping the
   * `navClose` and `nav` slots.
   */
  navClass?: string;

  /**
   * Optional `aria-label` for the `nav` slot.
   */
  navLabel?: string | undefined | null;

  /**
   * The id for the `nav` element.
   */
  navId?: string | undefined | null;

  /**
   * Optional `aria-label` for the button and overlay closing the nav.
   */
  navCloseLabel?: string | undefined | null;

  /**
   * Optional `aria-label` for the button opening the nav.
   */
  navOpenLabel?: string | undefined | null;

  /**
   * Optional `aria-label` for the input that governs toggling the drawer.
   * This input is not focusable, so this is mostly theoretical.
   */
  navToggleLabel?: string | undefined | null;

  /**
   * Optional class string to add to the `aside` tag wrapping the
   * `aside` slot.
   */
  asideClass?: string;

  /**
   * Optional text for the skip link to main content.
   */
  skipToMainLabel?: string | undefined | null;

  /**
   * Optional value for the progress bar. The bar will be hidden
   * if the property is 'undefined' or 'null'. Use the bar to show the user's
   * progress in the application, not as a loading indicator: it uses the
   * `meter` element. The progress bar will not be shown if the `header` slot
   * is not supplied.
   */
  progress?: number | undefined | null;

  /**
   * Optional minimum value for the progress bar.
   *
   * @default 0
   */
  progressMin?: number | undefined | null;

  /**
   * Optional maximum value for the progress bar.
   *
   * @default 100
   */
  progressMax?: number | undefined | null;

  /**
   * Optional title for the progress bar.
   *
   * @default `$_('Your progress')`
   */
  progressTitle?: string | undefined | null;

  /**
   * A clunky way of explicitly hiding slots even if they have content.
   * The reason for this is that we can't nest slot contents in `if` blocks
   * in subcomponents using `Page`.
   */
  hideSlots?: ('header' | 'aside' | 'nav')[];
}
