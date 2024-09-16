import type {AppConfig} from './config.type';

console.info('[debug] congfig.ts: module loaded');

export const APP_CONFIG: AppConfig = {
  dataProvider: {
    adapter: 'local'
  }
} as const;
