import type {HTMLAttributes} from 'svelte/elements';

type ButtonAndAnchorAttribues = HTMLAttributes<HTMLElementTagNameMap['button']> &
  HTMLAttributes<HTMLElementTagNameMap['a']>;
export interface ButtonProps extends ButtonAndAnchorAttribues {
  /**
   * If this is passed, an `a` element will be used instead of a `button`.
   */
  href?: string | undefined | null;
}
