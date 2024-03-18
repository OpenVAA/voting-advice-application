export type TextAreaProps = {
  /**
   * The unique identifier for the text area.
   */
  id: string;
  /**
   * The text content of the text area.
   */
  text: string | undefined;
  /**
   * The header text to be displayed above the textarea. If not provided, header slot will be used.
   * @default undefined
   */
  headerText?: string;
  /**
   * The key used to store the textarea's content in local storage.
   * @default undefined
   */
  localStorageId?: string;
  /**
   * Previously saved text content from the database.
   * Is initially shown if nothing is in local storage.
   * @default undefined
   */
  previouslySaved?: string | undefined;
  /**
   * The number of rows in the textarea.
   * @default 4
   */
  rows?: number;
  /**
   * Whether the textarea is disabled.
   * @default false
   */
  disabled?: boolean;
};
