// Fixture for scripts/assert-edge-env-defaults.mjs, scanned on every run of that guard.
// The expected flagged lines are in assert-edge-env-defaults.expected.violations.

// Flagged: a default directly after the read.
const direct = Deno.env.get('SITE_URL') ?? 'http://localhost';

// Flagged: a default after a trimming member call.
const trimmedNullish = Deno.env.get('PUBLIC_PROJECT_ID')?.trim() ?? 'seed-id';

// Flagged: the same with `||`.
const trimmedOr = Deno.env.get('SMTP_HOST')?.trim() || 'localhost';

// Flagged: a chain of member accesses, non-null asserted.
const lowered = Deno.env.get('IDENTITY_PROVIDER_TYPE')!.trim().toLowerCase() || 'none';

// Not flagged: the read is handed to requireEnv, which throws naming the variable.
const required = requireEnv('SMTP_PORT', Deno.env.get('SMTP_PORT')?.trim());

// Not flagged: a default on an ordinary value.
const grants = payload.grants || [];

// Not flagged: a comment quoting the shape, Deno.env.get('X') ?? 'x'.
