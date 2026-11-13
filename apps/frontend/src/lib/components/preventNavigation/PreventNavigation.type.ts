export interface PreventNavigationProps {
  /**
   * Whether the navigation should be prevented or not. This can also be callback to cater for changes that would required re-rendering the component. A callback runs inside other components' tracking scopes, also while a navigation is replacing the route, so it must not throw and must not write state.
   */
  active: boolean | (() => boolean);
  /**
   * A callback function that is called when the user refuses, on a navigation that is about to be cancelled or by choosing to stay in the logout modal.
   */
  onCancel?: (() => void) | null;
  /**
   * A callback function that is called when the user agrees, on a navigation that is about to be confirmed or by the logout modal. On the logout it runs after a successful sign-out, also when the modal's count ended with no answer.
   */
  onConfirm?: (() => void) | null;
}
