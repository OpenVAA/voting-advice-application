/**
 * Required-environment-variable resolution for Edge Functions.
 *
 * Pure functions, kept apart from the Edge Function entry points so they can be tested. This module has NO Deno imports (no Deno.env, no Deno.serve, no URL imports from deno.land) so it can be imported by both an Edge Function and vitest.
 *
 * SHARED. The module lives in `functions/_shared/`, the directory for modules more than one function uses. Each function imports it by relative path (`../_shared/envConfig.ts`), and the bundler includes it in every function whose entry point does. `_shared/` holds no `index.ts`, so it is never served or deployed as a function of its own.
 *
 * WHY THIS REPLACES A DEFAULT RATHER THAN SUPPLYING A BETTER ONE. A `Deno.env.get('X') || fallback` chain converts a misconfiguration into a wrong result: a fallback from `SITE_URL` to the Supabase API host addresses mailed links at the API origin instead of the site origin -- a link the recipient cannot use, produced by a deployment that reports no error at all. There is no fallback value that is correct here, so the only honest behaviour is to refuse to run.
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
