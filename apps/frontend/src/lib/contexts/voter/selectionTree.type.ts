import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';

/**
 * A two-level `Record` for organising objects for each (selected) `Election` and each `EntityType`.
 */
export type SelectionTree<TContent> = {
  [electionId: Id]: {
    [TEntity in EntityType]?: TContent;
  };
};
