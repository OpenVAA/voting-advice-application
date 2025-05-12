import { type Actions, fail } from '@sveltejs/kit';
import { adminWriter as adminWriterPromise } from '$lib/api/adminWriter';

// export const load: PageServerLoad = async ({ params, locals }) => {
//   // Stub for loading question information
//   // This would typically fetch question data from a database
//   return {
//     // Return mock or empty data
//     questionInfo: {}
//   };
// };

export const actions = {
  // Create action for handling form submissions
  default: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();

      // Log the form data for debugging purposes
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());

      const authToken = cookies.get('token');
      const adminWriter = await adminWriterPromise;
      adminWriter.init({ fetch });

      const { type } = (await adminWriter.generateQuestionInfo({ authToken, questionIds })) ?? {};

      console.info('got type', type);

      return {
        success: type === 'success'
      };
    } catch (err) {
      console.error('Error processing form:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return fail(500, { type: 'error', error: `Failed to process form: ${errorMessage}` });
    }
  }

  //   update: async ({ request, locals }) => {
  //     try {
  //       const formData = await request.formData();

  //       // Log the form data for debugging purposes
  //       console.log('Update data received:', Object.fromEntries(formData));

  //       // Placeholder for update logic

  //       return {
  //         success: true
  //       };
  //     } catch (err) {
  //       console.error('Error updating question:', err);
  //       return fail(500, { error: 'Failed to update question' });
  //     }
  //   },

  //   delete: async ({ request, locals }) => {
  //     try {
  //       const formData = await request.formData();
  //       const id = formData.get('id')?.toString();

  //       if (!id) {
  //         return fail(400, { error: 'Missing question ID' });
  //       }

  //       // Placeholder for delete logic

  //       return {
  //         success: true
  //       };
  //     } catch (err) {
  //       console.error('Error deleting question:', err);
  //       return fail(500, { error: 'Failed to delete question' });
  //     }
  //   }
} satisfies Actions;
