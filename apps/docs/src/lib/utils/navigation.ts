import { navigation } from '../navigation.config';
import type { NavigationItem, NavigationSection } from '$lib/navigation.type';

export function findActiveSection(url: URL): NavigationSection | null {
  for (const section of navigation) {
    if (url.pathname.startsWith(section.route)) {
      return section;
    }
  }
  return null;
}

export function isActive(route: string, url: URL): boolean {
  return url.pathname === route || url.pathname.startsWith(route + '/');
}

/**
 * Returns the leaf item of the menu that stands for the current page: the leaf whose route is the URL's path or, when no leaf has that route, the leaf with the longest route the path lies below.
 *
 * A leaf's route can be a prefix of another leaf's, as a subsection's Overview item is of its siblings, so the first active leaf is not enough.
 */
function findCurrentLeaf(items: Array<NavigationSection | NavigationItem>, url: URL): NavigationItem | null {
  let current: NavigationItem | null = null;
  for (const item of flattenNavigation(items)) {
    if (isActive(item.route, url) && (!current || item.route.length > current.route.length)) current = item;
  }
  return current;
}

/**
 * Whether a leaf item of the menu stands for the current page. Only one leaf of the whole menu does.
 */
export function isCurrentLeaf(item: NavigationItem, url: URL): boolean {
  return findCurrentLeaf(navigation, url)?.route === item.route;
}

export function hasChildren(item: NavigationSection | NavigationItem): item is NavigationSection {
  return 'children' in item && item.children.length > 0;
}

/**
 * Flattens the navigation tree into a list of all navigable items (leaf nodes only)
 */
function flattenNavigation(items: Array<NavigationSection | NavigationItem>): Array<NavigationItem> {
  const result: Array<NavigationItem> = [];

  for (const item of items) {
    if (hasChildren(item)) {
      // Recursively flatten children
      result.push(...flattenNavigation(item.children));
    } else {
      // This is a leaf node (NavigationItem)
      result.push(item);
    }
  }

  return result;
}

/**
 * Returns the previous and next navigation items relative to the current URL
 */
export function getPeerNavigation(url: URL): {
  prev: NavigationItem | null;
  next: NavigationItem | null;
} {
  const activeSection = findActiveSection(url);
  if (!activeSection) {
    return { prev: null, next: null };
  }

  // Flatten all items in the active section
  const allItems = flattenNavigation(activeSection.children);

  const current = findCurrentLeaf(activeSection.children, url);
  const currentIndex = current ? allItems.indexOf(current) : -1;

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null
  };
}

/**
 * Get the first child route of a navigation section for displaying a working link to a page.
 */
export function getFirstChild(section: NavigationSection) {
  if (section.children.length === 0) return null;
  const firstChild = section.children[0];
  return 'children' in firstChild ? firstChild.route : firstChild.route;
}
