import type {HTMLAttributes} from 'svelte/elements';
export type CardProps = HTMLAttributes<HTMLElement> & {
  keyboardClick?: string | string[] | null;
};
