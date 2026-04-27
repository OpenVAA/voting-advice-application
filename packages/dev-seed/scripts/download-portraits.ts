#!/usr/bin/env tsx
/**
 * ONE-OFF maintainer script to refresh the portrait pool.
 *
 * DO NOT invoke on every seed — the 30 fetched images are checked into the
 * repo at `packages/dev-seed/src/assets/portraits/` and consumed from disk
 * by the Writer (Plan 58-04) and by the `default` template (Plan 58-06).
 *
 * The one-off nature is deliberate: thispersondoesnotexist.com serves a fresh
 * StyleGAN-generated image per request, so running this script OVERWRITES the
 * committed pool with 30 new faces. Commit the fresh files afterwards to lock
 * the new pool for reproducibility.
 *
 * Usage:
 *   yarn workspace @openvaa/dev-seed tsx scripts/download-portraits.ts
 *
 * Requires: network access to https://thispersondoesnotexist.com
 *
 * Licensing caveat: see packages/dev-seed/src/assets/portraits/LICENSE.md —
 * the source does NOT publish an explicit license; the legal posture is
 * acknowledged as ambiguous and the pool is intended for local dev / CI only.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'portraits');
const COUNT = 30;
const RATE_LIMIT_MS = 1000;

await mkdir(OUT_DIR, { recursive: true });
for (let i = 1; i <= COUNT; i++) {
  const n = String(i).padStart(2, '0');
  const res = await fetch('https://thispersondoesnotexist.com/');
  if (!res.ok) {
    process.stderr.write(`Fetch failed on portrait-${n}: ${res.status}\n`);
    process.exit(1);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, `portrait-${n}.jpg`), bytes);
  process.stdout.write(`Wrote portrait-${n}.jpg\n`);
  await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
}
process.stdout.write(`Done — ${COUNT} portraits written to ${OUT_DIR}\n`);
