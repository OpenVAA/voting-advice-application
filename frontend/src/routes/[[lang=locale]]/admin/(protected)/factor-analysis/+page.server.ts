import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { adminWriter as adminWriterPromise } from '$lib/api/adminWriter';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is admin
  // if (locals.user?.role !== 'admin') {
  //   throw new Error('Unauthorized');
  // }
};

export const actions: Actions = {
  default: async () => {
    try {
      // Get the admin writer and initialize it
      const adminWriter = await adminWriterPromise;
      adminWriter.init({ fetch });

      // Call the compute factor loadings function
      const result = await adminWriter.computeFactorLoadings();

      return result;
    } catch (error) {
      console.error('Factor analysis error:', error);
      return fail(500, { type: 'error', message: 'Internal server error' });
    }
  }
};
