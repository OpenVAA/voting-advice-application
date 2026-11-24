/**
 * The shared SMTP transport: the credentialed branch authenticates and verifies the certificate, the uncredentialed one relaxes verification for the local mail catcher, and an unset required value throws naming it.
 */

import { describe, expect, it } from 'vitest';
import { configuredSender, SMTP_TIMEOUT_MS, smtpTransportConfig } from './mailTransport.ts';
import type { SmtpEnv } from './mailTransport.ts';

const LOCAL: SmtpEnv = {
  host: 'inbucket',
  port: '2500',
  user: undefined,
  pass: undefined,
  sender: 'noreply@example.org'
};

const CREDENTIALED: SmtpEnv = { ...LOCAL, host: 'smtp.example.org', port: '0587', user: 'mailer', pass: 'secret' };

const TIMEOUTS = {
  connectionTimeout: SMTP_TIMEOUT_MS,
  greetingTimeout: SMTP_TIMEOUT_MS,
  socketTimeout: SMTP_TIMEOUT_MS
};

describe('smtpTransportConfig', () => {
  it('authenticates with the credentials and leaves certificate verification on when both are set', () => {
    expect(smtpTransportConfig(CREDENTIALED)).toEqual({
      host: 'smtp.example.org',
      port: 587,
      secure: false,
      ...TIMEOUTS,
      auth: { user: 'mailer', pass: 'secret' }
    });
  });

  it.each([
    ['neither credential', {}],
    ['only the user', { user: 'mailer' }],
    ['only the password', { pass: 'secret' }],
    ['empty credentials', { user: '', pass: '' }]
  ])('relaxes certificate verification and sends no credentials with %s', (_label, credentials) => {
    expect(smtpTransportConfig({ ...LOCAL, ...credentials })).toEqual({
      host: 'inbucket',
      port: 2500,
      secure: false,
      ...TIMEOUTS,
      tls: { rejectUnauthorized: false }
    });
  });

  it.each([
    ['SMTP_HOST', { host: undefined }],
    ['SMTP_HOST', { host: '' }],
    ['SMTP_PORT', { port: undefined }],
    ['SMTP_PORT', { port: '' }]
  ])('throws ERR_ENV_UNCONFIGURED naming %s when it is unset or empty', (variable, missing) => {
    expect(() => smtpTransportConfig({ ...CREDENTIALED, ...missing })).toThrow(
      expect.objectContaining({ code: 'ERR_ENV_UNCONFIGURED', variable })
    );
  });

  it('does not read the sender', () => {
    expect(() => smtpTransportConfig({ ...LOCAL, sender: undefined })).not.toThrow();
  });
});

describe('configuredSender', () => {
  it('is SMTP_FROM', () => {
    expect(configuredSender(LOCAL)).toBe('noreply@example.org');
  });

  it.each([[undefined], ['']])('throws ERR_ENV_UNCONFIGURED naming SMTP_FROM for %j', (sender) => {
    expect(() => configuredSender({ ...LOCAL, sender })).toThrow(
      expect.objectContaining({ code: 'ERR_ENV_UNCONFIGURED', variable: 'SMTP_FROM' })
    );
  });
});
