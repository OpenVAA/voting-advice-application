/**
 * Reading a page's data again after a save, and asking whether a refused save was refused for the lock on answers.
 *
 * Runs in the browser. Tested in `rereadPageData.test.ts`.
 */

import { log } from '@openvaa/app-shared';
import { tick } from 'svelte';
import { invalidateAll } from '$app/navigation';
import { readAnswersLocked } from './readAnswersLocked';

/**
 * Run the page's loads again, so that what the page shows is what the database holds, and wait one tick for what they brought to reach the contexts and the page's data. A failure is logged and handled where the failure of a load is, so it never rejects.
 * @param logLabel - The label the logged failure starts with, naming the page.
 */
export async function rereadPageData(logLabel: string): Promise<void> {
  await invalidateAll().catch((e) => {
    log.error(`${logLabel} Error reading the page data again: ${e?.message}`);
  });
  await tick();
}

/**
 * Whether a save that was not stored was refused because answers are locked. A refusal that does not name the lock is asked of the stored settings alone. Where answers are locked the page's data is read again, so that every view shows the lock.
 * @param options.refusedByLock - Whether the save's own refusal named the lock.
 * @param options.locale - The locale the settings are read in.
 * @param options.logLabel - The label a failure of the re-read is logged with.
 * @returns `true` when answers are locked, after the page's data was read again.
 */
export async function lockedAfterRefusedSave({
  refusedByLock,
  locale,
  logLabel
}: {
  refusedByLock: boolean;
  locale: string;
  logLabel: string;
}): Promise<boolean> {
  const locked = refusedByLock || (await readAnswersLocked({ locale })) === true;
  if (locked) await rereadPageData(logLabel);
  return locked;
}
