import type {MatchingSpaceCoordinate} from 'vaa-shared';
import type {MatchingSpace} from './matchingSpace';

/**
 * A position in a MatchingSpace
 */
export class MatchingSpacePosition {
  constructor(
    public coordinates: Array<MatchingSpaceCoordinate>,
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
