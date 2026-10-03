import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, '/developers-guide/development/running-the-development-environment');
}
