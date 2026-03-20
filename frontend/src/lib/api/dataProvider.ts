import { staticSettings } from '@openvaa/app-shared';
import type { UniversalDataProvider } from './base/universalDataProvider';

let module: Promise<{ dataProvider: UniversalDataProvider }>;

const { type } = staticSettings.dataAdapter;

// TODO: The adapter loading logic (switch on type) should be rewritten later.
switch (type) {
  case 'local':
    module = import('./adapters/apiRoute/dataProvider');
    break;
  case 'supabase':
    module = import('./adapters/supabase/dataProvider');
    break;
  default:
    throw new Error(`Unsupported data provider: ${type}`);
}

export const dataProvider = module.then((m) => m.dataProvider);
