import { coordinatesShape, type Shape } from './shape';
import type { CoordinateOrMissing } from '@openvaa/core';
import type { MatchingSpace } from './matchingSpace';

/**
 * The coordinates may be have one level of subdimensions.
 */
export type PositionCoordinates = Array<CoordinateOrMissing | Array<CoordinateOrMissing>>;

/**
 * A position in a MatchingSpace
 */
export class Position {
  coordinates: PositionCoordinates;
  readonly space: MatchingSpace;

  constructor({ coordinates, space }: { coordinates: PositionCoordinates; space: MatchingSpace }) {
    if (!space.isCompatible(coordinates)) throw new Error('The shape of coordinates and space are incompatible');
    this.coordinates = coordinates;
    this.space = space;
  }

  /**
   * The shape of the position.
   */
  get shape(): Shape {
    return coordinatesShape(this.coordinates);
  }
}
