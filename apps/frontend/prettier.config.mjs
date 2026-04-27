import { default as prettierConfig } from '@openvaa/shared-config/prettier';

export default {
  ...prettierConfig,
  plugins: [...(prettierConfig.plugins ?? []), 'prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
  overrides: [...(prettierConfig.overrides ?? []), { files: '*.svelte', options: { parser: 'svelte' } }]
};
