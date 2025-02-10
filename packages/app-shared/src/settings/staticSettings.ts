import type { StaticSettings } from './staticSettings.type';

export const staticSettings: StaticSettings = {
  admin: {
    email: 'support@openvaa.org'
  },
  appVersion: {
    version: 2,
    requireUserDataVersion: 2,
    source: 'https://github.com/OpenVAA/voting-advice-application/tree/deploy-nuorten-vaalikone-2025'
  },
  dataAdapter: {
    type: 'strapi',
    supportsCandidateApp: true
  },
  colors: {
    light: {
      primary: '#00a18e',
      secondary: '#666666',
      accent: '#00a18e',
      neutral: '#333333',
      'base-100': '#ffffff',
      'base-200': '#e3fbf4',
      'base-300': '#cbf8ea',
      warning: '#a82525',
      'line-color': '#d9d9d9'
    },
    dark: {
      primary: '#00ccb4',
      secondary: '#8c8c8c',
      accent: '#00ccb4',
      neutral: '#cccccc',
      'base-100': '#000000',
      'base-200': '#141a18',
      'base-300': '#27332f',
      warning: '#e16060',
      'line-color': '#262626'
    }
  },
  font: {
    name: 'Rubik',
    url: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap',
    style: 'sans'
  },
  supportedLocales: [
    {
      code: 'fi',
      name: 'Suomi',
      isDefault: true
    },
    {
      code: 'sv',
      name: 'Svenska'
    },
    {
      code: 'en',
      name: 'English'
    }
  ],
  analytics: {
    trackEvents: true,
    platform: {
      name: 'umami',
      code: 'd3ba4528bcfa4aca4ca576071b212498432a164e', // Staging code
      infoUrl: 'https://umami.is/'
    }
  },
  preRegistration: {
    enabled: true
  }
};
