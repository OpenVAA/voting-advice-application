import type { Image } from '@openvaa/data';
import type { TranslationKey } from '$types';

/**
 * The application customization provided by `DataProvider`.
 */
export type AppCustomization = {
  /**
   * The name of the VAA publisher.
   */
  publisherName?: string;
  /**
   * The logo of the VAA publisher.
   */
  publisherLogo?: Image;
  /**
   * The frontpage poster image for the Voter App.
   */
  poster?: Image;
  /**
   * The frontpage poster image for the Candidate App.
   */
  candPoster?: Image;
  /**
   * Any translation overrides.
   */
  translationOverrides?: Record<TranslationKey, string>;
  /**
   * An `Array` of FAQs for the Candidate App.
   */
  candidateAppFAQ?: Array<{ question: string; answer: string }>;
};
