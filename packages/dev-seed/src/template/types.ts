/**
 * Template TS type — derived via `z.infer<>` per D-16 + D-17.
 *
 * The Template type is the single source of truth for template shape; it mirrors
 * {@link TemplateSchema} exactly without hand-written duplication. Consumers import
 * from the `@openvaa/dev-seed` barrel once the package publishes it.
 */

import type { z } from 'zod';
import type { TemplateSchema } from './schema';

export type Template = z.infer<typeof TemplateSchema>;
