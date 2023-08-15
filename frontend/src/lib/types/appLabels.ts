/**
 * This is the format for the appLabels.
 *
 * TO DO: Remove the RichText dependency.
 */

import type {RichText} from '../vaa-data';

export interface AppLabels {
  [key: string]: string | RichText | AppLabels;
}
