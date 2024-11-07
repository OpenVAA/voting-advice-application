import type { Position } from '../space';

/**
 * For future implementation.
 * Used to project positions from one MatchingSpace to another, e.g.
 * by using a weight matrix.
 */
export interface MatchingSpaceProjector {
  project(position: ReadonlyArray<Position>): Array<Position>;
}
