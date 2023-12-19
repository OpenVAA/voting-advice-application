import {authenticate, me} from '$lib/api/candidate';
import {writable, type Writable} from 'svelte/store';

export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  candidate?: Candidate;
}

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  politicalExperience: string;
  email: string;
  nominations: Nomination[];
  locale: string;
  party?: Party;
}

export interface Nomination {
  id: number;
  electionSymbol: string;
  electionRound: number;
  party: Party;
  locale: string;
  constituency?: Constituency;
}

export interface Party {
  name: string;
  shortName: string;
  info: string;
  partyColor: string;
}

export interface Constituency {
  name: string;
  shortName: string;
  type: string;
}

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
  if (user.error) {
    logOut();
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
