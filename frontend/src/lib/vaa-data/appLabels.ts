/**
 * This is the format for the appLabels.
 *
 * TO DO: Remove from here as it's not directly related to the VAA
 * object model.
 */

import type {RichText} from './data.types';

export interface AppLabels {
  [key: string]: string | RichText | AppLabels;
}
