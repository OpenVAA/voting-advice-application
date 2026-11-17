/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import(prettier).Config}
 *
 * See also `.editorconfig` for settings that `prettier` parses for defaults.
 */
const config = {
  bracketSpacing: true,
  singleQuote: true,
  trailingComma: 'none',
  bracketSameLine: true,
  // SQL has no built-in prettier parser, which is why a plugin is needed at all and why `format:check` silently skipped every `.sql` file before phase 163 (CIGATE-02).
  // `apps/frontend/prettier.config.mjs` and `apps/docs/prettier.config.mjs` each spread this array with a `?? []` fallback, so declaring the plugin HERE is what gives every workspace the same SQL coverage without a leaf-config edit.
  // The Postgres dialect key is `language`, NOT `dialect`: `dialect` belongs to the plugin's sql-cst backend and `database` to its node-sql-parser backend, so under the default sql-formatter backend either one would be accepted and silently inert, leaving the formatter in generic-SQL mode while appearing configured.
  plugins: ['prettier-plugin-sql'],
  overrides: [{ files: '*.sql', options: { language: 'postgresql' } }]
};

export default config;
