/**
 * Server-side page logic for file processing feature.
 * Upload and delete operations moved to DataWriter (client-side).
 * This file only contains the process action stub.
 */

import { type Actions, fail } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { AUTH_TOKEN_KEY } from '$lib/auth';

////////////////////////////////////////////////////////////////////////
// Load function
////////////////////////////////////////////////////////////////////////

export async function load({ cookies, fetch, depends }) {
  depends('app:documents');

  // Get auth token for DataWriter calls
  const authToken = cookies.get(AUTH_TOKEN_KEY);
  if (!authToken) {
    return { documents: [] };
  }

  // Get documents via DataWriter (server-side call)
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  try {
    const documents = await dataWriter.getDocuments({ authToken });
    return { documents };
  } catch (error) {
    console.error('Error loading documents:', error);
    return { documents: [] };
  }
}

////////////////////////////////////////////////////////////////////////
// Form actions
////////////////////////////////////////////////////////////////////////

export const actions = {
  /**
   * Process selected documents
   * TODO: Implement processing logic
   */
  process: async ({ request, cookies, fetch }) => {
    // Get auth token
    const authToken = cookies.get(AUTH_TOKEN_KEY);
    if (!authToken) {
      return fail(401, { type: 'error', error: 'Authentication required' });
    }

    const dataWriter = await dataWriterPromise;
    dataWriter.init({ fetch });

    const formData = await request.formData();
    const documentIds = formData.getAll('documentIds') as Array<string>;
    const processAll = formData.get('processAll') === 'true';

    try {
      // Get all documents to determine which to process
      const allDocuments = await dataWriter.getDocuments({ authToken });

      const documentsToProcess = processAll ? allDocuments : allDocuments.filter((doc) => documentIds.includes(doc.id));

      if (documentsToProcess.length === 0) {
        return fail(400, { message: 'No documents to process' });
      }

      // TODO: Implement processing logic
      console.info('To implement: processing logic');
      console.info(
        `Would process ${documentsToProcess.length} document(s):`,
        documentsToProcess.map((d) => d.filename)
      );

      return {
        success: true,
        message: `To implement: processing logic for ${documentsToProcess.length} document(s)`
      };
    } catch (error) {
      console.error('Error processing documents:', error);
      return fail(500, { message: 'Failed to process documents. Please try again.' });
    }
  }
} satisfies Actions;
