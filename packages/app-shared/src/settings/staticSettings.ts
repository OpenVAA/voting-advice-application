import type { StaticSettings } from './staticSettings.type';

export const staticSettings: StaticSettings = {
  admin: {
    email: 'sira@varldensmammor.se '
  },
  appVersion: {
    version: 1,
    requireUserDataVersion: 1,
    source: 'https://github.com/OpenVAA/voting-advice-application/tree/deploy-kisam-vaa-2026'
  },
  dataAdapter: {
    type: 'strapi',
    supportsCandidateApp: true,
    supportsAdminApp: true
  },
  colors: {
    light: {
      primary: '#1b98ac',
      secondary: '#666666',
      accent: '#0a716b',
      neutral: '#333333',
      'base-100': '#ffffff',
      'base-200': '#e8f4f7',
      'base-300': '#d1eaee',
      warning: '#a82525',
      'line-color': '#d9d9d9'
    },
    dark: {
      primary: '#6887e3',
      secondary: '#8c8c8c',
      accent: '#11a8a0',
      neutral: '#cccccc',
      'base-100': '#000000',
      'base-200': '#030f12',
      'base-300': '#051e22',
      warning: '#e16060',
      'line-color': '#262626'
    }
  },
  font: {
    name: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    style: 'sans',
    // Arabic-capable companion for RTL locales. Inter lacks Arabic glyphs, so the browser falls through to this face for Arabic codepoints only (the Google Fonts CSS2 API serves it with per-subset `unicode-range` and `display=swap`, leaving the Latin path untouched).
    secondary: {
      name: 'Noto Sans Arabic',
      url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap'
    }
  },
  supportedLocales: [
    {
      code: 'sv',
      name: 'Svenska',
      isDefault: true
    },
    {
      code: 'en',
      name: 'English'
    },
    {
      code: 'so',
      name: 'Soomaali'
    },
    {
      code: 'ar',
      name: 'العربية',
      dir: 'rtl'
    }
  ],
  analytics: {
    trackEvents: false
  },
  preRegistration: {
    enabled: false
  }
};
