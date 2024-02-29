import type {HTMLAttributes} from 'svelte/elements';
export interface EntityCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  electionSymbol?: string;
  party?: PartyProps;
  summaryMatch?: string;
  imgSrc?: string;
  imgAlt?: string;
  imgWidth?: number;
  imgHeight?: number;

  // Accessibility properties exposed for the entity card
  ariaDescribedby?: string | undefined | null;
  ariaPosinset?: number | undefined | null;
  ariaSetsize?: number | undefined | null;
}
