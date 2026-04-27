/**
 * Re-export of @openvaa/app-shared's deep-merge utility (Phase 63 hoist, D-02).
 * Kept as a re-export so existing `$lib/utils/merge` import sites compile unchanged.
 */
export { mergeSettings, type DeepPartial } from '@openvaa/app-shared';
