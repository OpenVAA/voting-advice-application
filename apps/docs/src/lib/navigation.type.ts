export type Navigation = Array<NavigationSection>;

export type NavigationSection = TitleOptions & {
  /**
   * The route path segment that this section matches. Not used as a link, only used to check if the section is active.
   */
  route: string;
  /**
   * The child items of this section.
   */
  children: Array<NavigationSection | NavigationItem>;
};

export type NavigationItem = TitleOptions & {
  /**
   * The route path to this item. Also used to check if the item is active.
   */
  route: string;
  /**
   * Whether this is a secondary item (shown differently in navigation).
   */
  isSecondary?: boolean;
};

export type TitleOptions = {
  /**
   * The title of the item to show in navigation.
   */
  title: string;
  /**
   * If set to true, the title won't be updated automatically based on the content when the navigation is generated.
   */
  fixedTitle?: boolean;
};
