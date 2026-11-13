import { redirect } from '@sveltejs/kit';

export const prerender = true;

export function load() {
  redirect(308, '/developers-guide/contestant-app/login-and-password-reset');
}
