export const constants: Record<string, string> = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || '',
  BACKEND_URL_DOCKER: import.meta.env.VITE_BACKEND_URL_DOCKER || '',
  STRAPI_TOKEN: import.meta.env.VITE_STRAPI_TOKEN || ''
};
