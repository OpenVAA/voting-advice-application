import type { StaticSettings } from './staticSettings.type';

export const staticSettings: StaticSettings = {
  admin: {
    email: 'duf@duf.dk'
  },
  appVersion: {
    version: 1,
    requireUserDataVersion: 1,
    source: 'https://github.com/OpenVAA/voting-advice-application/tree/deploy-duf-vaa-2025'
  },
  dataAdapter: {
    type: 'strapi',
    supportsCandidateApp: true
  },
  colors: {
    light: {
      primary: '#D23223',
      secondary: '#666666',
      accent: '#377d8e',
      neutral: '#333333',
      'base-100': '#ffffff',
      'base-200': '#f2f2f2',
      'base-300': '#e4e4e4',
      warning: '#a82525',
      'line-color': '#d9d9d9'
    },
    dark: {
      primary: '#D23223',
      secondary: '#8c8c8c',
      accent: '#377d8e',
      neutral: '#cccccc',
      'base-100': '#000000',
      'base-200': '#0e0e0e',
      'base-300': '#1a1a1a',
      warning: '#e16060',
      'line-color': '#262626'
    }
  },
  font: {
    name: 'Montserrat',
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap',
    style: 'sans'
  },
  supportedLocales: [
    {
      code: 'en',
      name: 'English'
    },
    {
      code: 'da',
      name: 'Dansk',
      isDefault: true
    }
  ],
  analytics: {
    trackEvents: false,
    platform: {
      name: 'umami',
      code: '1e671ef2-09c7-4edf-a79d-9395b57b81ce',
      infoUrl: 'https://umami.is/'
    }
  },
  preRegistration: {
    enabled: false
  }
};
