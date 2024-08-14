import type {Coordinate} from 'vaa-shared';
import type {MatchingSpace} from './matchingSpace';

/**
 * A position in a MatchingSpace
 */
export class Position {
  constructor(
    public coordinates: Array<Coordinate>,
    public readonly space?: MatchingSpace
  ) {
    if (space && space.dimensions !== coordinates.length)
      throw new Error(
        `The dimensions of coordinates ${coordinates.length} and space ${space.dimensions} do not match!`
      );
  }

  get dimensions(): number {
    return this.coordinates.length;
  }
}
