import type { DataRoot } from '@openvaa/data';
import type { Readable } from 'svelte/store';

export type DataContext = {
  dataRoot: Readable<DataRoot>;
  /** Direct reactive access to DataRoot — bypasses toStore/fromStore bridge for synchronous propagation. */
  reactiveDataRoot: { readonly current: DataRoot };
};
