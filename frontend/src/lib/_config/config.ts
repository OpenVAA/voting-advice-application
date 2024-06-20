import type {AppConfig} from './config.type';

console.info('[debug] congfig.ts: module loaded');

export const APP_CONFIG: AppConfig = {
  dataProvider: {
    adapter: 'local', // 'local' or 'strapi'
    type: 'server' // 'client' or'server'
  }
} as const;
