import { default as sharedConfig } from '@openvaa/shared-config/eslint';

export default [
  ...sharedConfig,
  {
    ignores: [
      'playwright*',
    ]
  }
];
