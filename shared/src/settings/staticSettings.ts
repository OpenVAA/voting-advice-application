import type {StaticSettings} from '../';

export const staticSettings: StaticSettings = {
  admin: {
    email: 'jenna.naukkarinen@tampere.fi'
  },
  appVersion: {
    version: 1,
    requireUserDataVersion: 1,
    source: 'https://github.com/OpenVAA/voting-advice-application/tree/deploy-tampere-nuva'
  },
  dataProvider: {
    type: 'strapi',
    supportsCandidateApp: true
  },
  colors: {
    light: {
      primary: '#22437b',
      secondary: '#666666',
      accent: '#0a716b',
      neutral: '#333333',
      'base-100': '#ffffff',
      'base-200': '#e3f1fa',
      'base-300': '#c8e4f4',
      warning: '#a82525',
      'line-color': '#d9d9d9'
    },
    dark: {
      primary: '#6887e3',
      secondary: '#8c8c8c',
      accent: '#11a8a0',
      neutral: '#cccccc',
      'base-100': '#000000',
      'base-200': '#101212',
      'base-300': '#1f2324',
      warning: '#e16060',
      'line-color': '#262626'
    }
  },
  font: {
    name: 'Montserrat',
    url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap",
    style: 'sans'
  },
  supportedLocales: [
    {
      isDefault: true,
      code: 'fi',
      name: 'Suomi'
    },
  ],
  analytics: {
    platform: {
      name: 'umami',
      code: '42de7670-abc9-4353-9821-cf6130d636ed',
      infoUrl: 'https://umami.is/',
    },
    trackEvents: false
  }
};
