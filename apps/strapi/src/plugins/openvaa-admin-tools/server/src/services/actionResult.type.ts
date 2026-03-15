export interface ActionResult {
  type: 'success' | 'failure';
  cause?: string;
}
