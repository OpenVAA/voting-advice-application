import fs from 'node:fs/promises';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { CREATE_PATHS, type CreatePath, READ_PATHS, type ReadPath } from './localPaths';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * A base class for all ApiRoute Data API services, implementing `read` and `create` methods.
 */
export abstract class LocalServerAdapter {
  /**
   * Check if a local file exists.
   * @param endpoint - The name of the prespecified local path.
   * @returns A `Response` containing the string content of the file.
   * @throws Error on failure.
   */
  async exists(endpoint: ReadPath): Promise<boolean> {
    try {
      await fs.access(READ_PATHS[endpoint]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read a local file as string.
   * @param endpoint - The name of the prespecified local path.
   * @returns A `Promise` containing the string content of the file.
   * @throws Error on failure.
   */
  async read(endpoint: ReadPath): Promise<string> {
    const data = await fs.readFile(READ_PATHS[endpoint]).catch((e) => {
      throw new Error(`Error with readData ${endpoint}: : ${e instanceof Error ? e.message : e}`);
    });
    return data.toString();
  }

  /**
   * Create a new json file with the data provided.
   * @param endpoint - The name of the prespecified local path.
   * @param data - The `string` data to be written to the file.
   * @returns A json `Response` containing the created filename.
   * @throws Error on failure.
   */
  async create({ endpoint, data }: { endpoint: CreatePath; data: string }): Promise<Response> {
    const folder = CREATE_PATHS[endpoint];
    await fs.mkdir(folder, { recursive: true });
    const baseName = new Date().toJSON().replace(/[.:]/g, '-');
    let fp = path.join(folder, `${baseName}.json`);
    let suffix = 0;
    while (true) {
      try {
        await fs.access(fp);
        fp = path.join(folder, `${baseName}_${(++suffix).toString().padStart(2, '0')}.json`);
      } catch {
        break; // File doesn't exist, we can use this filename
      }
      if (suffix > 98) throw new Error(`Too many retries when trying to find an unused filename: ${fp}`);
    }
    await fs.writeFile(fp, data);
    return json({ type: 'success' } as DataApiActionResult);
  }
}
