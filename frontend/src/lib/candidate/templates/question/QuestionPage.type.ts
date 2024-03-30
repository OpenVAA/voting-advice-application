export type QuestionPageProps = {
  /**
   * Edit mode for the question page.
   * If true, the page shows "Save and Return" and "Cancel" buttons. In this case the user comes from the question summary.
   * After making changes, the user is taken back to the summary.
   *
   * If false, the user comes from the previous question or the quesiton intro and the page shows "Save and Continue" button.
   * After making changes, the user is taken to the next unanswered question or the start page if all questions are answered.
   *
   * @default false
   */
  editMode?: boolean;
};
