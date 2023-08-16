/*
 * For convenience.
 */

import {OrdinalQuestion} from './ordinalQuestion';

/**
 * Likert questions are in essence ordinal questions, but we subclass
 * them so that we may provide some default value labels, for example,
 * in the future.
 */
export class LikertQuestion extends OrdinalQuestion {}
