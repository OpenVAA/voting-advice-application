import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is admin
  // if (locals.user?.role !== 'admin') {
  //   throw new Error('Unauthorized');
  // }
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const elections = {
      parliamentary: data.get('parliamentary') === 'on',
      municipal: data.get('municipal') === 'on',
      mayoral: data.get('mayoral') === 'on'
    };

    if (!Object.values(elections).some(Boolean)) {
      return fail(400, { message: 'No elections selected' });
    }

    try {
      // TODO: Replace with actual factor analysis computation
      const response = await fetch('/api/admin/factor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ elections })
      });

      if (!response.ok) {
        return fail(500, { message: 'Failed to compute factors' });
      }

      return { success: true };
    } catch (error) {
      console.error('Factor analysis error:', error);
      return fail(500, { message: 'Internal server error' });
    }
  }
};
