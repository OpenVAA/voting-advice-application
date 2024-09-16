import type {DataObjectData} from './dataObject.type';

export function order<TData extends DataObjectData>(a: TData, b: TData): number {
  return (a.order ?? 0) - (b.order ?? 0);
}
