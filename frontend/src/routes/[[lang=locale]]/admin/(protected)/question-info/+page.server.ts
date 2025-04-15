import { type Actions, fail } from '@sveltejs/kit';
import { adminWriter as adminWriterPromise } from '$lib/api/adminWriter';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';

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
  default: async ({ request, locals, cookies }) => {
    try {
      const dw = await dataProviderPromise;
      const questionData = await dw.getQuestionData();

      const questionIds = questionData.questions.map((question) => question.id)[0];

      const formData = await request.formData();

      // Log the form data for debugging purposes
      console.info('Form data received:', Object.fromEntries(formData));

      const authToken = cookies.get('token');
      const adminWriter = await adminWriterPromise;
      adminWriter.init({ fetch });

      const { type } = await adminWriter.generateQuestionInfo({ authToken });

      console.info('got type', type);

      return {
        success: type === 'success'
      };
    } catch (err) {
      console.error('Error processing form:', err);
      return fail(500, { error: 'Failed to process form' });
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
