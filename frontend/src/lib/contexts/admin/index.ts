import { getContext, setContext } from 'svelte';
import type { AppType } from '../app';

const ADMIN_CONTEXT_KEY = 'admin';

export interface AdminContext {
  // Add admin-specific context properties here
}

export function initAdminContext() {
  const adminContext: AdminContext = {
    // Initialize admin context properties
  };

  setContext<AdminContext>(ADMIN_CONTEXT_KEY, adminContext);
  return adminContext;
}

export function getAdminContext() {
  return getContext<AdminContext>(ADMIN_CONTEXT_KEY);
}
