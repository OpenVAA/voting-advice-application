export interface PreventNavigationProps {
  /**
   * Whether the navigation should be prevented or not. This can also be callback to cater for changes that would required re-rendering the component.
   */
  active: boolean | (() => boolean);
  /**
   * A callback function that is called when the navigation is about to be cancelled.
   */
  onCancel?: (() => void) | null;
  /**
   * A callback function that is called when the navigation is about to be confirmed.
   */
  onConfirm?: (() => void) | null;
}
