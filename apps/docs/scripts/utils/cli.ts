/**
 * Helpers for the docs scripts that run as commands.
 */
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Whether the module at `importMetaUrl` is the script the process was started with, so that a script runs its command only when it is run and not when a test imports it.
 * @param importMetaUrl - The module's `import.meta.url`.
 */
export function isMainModule(importMetaUrl: string): boolean {
  const entry = process.argv[1];
  return entry !== undefined && path.resolve(entry) === fileURLToPath(importMetaUrl);
}
