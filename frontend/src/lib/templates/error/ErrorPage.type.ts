export interface ErrorPageProps {
  /**
   * The page title.
   */
  title?: string;
  /**
   * The text content of the page, which will be displayed as HTML and sanitized.
   */
  content?: string;
  /**
   * The hero emoji to be displayed on the page.
   */
  emoji?: string;
}
