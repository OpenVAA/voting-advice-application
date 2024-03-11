import {env} from '$env/dynamic/public';

export const constants: Record<string, string> = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || '',
  PUBLIC_BACKEND_URL: env.PUBLIC_BACKEND_URL || '' // Accessed by the client-side, so must be loaded dynamically
};
