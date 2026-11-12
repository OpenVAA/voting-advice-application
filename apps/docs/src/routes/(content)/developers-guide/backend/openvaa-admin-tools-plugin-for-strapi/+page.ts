import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, '/developers-guide/backend/data-import-and-deletion');
}
