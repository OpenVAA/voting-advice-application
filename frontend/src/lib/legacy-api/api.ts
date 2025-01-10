export const API_ROOT = '/api';

// NB. We can't use an Enum here because the values are computed and not numbers
/**
 * The API routes available.
 */
export const API = {
  Feedback: `${API_ROOT}/feedback`
} as const;
