import {writable} from 'svelte/store';

// Source: https://github.com/sveltejs/kit/discussions/9759#discussioncomment-5715762

type PageStore = {
  params: {lang?: string};
  url: {pathname: string};
};

const mockIsAnonymousWritable = writable<PageStore>({
  params: {lang: 'en'},
  url: {pathname: '/'}
});

export const mockIsPageStore = {
  subscribe: mockIsAnonymousWritable.subscribe,
  set: vi.fn(), // add as much store functions you need here and set them to vi.fn(), so you can call expect() functions on them
  mockSetSubscribeValue: (value: PageStore): void => mockIsAnonymousWritable.set(value),
  mockSetLocale: (lang?: string): void =>
    mockIsAnonymousWritable.update((page) => ({...page, ...{params: {lang}}})),
  mockSetPathname: (pathname: string): void =>
    mockIsAnonymousWritable.update((page) => ({...page, ...{url: {pathname}}}))
};
