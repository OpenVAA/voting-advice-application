/**
 * POST /api/admin/jobs/[id]/message
 * Add a message to a specific job
 */

import { json } from '@sveltejs/kit';
import { addJobErrorMessage, addJobInfoMessage, addJobWarningMessage } from '$lib/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params, request }: RequestEvent) {
  try {
    const { id } = params;
    const { type, message } = await request.json();

    if (!id) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (!type || !message) {
      return json({ error: 'Message type and content are required' }, { status: 400 });
    }

    switch (type) {
      case 'info':
        addJobInfoMessage(id, message);
        break;
      case 'warning':
        addJobWarningMessage(id, message);
        break;
      case 'error':
        addJobErrorMessage(id, message);
        break;
      default:
        return json({ error: 'Invalid message type. Must be info, warning, or error' }, { status: 400 });
    }

    return json({ message: 'Message added successfully' });
  } catch (error) {
    console.error('Error adding message to job:', error);
    return json({ error: 'Failed to add message to job' }, { status: 500 });
  }
}
