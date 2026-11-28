import { LocalServerFeedbackWriter } from './localServerFeedbackWriter';

// eslint-disable-next-line no-restricted-syntax -- stateless: no fields, no configuration step, and postFeedback works only on its argument
export const feedbackWriter = new LocalServerFeedbackWriter();
