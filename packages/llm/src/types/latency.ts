/**
 * A measurement of the execution time of an operation
 */
export interface LatencyMeasurement {
  /** The start time of the operation */
  startTime: number;
  /** The end time of the operation */
  endTime?: number;
  /** The duration of the operation in milliseconds */
  duration?: number;
}
