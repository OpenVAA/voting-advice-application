import type {HTMLAttributes} from 'svelte/elements';
export interface AppLogoProps extends HTMLAttributes<HTMLElementTagNameMap['div']> {
  /**
   * If `true`, the light and dark versions of the logo will be reversed.
   * Set to `true` if using the logo on a dark background.
   *
   * @default `false`
   */
  inverse?: boolean | undefined | null;
}
