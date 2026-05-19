/**
 * The format for the data returned by actions which either succeed or fail.
 */
export interface DataApiActionResult extends Record<string, unknown> {
  type: 'failure' | 'success';
  status?: number;
}
