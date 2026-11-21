/**
 * The SMTP transport and the sender every mail of the Edge Functions is sent with.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Functions and vitest. The five `SMTP_*` values are a parameter: the caller reads the environment.
 *
 * SHARED. The module lives in `functions/_shared/`, the directory for modules more than one function uses. Each function imports it by relative path (`../_shared/mailTransport.ts`) and hands the answer to `nodemailer.createTransport`.
 *
 * TWO DELIBERATE BRANCHES. With both `SMTP_USER` and `SMTP_PASS` set the transport authenticates and verifies the server's certificate. Without them it is the local mail catcher's, which serves a self-signed certificate and takes no credentials, so verification is relaxed there alone: relaxing it on the credentialed branch would send the credentials over a channel whose peer is unauthenticated.
 */

import { requireEnv } from './envConfig.ts';

/** The five `SMTP_*` values, as read from the environment. */
export interface SmtpEnv {
  /** `SMTP_HOST`; required. */
  host: string | undefined;
  /** `SMTP_PORT`; required, a decimal port number. */
  port: string | undefined;
  /** `SMTP_USER`; optional. */
  user: string | undefined;
  /** `SMTP_PASS`; optional. */
  pass: string | undefined;
  /** `SMTP_FROM`; required, the address every mail is sent from. */
  sender: string | undefined;
}

/** How long each phase of the SMTP conversation may take before the send counts as failed. */
export const SMTP_TIMEOUT_MS = 10000;

/**
 * The options of the SMTP transport.
 *
 * @param env - The five `SMTP_*` values
 * @returns The transport options: the host and the port, no implicit TLS, a timeout for the connection, the greeting and the socket, and either the credentials or, without them, an unverified certificate
 * @throws {Error & { code: string; variable: string }} `ERR_ENV_UNCONFIGURED` naming `SMTP_HOST` or `SMTP_PORT` when it is unset or empty
 */
export function smtpTransportConfig(env: SmtpEnv): Record<string, unknown> {
  const config: Record<string, unknown> = {
    host: requireEnv('SMTP_HOST', env.host),
    port: parseInt(requireEnv('SMTP_PORT', env.port), 10),
    secure: false,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS
  };
  if (env.user && env.pass) {
    config.auth = { user: env.user, pass: env.pass };
  } else {
    config.tls = { rejectUnauthorized: false };
  }
  return config;
}

/**
 * The address every mail is sent from. A caller never chooses it.
 *
 * @param env - The five `SMTP_*` values
 * @returns `SMTP_FROM`
 * @throws {Error & { code: string; variable: string }} `ERR_ENV_UNCONFIGURED` naming `SMTP_FROM` when it is unset or empty
 */
export function configuredSender(env: SmtpEnv): string {
  return requireEnv('SMTP_FROM', env.sender);
}
