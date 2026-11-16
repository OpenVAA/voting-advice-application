import { log } from '@openvaa/app-shared';
import { createDataProvider } from '$lib/api/dataProvider';

/**
 * Read whether the project's answers are locked now, from the stored settings alone.
 *
 * A page whose save failed asks it to learn whether the lock is the cause. It runs no load again: a load that reruns after a fault can sign the user out or replace the page with the error page, and the edits the page holds would go with it. Only a page that learns that answers are locked reads its data again.
 *
 * Runs in the browser, on the tab's own client.
 * @param options.locale - The locale the settings are read in.
 * @returns `true` while answers are locked, `false` while they are not, and `undefined` when the settings cannot be read. A failure is logged with its name alone.
 */
export async function readAnswersLocked({ locale }: { locale?: string } = {}): Promise<boolean | undefined> {
  try {
    const settings = await createDataProvider({ fetch, browser: true, locale }).getAppSettings({ locale });
    return settings?.access?.answersLocked === true;
  } catch (e) {
    log.error(`Reading whether answers are locked failed: ${(e as Error)?.name ?? '-'}`);
    return undefined;
  }
}
