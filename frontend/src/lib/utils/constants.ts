export const constants: Record<string, string> = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || '',
  PUBLIC_BACKEND_URL: import.meta.env.VITE_PUBLIC_BACKEND_URL || process.env.VITE_PUBLIC_BACKEND_URL || '',
  STRAPI_TOKEN: import.meta.env.VITE_STRAPI_TOKEN || process.env.VITE_STRAPI_TOKEN || ''
};
