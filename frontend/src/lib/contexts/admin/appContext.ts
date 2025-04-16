import { getContext, setContext } from 'svelte';

const ADMIN_CONTEXT_KEY = Symbol('admin');

export interface AdminContext {
  isAuthenticated: boolean;
}

export function initAdminContext() {
  const adminContext: AdminContext = {
    isAuthenticated: false
  };

  setContext<AdminContext>(ADMIN_CONTEXT_KEY, adminContext);
  return adminContext;
}

export function getAdminContext() {
  return getContext<AdminContext>(ADMIN_CONTEXT_KEY);
}
