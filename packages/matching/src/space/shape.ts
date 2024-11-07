import type { CoordinateOrMissing } from '@openvaa/core';
import type { PositionCoordinates } from './position';

/**
 * The shape of `MatchingSpace` or `Position` is the number of subdimensions for each dimension.
 */
export type Shape = Array<number>;

/**
 * Return the shape of a `PositionCoordinates` object. */
export function coordinatesShape(coordinates: PositionCoordinates): Shape {
  return coordinates.map((c) => (Array.isArray(c) ? c.length : 1));
}

/**
 * Check if the shapes are equal.
 */
export function equalShapes(a: Shape, b: Shape): boolean {
  return a.length === b.length && a.every((d, i) => d === b[i]);
}

/**
 * Flatten a `PositionCoordinates` object if it contains subdimensions.
 */
export function flatten(coordinates: PositionCoordinates): Array<CoordinateOrMissing> {
  if (coordinates.every((c) => typeof c === 'number')) return coordinates;
  return coordinates.flat();
}

/**
 * Reshape a flattened shape into its original `Shape`.
 */
export function reshape({ flat, shape }: { flat: Array<CoordinateOrMissing>; shape: Shape }): PositionCoordinates {
  if (shape.every((d) => d === 1)) return flat;
  if (flat.length !== shape.reduce((acc, d) => acc + d, 0))
    throw new Error(`Cannot reshape array of length ${flat.length} into shape [${shape.join(',')}]`);
  let i = 0;
  return shape.map((d) => {
    const element = d === 1 ? flat[i] : flat.slice(i, i + d);
    i += d;
    return element;
  });
}
