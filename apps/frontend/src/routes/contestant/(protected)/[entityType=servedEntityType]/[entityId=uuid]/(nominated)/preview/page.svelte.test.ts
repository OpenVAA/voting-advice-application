/**
 * The preview page of an entity of the Contestant App, mounted for real against a fake contestant context and a real data root, with the real `SingleCardContent`, `Loading`, `ErrorMessage` and `EntityTag` below it. The entity's details are a stand-in that records the props it is given.
 *
 * What this file holds:
 *
 * 1. **The three views.** The loading view until the entity's data is loaded, the not-found sentence when it cannot be loaded, and the card otherwise. The line that shows how the entity is marked beside its candidates is rendered with the card alone.
 * 2. **What differs by entity type.** An organization's card begins with that line, its details are given the tabs to leave out and the note is the organization's; a candidate's card has no such line, leaves no tab out and keeps the candidate's note.
 * 3. **The colour.** The entity's data reaches the data root with a colour that is adjusted for contrast, or with none.
 *
 * The fake context's members are reactive behind getters over one raw state box, as the real accessors are. A message is its key.
 */

import { DataRoot } from '@openvaa/data';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnyEntityVariant } from '@openvaa/data';
import type { LocalizedEntityData, UserEntity } from '$lib/api/base/dataWriter.type';

/** Everything the page reads from the contestant context. */
type Box = {
  selectedEntity: UserEntity | undefined;
  /** The entity as the store holds it, once the layout has loaded it. */
  savedEntityData: { type: string; id: string } | undefined;
};

const EMPTY_BOX: Box = { selectedEntity: undefined, savedEntityData: undefined };

let box = $state.raw<Box>(EMPTY_BOX);
let dataRoot = new DataRoot();

/** The store's reload of the entity's data. Each case decides what it answers. */
const reloadEntityData = vi.fn<() => Promise<LocalizedEntityData>>();

/** The props each mount of the stand-in for the entity's details was given. */
const detailsProps: Array<{ entity: AnyEntityVariant; excludeTabs: unknown }> = [];

const DETAILS = 'entity-details-stand-in';

/** A stand-in for `EntityDetails`: it records its props and leaves one element where the details would be. */
function EntityDetailsStandIn(anchor: Node, props: { entity: AnyEntityVariant; excludeTabs?: unknown }): void {
  detailsProps.push({ entity: props.entity, excludeTabs: props.excludeTabs });
  const element = document.createElement('article');
  element.setAttribute('data-testid', DETAILS);
  anchor.parentNode?.insertBefore(element, anchor);
}

const context = {
  t: (key: string) => key,
  getRoute: { current: (route: string) => `/route/${route}` },
  userData: {
    get savedEntityData() {
      return box.savedEntityData;
    },
    reloadEntityData
  },
  get locale() {
    return 'en';
  },
  get dataRoot() {
    return dataRoot;
  },
  get selectedEntity() {
    return box.selectedEntity;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined },
    topBarSettings: { use: () => undefined }
  })
}));
vi.mock('$lib/dynamic-components/entityDetails', () => ({ EntityDetails: EntityDetailsStandIn }));
vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  goto: async () => undefined
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the `$layouts/main` barrel loads the header. The stub answers "no preference".
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}

const Page = (await import('./+page.svelte')).default;

const CONTAINER = '[data-testid="contestant-preview-container"]';
const TAG_LINE = '[data-testid="contestant-preview-tag"]';
const LOADING = '[data-testid="loading-indicator"]';
const NOTE = '[role="note"]';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

/** A colour with too little contrast on either theme's background as it is stored. */
const PALE_YELLOW = '#ffe600';
const HEX_COLOR = /^#[0-9a-f]{6}$/;

/** An organization as the list of the user's entities, the store and the reload hold it. */
const PARTY = {
  selectedEntity: { type: 'organization', id: ENTITY_ID, name: 'Esimerkkipuolue', confirmed: true },
  savedEntityData: { type: 'organization', id: ENTITY_ID },
  reloaded: { type: 'organization', id: ENTITY_ID, name: 'Esimerkkipuolue', shortName: 'ESIM', answers: {} }
} satisfies Box & { reloaded: LocalizedEntityData };

/** A candidate, likewise. */
const CANDIDATE = {
  selectedEntity: { type: 'candidate', id: ENTITY_ID, firstName: 'Ada', lastName: 'Alpha', confirmed: false },
  savedEntityData: { type: 'candidate', id: ENTITY_ID },
  reloaded: { type: 'candidate', id: ENTITY_ID, firstName: 'Ada', lastName: 'Alpha', answers: {} }
} satisfies Box & { reloaded: LocalizedEntityData };

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box = EMPTY_BOX;
  dataRoot = new DataRoot();
  reloadEntityData.mockReset();
  detailsProps.length = 0;
  vi.restoreAllMocks();
});

/** Mount the page for a state of the context. */
function render(state: Box): HTMLElement {
  box = state;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Page, { target });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page for an entity whose reload answers with `reloaded`, and wait until the page has handled the answer. */
async function renderLoaded({
  selectedEntity,
  savedEntityData,
  reloaded
}: Box & { reloaded: LocalizedEntityData }): Promise<HTMLElement> {
  reloadEntityData.mockResolvedValue(reloaded);
  const target = render({ selectedEntity, savedEntityData });
  await vi.waitFor(() => expect(target.querySelector(LOADING)).toBeNull());
  flushSync();
  return target;
}

/** The entity data the page handed to the data root. */
function providedTo(provide: ReturnType<typeof vi.spyOn>): { color?: { normal?: string; dark?: string } | null } {
  expect(provide).toHaveBeenCalledTimes(1);
  return (provide.mock.calls[0][0] as Array<{ color?: { normal?: string; dark?: string } | null }>)[0];
}

describe('the contestant preview page — the three views', () => {
  it("shows the loading view and no tag line until the entity's data is loaded", () => {
    reloadEntityData.mockReturnValue(new Promise(() => undefined));

    const target = render({ selectedEntity: PARTY.selectedEntity, savedEntityData: PARTY.savedEntityData });

    expect(target.querySelector(`${CONTAINER} ${LOADING}`)).not.toBeNull();
    expect(target.querySelector(TAG_LINE)).toBeNull();
    expect(detailsProps).toHaveLength(0);
  });

  it("shows the not-found sentence and no tag line when the entity's data cannot be loaded", async () => {
    reloadEntityData.mockRejectedValue(new Error('the reload failed'));

    const target = render({ selectedEntity: PARTY.selectedEntity, savedEntityData: PARTY.savedEntityData });
    await vi.waitFor(() => expect(target.querySelector(LOADING)).toBeNull());

    expect(target.querySelector(CONTAINER)?.textContent).toContain('contestantApp.preview.notFound');
    expect(target.querySelector(TAG_LINE)).toBeNull();
    expect(detailsProps).toHaveLength(0);
  });
});

describe('the contestant preview page — an organization', () => {
  it('begins the card with the line that shows how the party is marked, above its details', async () => {
    const target = await renderLoaded(PARTY);

    const tagLine = target.querySelector(TAG_LINE);
    expect(tagLine, 'the tag line should be rendered').not.toBeNull();
    expect(tagLine!.textContent).toContain('contestantApp.preview.tagLabel');
    expect(tagLine!.textContent).toContain(PARTY.reloaded.shortName);
    const container = target.querySelector(CONTAINER)!;
    expect(container.firstElementChild).toBe(tagLine);
    expect(tagLine!.nextElementSibling?.getAttribute('data-testid')).toBe(DETAILS);
  });

  it('gives the details the loaded entity and leaves the children tab out', async () => {
    await renderLoaded(PARTY);

    expect(detailsProps).toHaveLength(1);
    expect(detailsProps[0].entity).toBe(dataRoot.getEntity('organization', ENTITY_ID));
    expect(detailsProps[0].excludeTabs).toEqual(['children']);
  });

  it("shows the organization's note", async () => {
    const target = await renderLoaded(PARTY);

    expect(target.querySelector(NOTE)?.textContent).toContain('contestantApp.preview.tip.organization');
  });
});

describe('the contestant preview page — a candidate', () => {
  it('shows the card with no tag line', async () => {
    const target = await renderLoaded(CANDIDATE);

    expect(target.querySelector(TAG_LINE)).toBeNull();
    expect(target.querySelector(CONTAINER)?.firstElementChild?.getAttribute('data-testid')).toBe(DETAILS);
  });

  it('gives the details the loaded entity and leaves no tab out', async () => {
    await renderLoaded(CANDIDATE);

    expect(detailsProps).toHaveLength(1);
    expect(detailsProps[0].entity).toBe(dataRoot.getEntity('candidate', ENTITY_ID));
    expect(detailsProps[0].excludeTabs).toEqual([]);
  });

  it("shows the candidate's note", async () => {
    const target = await renderLoaded(CANDIDATE);

    expect(target.querySelector(NOTE)?.textContent).toContain('contestantApp.preview.tip.candidate');
  });
});

describe('the contestant preview page — the colour the data root is given', () => {
  it('is adjusted for contrast, with a dark colour beside it, for a stored colour of too little contrast', async () => {
    const provide = vi.spyOn(dataRoot, 'provideEntityData');

    await renderLoaded({ ...PARTY, reloaded: { ...PARTY.reloaded, color: { normal: PALE_YELLOW } } });

    const { color } = providedTo(provide);
    expect(color?.normal).toMatch(HEX_COLOR);
    expect(color?.normal).not.toBe(PALE_YELLOW);
    expect(color?.dark).toMatch(HEX_COLOR);
    expect(dataRoot.getEntity('organization', ENTITY_ID).color).toEqual(color);
  });

  it('is absent for an entity with no colour', async () => {
    const provide = vi.spyOn(dataRoot, 'provideEntityData');

    await renderLoaded(PARTY);

    expect(providedTo(provide).color ?? null).toBeNull();
    expect(dataRoot.getEntity('organization', ENTITY_ID).color).toBeNull();
  });
});
