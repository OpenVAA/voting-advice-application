import {getContext, setContext} from 'svelte';
import {writable, type Writable} from 'svelte/store';

const PAGE_CONTEXT_NAME = 'page-context';

export type PageContext = {
  containerClass: Writable<string>;
};

export function getPageContext(): PageContext {
  return getContext<PageContext>(PAGE_CONTEXT_NAME);
}

export function createPageContext(): PageContext {
  const containerClass = writable('');
  return setContext<PageContext>(PAGE_CONTEXT_NAME, {containerClass});
}
