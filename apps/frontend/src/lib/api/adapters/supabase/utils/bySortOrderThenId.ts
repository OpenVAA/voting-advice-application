/**
 * Order rows the way `get_questions` orders one call's result, by `sort_order` with nulls last and then by id, so a merged multi-election read keeps that order.
 */
export function bySortOrderThenId(
  a: { id: string; sort_order: number | null },
  b: { id: string; sort_order: number | null }
): number {
  if (a.sort_order !== b.sort_order) {
    if (a.sort_order == null) return 1;
    if (b.sort_order == null) return -1;
    return a.sort_order - b.sort_order;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
