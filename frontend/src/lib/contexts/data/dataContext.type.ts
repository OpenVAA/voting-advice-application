import type { DataRoot } from '@openvaa/data';
import type { Readable } from 'svelte/store';

export type DataContext = {
  dataRoot: Readable<DataRoot>;
};
