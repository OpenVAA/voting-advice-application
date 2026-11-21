import type { Snippet } from 'svelte';
import type { MainContentProps } from '$layouts/main';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Where a save stands: none running, one running, or the last one failed.
 */
export type PasswordSaveStatus = 'idle' | 'saving' | 'failed';

/**
 * The page's `heading`, `children` and `primaryActions` of `MainContent` are the view's own or come in under the names below, so the props of `MainContent` they would otherwise be are left out.
 */
export type PasswordSaveFormProps = Omit<MainContentProps, 'title' | 'heading' | 'children' | 'primaryActions'> & {
  /**
   * The page's title, and its first-level heading unless `heading` is given.
   */
  title: string;
  /**
   * Optional content for the title block, in place of a `<h1>` holding `title`.
   */
  heading?: Snippet;
  /**
   * Optional content shown above the address of the account.
   */
  children?: Snippet;
  /**
   * The address of the signed-in account, shown as text and handed to the password form. When it is empty or absent, the label and the address are left out together.
   */
  email?: string;
  /**
   * The app's own store of a new password for the signed-in account.
   */
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
  /**
   * Run once a password has been saved. It is awaited, and the main button keeps its saving state until it settles. A rejection is logged.
   */
  afterSave: () => Promise<unknown>;
  /**
   * Whether the page behind the form is shaded, so that the fields' rows are painted to show on it. @default false
   */
  onShadedBg?: boolean;
  /**
   * The test id of the view's root.
   */
  testId: string;
  /**
   * The test id of the shown address.
   */
  emailTestId: string;
  /**
   * The test id of the alert shown when a save fails.
   */
  errorTestId: string;
  /**
   * The action beside the main button.
   */
  secondaryAction: Snippet;
  /**
   * Bindable: Where a save stands. @default 'idle'
   */
  status?: PasswordSaveStatus;
};
