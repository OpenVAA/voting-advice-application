import { CustomDataMap } from './customData.type';

/**
 * A utility for getting the typed `CustomData` for any `DataObject`.
 */
export function getCustomData<TData extends { customData?: object }>(object: TData): CustomDataMap<TData> {
  return (object.customData ?? {}) as CustomDataMap<TData>;
}
