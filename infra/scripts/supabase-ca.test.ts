/**
 * Pins the root certificate the deploy pipeline trusts for its database connections, `infra/certs/supabase-root-2021-ca.crt`.
 *
 * The pipeline connects with `sslmode=verify-full` against this file, so the file is the whole of the server's identity: a different root would make the pipeline trust whoever holds that root's key. The file must hold one certificate, the Supabase Root 2021 CA with the fingerprint below, a self-signed CA certificate that stays valid for more than 180 days. A substituted, rotated or soon-expiring root fails here, before a deploy, rather than loosening or breaking verification unseen. The same checks are shown red on another root.
 */

import { X509Certificate } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { rootCertificates } from 'node:tls';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** The committed root, relative to the repository root. */
const CA_PATH = 'infra/certs/supabase-root-2021-ca.crt';

/** The SHA-256 fingerprint of the Supabase Root 2021 CA. */
const ROOT_SHA256 = '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA';

/** The common name the root's subject must carry. */
const ROOT_CN = 'CN=Supabase Root 2021 CA';

/** How long the root must still be valid, so the pin turns red well before the root expires. */
const MIN_REMAINING_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * The checks a PEM fails as the pinned root, each named by the property it is about. An empty list means the PEM is the pinned root.
 */
function rootCaViolations(pem: string, now: number = Date.now()): Array<string> {
  const blocks = pem.match(/-----BEGIN CERTIFICATE-----/g)?.length ?? 0;
  if (blocks !== 1) return [`count: ${blocks} certificate blocks, expected exactly 1`];

  let cert: X509Certificate;
  try {
    cert = new X509Certificate(pem);
  } catch (error) {
    return [`parse: ${(error as Error).message}`];
  }

  const violations: Array<string> = [];
  if (cert.fingerprint256 !== ROOT_SHA256) violations.push(`fingerprint: ${cert.fingerprint256}`);
  if (!cert.subject.split('\n').includes(ROOT_CN)) violations.push(`subject: ${cert.subject.replace(/\n/g, ', ')}`);
  if (!cert.ca) violations.push('ca: not a CA certificate');
  if (!cert.checkIssued(cert) || !cert.verify(cert.publicKey))
    violations.push('self-signed: not issued and signed by itself');
  const validTo = new Date(cert.validTo).getTime();
  if (!(validTo - now > MIN_REMAINING_MS)) violations.push(`expiry: valid to ${cert.validTo}, less than 180 days away`);
  return violations;
}

describe('the pinned Supabase root CA', () => {
  it(`${CA_PATH} is the Supabase Root 2021 CA`, () => {
    const file = join(REPO_ROOT, CA_PATH);
    expect(existsSync(file), `${CA_PATH} is missing`).toBe(true);
    expect(rootCaViolations(readFileSync(file, 'utf8'))).toEqual([]);
  });

  it('another root fails the fingerprint and the subject checks', () => {
    const names = rootCaViolations(rootCertificates[0]).map((violation) => violation.split(':')[0]);
    expect(names).toEqual(expect.arrayContaining(['fingerprint', 'subject']));
  });
});
