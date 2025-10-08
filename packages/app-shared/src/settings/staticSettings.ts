import type { StaticSettings } from './staticSettings.type';

export const staticSettings: StaticSettings = {
  admin: {
    email: 'antti.kivi@syl.fi'
  },
  appVersion: {
    version: 1,
    requireUserDataVersion: 1,
    source: 'https://github.com/OpenVAA/voting-advice-application/tree/deploy-jyy-vaa-2025'
  },
  dataAdapter: {
    type: 'strapi',
    supportsCandidateApp: true
  },
  colors: {
    light: {
      primary: '#009f71',
      secondary: '#666666',
      accent: '#7e226c',
      neutral: '#333333',
      'base-100': '#ffffff',
      'base-200': '#f8f8f8',
      'base-300': '#e0e0e0',
      warning: '#a82525',
      'line-color': '#d9d9d9'
    },
    dark: {
      primary: '#009f71',
      secondary: '#8c8c8c',
      accent: '#f6d1e3',
      neutral: '#cccccc',
      'base-100': '#000000',
      'base-200': '#1c1c1c',
      'base-300': '#2f2f2f',
      warning: '#e16060',
      'line-color': '#262626'
    }
  },
  font: {
    name: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    style: 'sans'
  },
  supportedLocales: [
    {
      code: 'fi',
      name: 'Suomi',
      isDefault: true
    },
    {
      code: 'en',
      name: 'English'
    }
  ],
  analytics: {
    trackEvents: false,
    platform: {
      name: 'umami',
      code: '99f132f7-6ea3-4c60-ab83-9699064e93aa',
      infoUrl: 'https://umami.is/'
    }
  },
  preRegistration: {
    enabled: false
  }
};
