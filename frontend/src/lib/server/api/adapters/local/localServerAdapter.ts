import fs from 'node:fs/promises';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { read } from '$app/server';
import { CREATE_PATHS, type CreatePath, READ_PATHS, type ReadPath } from './localPaths';

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
    const fp = path.join(process.cwd(), READ_PATHS[endpoint]);
    try {
      await fs.access(fp);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read a local file.
   * @param endpoint - The name of the prespecified local path.
   * @returns A `Response` containing the string content of the file.
   * @throws Error on failure.
   */
  read(endpoint: ReadPath): Response {
    const response = read(READ_PATHS[endpoint]);
    if (!response?.ok)
      throw new Error(`Error with readData ${endpoint}: Response: ${response.status} / ${response.statusText}`);
    if (!response.body) throw new Error(`Error with readData ${endpoint}: Response body is empty.`);
    return response;
  }

  /**
   * Create a new json file with the data provided.
   * @param endpoint - The name of the prespecified local path.
   * @param data - The `string` data to be written to the file.
   * @returns A json `Response` containing the created filename.
   * @throws Error on failure.
   */
  async create({ endpoint, data }: { endpoint: CreatePath; data: string }): Promise<Response> {
    const folder = path.join(process.cwd(), CREATE_PATHS[endpoint]);
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
    return json({ filename: path.basename(fp) });
  }
}
