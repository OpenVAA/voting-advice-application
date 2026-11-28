/** The tsup build every library package re-exports from its own `tsup.config.ts`. */
export default {
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: true
};
