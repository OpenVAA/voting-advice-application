import {authenticate, me} from '$lib/api/candidate';
import type {User} from '$lib/types/candidateAttributes';
import {writable, type Writable} from 'svelte/store';

export interface AuthContext {
  user: Writable<User | null>;
  token: Writable<string | null | undefined>;
  logIn: (email: string, password: string) => Promise<boolean>;
  loadUserData: () => Promise<void>;
  logOut: () => Promise<void>;
}

const userStore = writable<User | null>(null);
const tokenStore = writable<string | null | undefined>(undefined);

export const logIn = async (email: string, password: string) => {
  const response = await authenticate(email, password);
  if (!response.ok) return false;

  const data = await response.json();
  tokenStore.set(data.jwt);
  localStorage.setItem('token', data.jwt);

  await loadUserData();

  return true;
};

export const loadLocalStorage = () => {
  tokenStore.set(localStorage.getItem('token'));
};

export const loadUserData = async () => {
  const user = await me();
  if (!user) {
    await logOut();
    return;
  }

  userStore.set(user);
};

export const logOut = async () => {
  userStore.set(null);
  tokenStore.set(null);
  localStorage.removeItem('token');
};

export const authContext: AuthContext = {
  user: userStore,
  token: tokenStore,
  logIn,
  loadUserData,
  logOut
};
