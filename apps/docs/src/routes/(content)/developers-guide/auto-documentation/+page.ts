import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, '/developers-guide/about-these-docs');
}
