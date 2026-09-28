/**
 * Required-environment-variable resolution for Edge Functions.
 *
 * Pure functions extracted from the invite-candidate Edge Function for testability. This module has NO Deno imports (no Deno.env, no Deno.serve, no URL imports from deno.land) so it can be imported by both the Edge Function and vitest.
 *
 * DUPLICATED ON PURPOSE. Byte-identical copies of this file live in `apps/supabase/supabase/functions/identity-callback/`, `apps/supabase/supabase/functions/invite-candidate/` and `apps/supabase/supabase/functions/send-email/` -- this file is one of the three -- because Supabase treats each top-level function directory as its own deployment unit and this repository has no shared-module directory for Edge Functions. The set is named in full, including the directory you are reading this in, rather than as "the other directories": the copies are byte-identical, so a sentence naming relative siblings would be correct from one vantage point and wrong from the other two, and correcting it per file would break the identity the guard enforces. The copies are held identical by `scripts/assert-edge-env-defaults.mjs`; introducing a shared directory instead is a separate decision with its own deployment validation, so a reader who finds three identical files is looking at a choice rather than at an oversight.
 *
 * WHY THIS REPLACES A DEFAULT RATHER THAN SUPPLYING A BETTER ONE. A `Deno.env.get('X') || fallback` chain converts a misconfiguration into a wrong result: the worst of the seven sites in this repository fell back from `SITE_URL` to the Supabase API host, so an unset variable addressed candidate invite links at the API origin instead of the site origin -- a link the recipient cannot use, produced by a deployment that reported no error at all. There is no fallback value that is correct here, so the only honest behaviour is to refuse to run.
 */

/**
 * Return the value of a required environment variable, or throw naming it.
 *
 * WHY TWO PARAMETERS, when one would look tidier: passing the NAME alongside the VALUE is what lets the message name the variable while keeping this module free of any Deno global, which is the only reason vitest can reach it at all. A one-parameter helper that read the environment itself would be untestable here, and a one-parameter helper that took only the value would lose the variable name from the error -- which is the entire point of the requirement this implements.
 *
 * An absent value and an empty string are both treated as unconfigured, because `X=` in a `.env` file is an operator who has not chosen a value. Every other string is returned unchanged, including `'0'` and `'false'`: the set of missing values is exactly two and is closed on purpose, so a legitimate falsy-reading value is never swallowed.
 *
 * @param name - The environment variable's name, used only to build the message
 * @param value - The value read at the call site, normally `Deno.env.get(name)`
 * @returns The value, unchanged, when it is a non-empty string
 * @throws {Error & { code: string; variable: string }} `ERR_ENV_UNCONFIGURED`
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (value === undefined || value === '') {
    // The message names the variable and nothing else -- no value, no host, no URL.
    throw Object.assign(new Error(`Missing required environment variable: ${name}.`), {
      code: 'ERR_ENV_UNCONFIGURED',
      variable: name
    });
  }

  return value;
}
