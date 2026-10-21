/**
 * Compiles the Paraglide messages into `src/lib/paraglide/` with the Vite plugin's options, for jobs that need the generated output without a frontend build. Run it from `apps/frontend`: `yarn workspace @openvaa/frontend paraglide:compile`.
 */
import { compile } from '@inlang/paraglide-js';
import { PARAGLIDE_OPTIONS } from '../paraglide.options';

await compile(PARAGLIDE_OPTIONS);
