import type { StaticSettings } from './staticSettings.type';

export const staticSettings: StaticSettings = {
  admin: {
    email: 'patrick.dumont@anu.edu.au'
  },
  appVersion: {
    version: 1,
    requireUserDataVersion: 1,
    source: 'https://github.com/OpenVAA/voting-advice-application/tree/deploy-luxemburg-vaa-2025'
  },
  dataAdapter: {
    type: 'strapi',
    supportsCandidateApp: true
  },
  colors: {
    light: {
      primary: '#2546a8',
      secondary: '#666666',
      accent: '#0a716b',
      neutral: '#333333',
      'base-100': '#ffffff',
      'base-200': '#e8f5f6',
      'base-300': '#d1ebee',
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
    name: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    style: 'sans'
  },
  supportedLocales: [
    {
      code: 'lb',
      name: 'Lëtzebuergesch',
      isDefault: true
    },
    {
      code: 'fr',
      name: 'Français'
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
      code: '8c7d154a-9597-48f4-9038-3ee3cedc6b56',
      infoUrl: 'https://umami.is'
    }
  },
  preRegistration: {
    enabled: false
  }
};
