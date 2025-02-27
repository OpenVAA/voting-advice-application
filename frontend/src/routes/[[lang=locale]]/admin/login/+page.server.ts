import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect to admin home if already logged in
  if (locals.user?.role === 'admin') {
    throw redirect(302, '/admin');
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    if (!email || !password) {
      return fail(400, { message: 'Missing email or password' });
    }

    try {
      // TODO: Replace with actual admin authentication
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        return fail(401, { message: 'Invalid credentials' });
      }

      const { token } = await response.json();
      cookies.set('admin_token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return fail(500, { message: 'Internal server error' });
    }
  }
};
