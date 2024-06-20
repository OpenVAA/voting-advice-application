import {APP_CONFIG} from '$lib/_config';
import type {ServerDataProvider} from './serverDataProvider.type';

export let module: Promise<{serverDataProvider: ServerDataProvider | null}>;

const {adapter, type} = APP_CONFIG.dataProvider;

switch (type) {
  case 'server':
    switch (adapter) {
      case 'local':
        module = import('./providers/local');
        break;
      default:
        throw new Error(`Unsupported server data provider ${adapter}`);
    }
    break;
  case 'client':
    module = Promise.resolve({serverDataProvider: null});
    break;
  default:
    throw new Error(`Unsupported data provider type ${type}`);
}

console.info(
  `[debug] serverDataProvider.ts: module loaded with type: ${type} and adapter: ${adapter}`
);

export const serverDataProvider = module.then((m) => m.serverDataProvider);
