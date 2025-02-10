/**
 * The format for the data returned by actions which either succeed or fail but return no other data.
 */
export interface DataApiActionResult extends Record<string, unknown> {
  type: 'failure' | 'success';
}
