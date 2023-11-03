import {writable, type Writable} from 'svelte/store';

export type User = string | null;
export interface AuthContext {
  user: Writable<User>;
  logIn: (password: string) => Promise<boolean>;
  logOut: () => Promise<void>;
}

const userStore = writable<User>(null);
export const logIn = async (password: string) => {
  if (password === 'password') {
    userStore.set('user');
    return true;
  }
  return false;
};

export const logOut = async () => {
  userStore.set(null);
};

export const authContext: AuthContext = {
  user: userStore,
  logIn,
  logOut
};
