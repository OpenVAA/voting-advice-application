export type EntityDrawerOpenerProps = {
  /**
   * A possibly ranked entity, e.g. candidate or a party, whose details are shown in the app's drawer host.
   */
  entity: MaybeWrappedEntityVariant;
  /**
   * Called when the USER dismisses the drawer (close button, backdrop, Escape). Routed callers navigate back here.
   */
  onClose: () => void;
};
