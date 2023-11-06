import {authenticate} from '$lib/api/candidate';
import {writable, type Writable} from 'svelte/store';

export type User = Record<string, string | number | boolean> | null;

export interface AuthContext {
  user: Writable<User>;
  token: Writable<string | null>;
  logIn: (password: string) => Promise<boolean>;
  logOut: () => Promise<void>;
}

const userStore = writable<User>(null);
const tokenStore = writable<string | null>(null);
export const logIn = async (password: string) => {
  const response = await authenticate('test', password);
  if (response.ok) {
    const data = await response.json();
    userStore.set(data.user);
    tokenStore.set(data.jwt);
    return true;
  }
  return false;
};

export const logOut = async () => {
  userStore.set(null);
  tokenStore.set(null);
};

export const authContext: AuthContext = {
  user: userStore,
  token: tokenStore,
  logIn,
  logOut
};
