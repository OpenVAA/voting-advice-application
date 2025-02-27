export interface DataAdapter {
  readonly type: 'strapi' | 'local';
  readonly supportsCandidateApp: boolean;
  readonly supportsAdminApp: boolean;
}
