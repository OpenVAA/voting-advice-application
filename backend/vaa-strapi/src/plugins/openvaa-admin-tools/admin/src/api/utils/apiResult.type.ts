export type ApiResult = {
  type: 'failure' | 'success';
  cause?: string;
  message?: string;
};
