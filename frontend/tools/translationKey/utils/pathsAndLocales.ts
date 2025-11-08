import fs from 'fs';
import path from 'path';

// Path where generated file is output
export const outputPath = path.join('src', 'lib', 'types', 'generated', 'translationKey.ts');
// Path to translation files from the frontend directory

export const dirPath = path.join('src', 'lib', 'i18n', 'translations');
export const locales = fs.readdirSync(dirPath).filter((name) => {
  return fs.lstatSync(path.join(dirPath, name)).isDirectory();
});
