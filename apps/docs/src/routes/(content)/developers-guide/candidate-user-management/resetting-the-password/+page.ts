import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, '/developers-guide/candidate-app/login-and-password-reset');
}
