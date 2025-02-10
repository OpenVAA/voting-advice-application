import { staticSettings } from '@openvaa/app-shared';
import type { UniversalDataWriter } from './base/universalDataWriter';

let module: Promise<{ dataWriter: UniversalDataWriter }>;

const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/dataWriter');
    break;
  default:
    throw new Error(`Unsupported data writer: ${type}`);
}

export const dataWriter = module.then((m) => m.dataWriter);
