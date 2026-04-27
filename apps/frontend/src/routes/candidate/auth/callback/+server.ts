import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Auth callback route for Supabase PKCE token exchange.
 *
 * Handles all Supabase auth redirects:
 * - `recovery`: Password reset flow -> redirects to password-reset page
 * - `invite`: Candidate invite flow -> redirects to register page
 * - `email`/`signup`: Email confirmation -> redirects to `next` param or candidate home
 * - Default: Redirects to candidate home
 *
 * On error or missing params, redirects to login with an error message.
 *
 * Uses `locals.supabase` (server client from hooks.server.ts) so session cookies
 * are set automatically by @supabase/ssr.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next');
  const lang = locals.currentLocale ?? 'en';

  if (token_hash && type) {
    const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      switch (type) {
        case 'recovery':
          redirect(303, `/${lang}/candidate/password-reset`);
          break;
        case 'invite': {
          // Get the user's email from the newly established session
          const {
            data: { user }
          } = await locals.supabase.auth.getUser();
          const email = encodeURIComponent(user?.email ?? '');
          redirect(303, `/${lang}/candidate/register/password?email=${email}`);
          break;
        }
        case 'email':
        case 'signup':
          redirect(303, next ? `/${lang}/${next.replace(/^\//, '')}` : `/${lang}/candidate`);
          break;
        default:
          redirect(303, `/${lang}/candidate`);
      }
    }
  }

  // Error or missing params -- redirect to login with error
  redirect(303, `/${lang}/candidate/login?errorMessage=authError`);
};
