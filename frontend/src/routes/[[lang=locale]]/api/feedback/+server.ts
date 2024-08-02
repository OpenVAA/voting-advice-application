/**
 * An API route for receiving feedback, which is written as a JSON file in the `data/feedback` folder. This is accessed via the `$lib/api/feedback.ts: sendFeedback` function.
 */

import fs from 'fs';
import path from 'path';
import { error, json } from '@sveltejs/kit';
import type { FeedbackData } from '$lib/api/dataProvider';
import { DataFolder } from '$lib/api/dataProvider/local';
import { logDebugError } from '$lib/utils/logger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  logDebugError('[/api/feedback/+server.ts] Receiving feedback via the local API');

  try {
    const data: FeedbackData = await request.json().catch((e) => {
      throw e;
    });

    if (!data.date) data.date = new Date();
    /** Used for naming the file */
    let dateString: string;
    try {
      dateString = new Date(data.date).toISOString();
    } catch {
      dateString = new Date().toISOString();
    }

    const baseName = `feedback_${dateString.replaceAll(':', '.')}`;
    let fp = path.join(process.cwd(), DataFolder.Feedback, `${baseName}.json`);

    let suffix = 0;
    while (fs.existsSync(fp)) {
      fp = path.join(process.cwd(), DataFolder.Feedback, `${baseName}_${++suffix}.json`);
      if (suffix > 50)
        throw new Error(`Too many retries when trying to find an unused filename: ${fp}`);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2));
  } catch (e) {
    if (e instanceof Error) error(400, { message: e.message });
    error(400, { message: `An unknown error occured while writing feedback to disk: ${e}` });
  }

  return json({ ok: true });
};
