/**
 * Upload test video/image assets to LocalStack S3 for E2E tests.
 *
 * Files from tests/tests/data/assets/ are uploaded to the LocalStack S3
 * bucket so that customData.video URLs in the test dataset resolve correctly.
 */

import { readdirSync, readFileSync } from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const S3_ENDPOINT = process.env.STATIC_CONTENT_BASE_URL || 'http://localhost:4566';
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'static.openvaa.org';

const currentDir = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(currentDir, '..', 'data', 'assets');
const S3_PREFIX = 'public/test-assets';

const CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.vtt': 'text/vtt'
};

/**
 * Upload all files from tests/tests/data/assets/ to LocalStack S3.
 * Uses simple PUT requests (no AWS SDK needed for LocalStack).
 */
export async function uploadTestAssets(): Promise<void> {
  const files = readdirSync(ASSETS_DIR).filter((f) => !f.startsWith('.'));

  for (const file of files) {
    const filePath = join(ASSETS_DIR, file);
    const body = readFileSync(filePath);
    const ext = extname(file).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    const key = `${S3_PREFIX}/${file}`;
    const url = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;

    const response = await fetch(url, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': contentType,
        'x-amz-acl': 'public-read'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file} to S3: ${response.status} ${response.statusText}`);
    }
  }
}
