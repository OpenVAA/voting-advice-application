#!/usr/bin/env tsx
/**
 * Generate navigation configuration from the SvelteKit routes directory
 *
 * This script:
 * 1. Reads all routes from docs/src/routes
 * 2. Parses route structure and +page.md files
 * 3. Loads the current navigation config
 * 4. Compares current config with discovered routes
 * 5. Updates the config file with:
 *    - Updated titles (unless fixedTitle is true)
 *    - New items (marked with "New" comments)
 *    - Removed items (marked with "Removed" comments)
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { discoverRoutes, type RouteInfo, routeToTitle } from './utils/routes';
import type { Navigation, NavigationItem, NavigationSection } from '../src/lib/navigation.type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_DIR = path.join(__dirname, '../src/routes');
const CONFIG_FILE = path.join(__dirname, '../src/lib/navigation.config.ts');

/**
 * Internal working item with status tracking
 */
type WorkingItem = {
  item: NavigationSection | NavigationItem;
  status: 'existing' | 'new' | 'removed';
  children?: Array<WorkingItem>;
};

/**
 * Main function
 */
async function main() {
  console.info('Generating navigation configuration...\n');

  // 1. Build navigation from discovered routes
  const routes = await discoverRoutes(ROUTES_DIR);
  const discoveredNavigation = buildNavigationStructure(routes);

  // 2. Load current navigation config
  const currentNavigation = await loadCurrentConfig();

  // 3. Create internal working copy and compare
  const workingNavigation = compareNavigations(currentNavigation, discoveredNavigation, routes);

  // 4. Generate TypeScript output
  const typescript = generateTypeScript(workingNavigation);

  // 5. Write to file
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, typescript, 'utf-8');

  console.info(`✓ Navigation config generated: ${CONFIG_FILE}`);
  logChanges(workingNavigation);
}

/**
 * Load the current navigation config
 */
async function loadCurrentConfig(): Promise<Navigation> {
  try {
    const configContent = await fs.readFile(CONFIG_FILE, 'utf-8');
    // Extract the navigation array from the TypeScript file
    const match = configContent.match(/export const navigation: Navigation = (\[[\s\S]*\]);/);
    if (!match) {
      console.warn('Could not parse current navigation config, starting fresh');
      return [];
    }
    // Use eval to parse the TypeScript object literal (safe in this context)

    return eval(`(${match[1]})`);
  } catch {
    console.warn('Could not load current navigation config, starting fresh');
    return [];
  }
}

/**
 * Compare current navigation with discovered routes
 */
function compareNavigations(current: Navigation, discovered: Navigation, routes: Array<RouteInfo>): Array<WorkingItem> {
  const workingNav: Array<WorkingItem> = [];

  // Create a map of discovered routes for quick lookup
  const discoveredMap = new Map<string, NavigationSection | NavigationItem>();
  populateDiscoveredMap(discovered, discoveredMap);

  // Create a map of routes with titles
  const routeTitles = new Map<string, string>();
  for (const route of routes) {
    if (route.title) {
      routeTitles.set(route.route, route.title);
    }
  }

  // Process each section in current config
  for (const currentSection of current) {
    const discoveredSection = discoveredMap.get(currentSection.route);

    if (!discoveredSection || !('children' in discoveredSection)) {
      // Section no longer exists
      workingNav.push({
        item: currentSection,
        status: 'removed',
        children: markAllAsRemoved(currentSection.children)
      });
    } else {
      // Section still exists, process it
      const workingSection = compareSection(
        currentSection,
        discoveredSection as NavigationSection,
        discoveredMap,
        routeTitles
      );
      workingNav.push(workingSection);

      // Remove from map so we can find new items later
      discoveredMap.delete(currentSection.route);
    }
  }

  // Add new sections that weren't in current config
  for (const [route, item] of discoveredMap) {
    if ('children' in item) {
      // Only add top-level sections
      const segments = route.split('/').filter(Boolean);
      if (segments.length === 1) {
        workingNav.push({
          item: item,
          status: 'new',
          children: markAllAsNew(item.children)
        });
      }
    }
  }

  return workingNav;
}

/**
 * Compare a section and its children
 */
function compareSection(
  current: NavigationSection,
  discovered: NavigationSection,
  discoveredMap: Map<string, NavigationSection | NavigationItem>,
  routeTitles: Map<string, string>
): WorkingItem {
  // Update title unless fixedTitle is true
  const updatedItem: NavigationSection = {
    ...current,
    title: current.fixedTitle ? current.title : discovered.title,
    children: []
  };

  const workingChildren: Array<WorkingItem> = [];

  // Create a map of discovered children for quick lookup
  const discoveredChildrenMap = new Map<string, NavigationSection | NavigationItem>();
  for (const child of discovered.children) {
    discoveredChildrenMap.set(child.route, child);
  }

  // Process each child in current config
  for (const currentChild of current.children) {
    const discoveredChild = discoveredChildrenMap.get(currentChild.route);

    if (!discoveredChild) {
      // Child no longer exists
      if ('children' in currentChild) {
        workingChildren.push({
          item: currentChild,
          status: 'removed',
          children: markAllAsRemoved(currentChild.children)
        });
      } else {
        workingChildren.push({
          item: currentChild,
          status: 'removed'
        });
      }
    } else {
      // Child still exists
      if ('children' in currentChild && 'children' in discoveredChild) {
        // Both have children, recurse
        const workingChild = compareSection(
          currentChild,
          discoveredChild as NavigationSection,
          discoveredMap,
          routeTitles
        );
        workingChildren.push(workingChild);
      } else if ('children' in currentChild && !('children' in discoveredChild)) {
        // Current has children but discovered doesn't - mark all as removed
        const updatedChild: NavigationItem = {
          title: currentChild.fixedTitle ? currentChild.title : discoveredChild.title,
          route: currentChild.route,
          fixedTitle: currentChild.fixedTitle
        };
        workingChildren.push({
          item: updatedChild,
          status: 'existing',
          children: markAllAsRemoved(currentChild.children)
        });
      } else if (!('children' in currentChild) && 'children' in discoveredChild) {
        // Current is simple but discovered has children - convert to section
        const updatedChild: NavigationSection = {
          title: currentChild.fixedTitle ? currentChild.title : discoveredChild.title,
          route: currentChild.route,
          fixedTitle: currentChild.fixedTitle,
          children: []
        };
        workingChildren.push({
          item: updatedChild,
          status: 'existing',
          children: markAllAsNew((discoveredChild as NavigationSection).children)
        });
      } else {
        // Both are simple items
        const updatedChild: NavigationItem = {
          ...currentChild,
          title: currentChild.fixedTitle ? currentChild.title : discoveredChild.title
        };
        workingChildren.push({
          item: updatedChild,
          status: 'existing'
        });
      }

      // Remove from map
      discoveredChildrenMap.delete(currentChild.route);
    }
  }

  // Add new children that weren't in current config
  for (const [, child] of discoveredChildrenMap) {
    if ('children' in child) {
      workingChildren.push({
        item: child,
        status: 'new',
        children: markAllAsNew(child.children)
      });
    } else {
      workingChildren.push({
        item: child,
        status: 'new'
      });
    }
  }

  return {
    item: updatedItem,
    status: 'existing',
    children: workingChildren
  };
}

/**
 * Mark all items in a tree as removed
 */
function markAllAsRemoved(items: Array<NavigationSection | NavigationItem>): Array<WorkingItem> {
  return items.map((item) => {
    if ('children' in item) {
      return {
        item,
        status: 'removed',
        children: markAllAsRemoved(item.children)
      };
    }
    return {
      item,
      status: 'removed'
    };
  });
}

/**
 * Mark all items in a tree as new
 */
function markAllAsNew(items: Array<NavigationSection | NavigationItem>): Array<WorkingItem> {
  return items.map((item) => {
    if ('children' in item) {
      return {
        item,
        status: 'new',
        children: markAllAsNew(item.children)
      };
    }
    return {
      item,
      status: 'new'
    };
  });
}

/**
 * Populate a flat map of all navigation items for quick lookup
 */
function populateDiscoveredMap(navigation: Navigation, map: Map<string, NavigationSection | NavigationItem>): void {
  for (const section of navigation) {
    map.set(section.route, section);
    populateChildrenMap(section.children, map);
  }
}

/**
 * Recursively populate map with children
 */
function populateChildrenMap(
  children: Array<NavigationSection | NavigationItem>,
  map: Map<string, NavigationSection | NavigationItem>
): void {
  for (const child of children) {
    map.set(child.route, child);
    if ('children' in child) {
      populateChildrenMap(child.children, map);
    }
  }
}

/**
 * Build hierarchical navigation structure from flat routes list
 */
function buildNavigationStructure(routes: Array<RouteInfo>): Navigation {
  const navigation: Navigation = [];

  // Group routes by top-level section
  const sections = new Map<string, Array<RouteInfo>>();

  for (const route of routes) {
    if (route.route === '/') {
      // Skip root page (usually handled separately)
      continue;
    }

    const segments = route.route.split('/').filter(Boolean);
    const topLevel = segments[0];

    if (!sections.has(topLevel)) {
      sections.set(topLevel, []);
    }
    sections.get(topLevel)!.push(route);
  }

  // Build navigation sections
  for (const [sectionName, sectionRoutes] of sections) {
    const section = buildSection(sectionName, sectionRoutes);
    if (section) {
      navigation.push(section);
    }
  }

  return navigation;
}

/**
 * Build a navigation section from routes
 */
function buildSection(sectionName: string, routes: Array<RouteInfo>): NavigationSection | null {
  // Find the section's root route
  const rootRoute = routes.find((r) => r.route === `/${sectionName}`);

  // If there's no root page but there are child routes, create a section anyway
  if (!rootRoute && routes.length === 0) {
    return null;
  }

  const children: Array<NavigationSection | NavigationItem> = [];

  // Group child routes by their direct parent under this section
  const childRoutes = routes.filter((r) => {
    const segments = r.route.split('/').filter(Boolean);
    return segments.length > 1 && segments[0] === sectionName;
  });

  // First, identify all depth-2 routes that have children (depth > 2)
  const routesWithChildren = new Set<string>();
  const subsections = new Map<string, Array<RouteInfo>>();

  for (const route of childRoutes) {
    const segments = route.route.split('/').filter(Boolean);

    if (segments.length > 2) {
      // This is a nested route (depth > 2)
      const parentPath = `/${segments.slice(0, 2).join('/')}`;
      routesWithChildren.add(parentPath);

      if (!subsections.has(parentPath)) {
        subsections.set(parentPath, []);
      }
      subsections.get(parentPath)!.push(route);
    }
  }

  // Get all depth-2 routes (both with and without pages)
  const allDepth2Paths = new Set<string>();

  // Add routes that have pages
  for (const route of childRoutes) {
    const segments = route.route.split('/').filter(Boolean);
    if (segments.length === 2) {
      allDepth2Paths.add(route.route);
    }
  }

  // Add routes that don't have pages but have children
  for (const path of routesWithChildren) {
    allDepth2Paths.add(path);
  }

  // Process all depth-2 routes in order
  const sortedDepth2Paths = Array.from(allDepth2Paths).sort();

  for (const routePath of sortedDepth2Paths) {
    const routeInfo = childRoutes.find((r) => r.route === routePath);

    if (routesWithChildren.has(routePath)) {
      // This route has children - create a section
      const subsectionChildren = buildSubsectionChildren(routePath, subsections.get(routePath)!, routes);
      children.push({
        title: routeInfo ? routeInfo.title || routeToTitle(routePath) : routeToTitle(routePath),
        route: routePath,
        children: subsectionChildren
      });
    } else if (routeInfo) {
      // This route has a page but no children - create a simple item
      children.push({
        title: routeInfo.title || routeToTitle(routePath),
        route: routePath
      });
    }
  }

  return {
    title: rootRoute ? rootRoute.title || routeToTitle(rootRoute.route) : routeToTitle(`/${sectionName}`),
    route: `/${sectionName}`,
    children
  };
}

/**
 * Build children for a subsection
 */
function buildSubsectionChildren(
  parentPath: string,
  routes: Array<RouteInfo>,
  allRoutes: Array<RouteInfo>
): Array<NavigationSection | NavigationItem> {
  const children: Array<NavigationSection | NavigationItem> = [];
  const parentDepth = parentPath.split('/').filter(Boolean).length;

  // Group by immediate children and deeper descendants
  const directChildren = routes.filter((r) => {
    const segments = r.route.split('/').filter(Boolean);
    return segments.length === parentDepth + 1;
  });

  const nestedChildren = routes.filter((r) => {
    const segments = r.route.split('/').filter(Boolean);
    return segments.length > parentDepth + 1;
  });

  // Add direct children as items
  for (const route of directChildren) {
    children.push({
      title: route.title || routeToTitle(route.route),
      route: route.route
    });
  }

  // Group nested children by their immediate parent
  const nestedGroups = new Map<string, Array<RouteInfo>>();
  for (const route of nestedChildren) {
    const segments = route.route.split('/').filter(Boolean);
    const immediateParent = `/${segments.slice(0, parentDepth + 1).join('/')}`;

    if (!nestedGroups.has(immediateParent)) {
      nestedGroups.set(immediateParent, []);
    }
    nestedGroups.get(immediateParent)!.push(route);
  }

  // Build nested sections
  for (const [nestedParent, nestedRoutes] of nestedGroups) {
    const parentRoute = allRoutes.find((r) => r.route === nestedParent);
    const nestedChildren = buildSubsectionChildren(nestedParent, nestedRoutes, allRoutes);
    children.push({
      title: parentRoute ? parentRoute.title || routeToTitle(nestedParent) : routeToTitle(nestedParent),
      route: nestedParent,
      children: nestedChildren
    });
  }

  return children;
}

/**
 * Generate TypeScript code for the navigation config
 */
function generateTypeScript(workingNav: Array<WorkingItem>): string {
  const lines: Array<string> = [];

  lines.push(`/**
 * Automatically updated navigation configuration
 * Check and prepare update with scripts/generate-navigation-config.ts
 * To mark fix sections titles, set \`fixedTitle: true\` for them, otherwise the titles are updated automatically.
 *
 * NB. Any comments or content other than the navigation object will be removed!
 */

import type { Navigation } from './navigation.type';

export const navigation: Navigation = [`);

  for (let i = 0; i < workingNav.length; i++) {
    const section = workingNav[i];
    const isLast = i === workingNav.length - 1;
    appendWorkingItem(lines, section, 1, isLast);
  }

  lines.push('];');
  lines.push('');

  return lines.join('\n');
}

/**
 * Append a working item to the output lines with proper indentation and comments
 */
function appendWorkingItem(lines: Array<string>, workingItem: WorkingItem, indent: number, isLast: boolean): void {
  const indentStr = '  '.repeat(indent);

  // Add status comment if new or removed
  if (workingItem.status === 'new') {
    lines.push(`${indentStr}// New`);
  } else if (workingItem.status === 'removed') {
    lines.push(`${indentStr}// Removed: ${workingItem.item.route}`);
    return; // Don't include the actual item
  }

  // Serialize the item
  const item = workingItem.item;
  const hasChildren = 'children' in item && workingItem.children && workingItem.children.length > 0;

  lines.push(`${indentStr}{`);
  lines.push(`${indentStr}\ttitle: ${JSON.stringify(item.title)},`);
  lines.push(
    `${indentStr}\troute: ${JSON.stringify(item.route)}${item.fixedTitle || ('isSecondary' in item && item.isSecondary) || hasChildren ? ',' : ''}`
  );

  if (item.fixedTitle) {
    lines.push(
      `${indentStr}\tfixedTitle: true${('isSecondary' in item && item.isSecondary) || hasChildren ? ',' : ''}`
    );
  }

  if ('isSecondary' in item && item.isSecondary) {
    lines.push(`${indentStr}\tisSecondary: true${hasChildren ? ',' : ''}`);
  }

  if (hasChildren) {
    lines.push(`${indentStr}\tchildren: [`);
    for (let i = 0; i < workingItem.children!.length; i++) {
      const child = workingItem.children![i];
      const isLastChild = i === workingItem.children!.length - 1;
      appendWorkingItem(lines, child, indent + 2, isLastChild);
    }
    lines.push(`${indentStr}\t]`);
  }

  lines.push(`${indentStr}}${isLast ? '' : ','}`);
}

/**
 * Log summary of changes
 */
function logChanges(workingNav: Array<WorkingItem>): void {
  let newCount = 0;
  let removedCount = 0;

  function countChanges(items: Array<WorkingItem>): void {
    for (const item of items) {
      if (item.status === 'new') newCount++;
      if (item.status === 'removed') removedCount++;
      if (item.children) {
        countChanges(item.children);
      }
    }
  }

  countChanges(workingNav);

  console.info('');
  if (newCount > 0) {
    console.info(`✓ Added ${newCount} new item(s)`);
  }
  if (removedCount > 0) {
    console.info(`✓ Removed ${removedCount} item(s)`);
  }
  if (newCount === 0 && removedCount === 0) {
    console.info('✓ No structural changes, titles updated where applicable');
  }
}

main().catch((error) => {
  console.error('Error generating navigation config:', error);
  process.exit(1);
});
