import fs from 'fs';
import path from 'path';
import { getTestData } from './getTestData';
import { parseFullVaaData } from '../internal';

/**
 * Export the test data a multiple JSON files in the specified output path.
 * @param folder - The output path where the JSON files will be saved.
 */
export function exportTestData(folder: string) {
  const data = parseFullVaaData(getTestData());
  folder = path.join(process.cwd(), folder);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  for (const [key, value] of Object.entries(data)) {
    const fp = path.join(folder, `${key}.json`);
    fs.writeFileSync(fp, JSON.stringify(value, null, 2));
    console.info(`Wrote ${fp}`);
  }
}
