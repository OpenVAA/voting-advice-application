export type ApiResult = {
  type: 'failure' | 'success';
  cause?: string;
  data?: Record<string, unknown>;
};
