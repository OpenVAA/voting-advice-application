import type {HTMLAttributes} from 'svelte/elements';
export interface EntityCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  electionSymbol?: string;
  listText?: string;
  summaryMatch?: string;
  photoSrc?: string;
  photoAlt?: string;
  photoWidth?: number;
  photoHeight?: number;

  // Accessibility properties exposed for the entity card
  ariaDescribedby?: string | undefined | null;
  ariaPosinset?: number | undefined | null;
  ariaSetsize?: number | undefined | null;
}
