import {APP_CONFIG} from '$lib/_config';
import type {DataProvider} from './dataProvider.type';

export let module: Promise<{dataProvider: DataProvider}>;

const {adapter, type} = APP_CONFIG.dataProvider;

switch (type) {
  case 'client':
    switch (adapter) {
      case 'strapi':
        module = import('./providers/strapi');
        break;
      default:
        throw new Error(`Unsupported client-side data provider ${adapter}`);
    }
    break;
  case 'server':
    module = import('./providers/apiRoute');
    break;
  default:
    throw new Error(`Unsupported data provider type ${type}`);
}

console.info(`[debug] dataProvider.ts: module loaded with type: ${type} and adapter: ${adapter}`);

export const dataProvider = module.then((m) => m.dataProvider);
