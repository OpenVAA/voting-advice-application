import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, '/developers-guide/contestant-app/pre-registration-and-invitation');
}
