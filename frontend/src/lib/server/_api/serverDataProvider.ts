import {APP_CONFIG} from '$lib/_config';
import type {ServerDataProvider} from './serverDataProvider.type';

export let module: Promise<{serverDataProvider: ServerDataProvider | null}>;

const {adapter} = APP_CONFIG.dataProvider;

switch (adapter) {
  case 'local':
    module = import('./providers/local');
    break;
  default:
    module = Promise.resolve({serverDataProvider: null});
}

console.info(`[debug] serverDataProvider.ts: module loaded with server data provider: ${adapter}`);

export const serverDataProvider = module.then((m) => m.serverDataProvider);
