import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default [
  ...sharedConfig,
  {
    ignores: [
      '.strapi',
      'dist/',
      'types/generated/',
      'src/extensions/',
      'strapi-plugin-import-export-entries/'
    ]
  },
  {
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.jest,
        ...globals.node,
        ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
        strapi: true,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "module",

      parserOptions: {
        requireConfigFile: false,

        ecmaFeatures: {
          experimentalObjectRestSpread: true,
          jsx: false,
        },
      },
    },
  },
];