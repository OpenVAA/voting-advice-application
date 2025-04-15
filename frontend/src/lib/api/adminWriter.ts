import { staticSettings } from '@openvaa/app-shared';
import type { UniversalAdminWriter } from './base/universalAdminWriter';

let module: Promise<{ adminWriter: UniversalAdminWriter }>;

const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/adminWriter');
    break;
  default:
    throw new Error(`Unsupported admin writer: ${type}`);
}

export const adminWriter = module.then((m) => m.adminWriter);
