<!--@component

# Contestant app nominations page

Shows the nominations of the entity the user edits, a candidate or an organization, and leads into the nomination editor where they can be edited. Nothing is edited on the page itself.

### The six states

What the page shows is decided on three things: whether the entity has a nomination, whether nominations can be edited, and whether an election admits the entity's type. An entry to the editor is offered where nominations can be edited and an election admits the entity.

- **Nominations, and an entry is offered**: the sentence of the entity's type that says the nominations can be changed, the cards, and a link to the editor under the main button.
- **Nominations, under a lock**: the note, the sentence that says what the list is, and the cards.
- **Nominations, and no election that admits the entity**: that same sentence and the cards.
- **No nomination, and an entry is offered**: the sentence that says a nomination can be defined. The main button leads into the editor.
- **No nomination, under a lock**: the note, and the sentence that says no nomination is defined and whom to ask.
- **No nomination, and no election that admits the entity**: the sentence that says so, and a way to contact support.

The link to the editor is rendered in the first state alone; in every other state the page holds no such link, disabled or not. The page never holds two Contact support buttons: under a lock the note holds the one there is, and the page's body holds one only where no election admits the entity.

### The cards

One card per nomination, in the order they were read. A card is headed by the election's name and lists the constituency, what the nomination stands under when it stands under something, the election symbol when it has one, and whether an administrator has confirmed it. A nomination stored with the name of a party or an alliance its editor typed shows that name on the same row, as text, with a line saying that it was requested and is not in the application yet. An unconfirmed card adds a line saying that voters do not see it yet. A card holds no control. The page is shaded while it lists cards.

### The main button

It leads on to the entity's next task and reads "continue", or back to the entity's home and reads "return" when no task is left. For an entity with no nomination it leads into the editor where an entry is offered, and reads what the home's nomination task reads; where none is offered it returns to the home. It is in its loading form until the tasks of an entity with a nomination are known.

### What the page reads

- The nominations are those the entity-level load read, each with the names it is shown with, so the cards are in the server-rendered markup and the page looks nothing up.
- Whether an entry is offered is read from `nominationFacts` of the page's data: the facts the load of the nominations tree states, on which the editor's guard decides who is let in. The page and the guard therefore agree, and each state is in the server-rendered markup. On a page whose data holds no facts no entry is offered, and an empty view under no lock says nothing in place of the nominations.
- On a page whose data holds no entity the list is not known, and neither a card nor a sentence in place of the nominations is shown.
- Everything that differs between entity types is read from the descriptor of the selected entity's type.

### Settings

- `access.nominationsLocked`: Shows the note with the reason `nominationsLocked`. Read as the context's `nominationsLocked`.
- `access.answersLocked`: Closes the editor as well. While it is on and the nominations lock is not, the note is shown with the reason `nominationsAnswersLocked`. Read as the context's `answersLocked`.

### Accessibility

- Each card is an `<article>` named by its heading, and the cards are the items of a list that states its role, so that it stays a list where its markers are styled away.
- A label and its value are a `<dt>` and `<dd>` pair, the label above the value at every width, and a long value wraps at any character.
- The note precedes the page title in reading order.
- The link to the editor is named by its text and is the tab stop after the main button. Nothing on the page is announced as unavailable.
-->

<script lang="ts">
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { NotEditableNote } from '$contestant/components/notEditableNote';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { typedParentNameOf } from '$lib/contestant/nominations';
  import { nominationsViewTarget } from '$lib/contestant/tasks';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import type { NominationsViewTarget } from '$lib/contestant/tasks';
  import type { EntityDescriptor } from '$lib/contestant/utils/entityDescriptor';
  import type { TranslationKey } from '$types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // nominations, nominationsLocked, answersLocked, taskState and selectedEntity are reactive accessors: read via contestantCtx.X inside the tracking scope, never destructured.
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // What the view shows
  ////////////////////////////////////////////////////////////////////

  /** Which sentence stands in place of the nominations: a nomination can be defined, nominations cannot be edited, or no election admits the entity. */
  type EmptyKind = 'define' | 'locked' | 'noElection';

  /** The descriptor member that holds the sentence of each kind. */
  const EMPTY_SENTENCE = {
    define: 'nominationsEmptyEditable',
    locked: 'nominationsEmpty',
    noElection: 'nominationsEmptyNoElection'
  } as const satisfies Record<EmptyKind, keyof EntityDescriptor>;

  /** The label of the main button, by what it does. Leading into the editor it reads what the home's nomination task reads. */
  const BUTTON_LABEL: Record<NominationsViewTarget['action'], TranslationKey> = {
    continue: 'common.continue',
    return: 'common.return',
    define: 'contestantApp.home.nomination.enter'
  };

  /** Everything that differs by entity type. */
  const descriptor = $derived(entityDescriptorOf(contestantCtx.selectedEntity?.type));
  const nominations = $derived(contestantCtx.nominations);

  /** Whether the view lists nominations or says there are none. `undefined` while the list is not known, which is not an empty list. */
  const viewState = $derived.by((): 'listed' | 'empty' | undefined => {
    if (nominations === undefined) return undefined;
    return nominations.length > 0 ? 'listed' : 'empty';
  });

  /** The reason the note gives: the lock on nominations when it is on, and otherwise the lock on answers. `undefined` while neither lock is on, when no note is shown. */
  const lockReason = $derived.by((): 'nominationsLocked' | 'nominationsAnswersLocked' | undefined => {
    if (contestantCtx.nominationsLocked) return 'nominationsLocked';
    if (contestantCtx.answersLocked) return 'nominationsAnswersLocked';
    return undefined;
  });

  /** The facts the editor's guard decides on. `undefined` on a page whose data holds none. */
  const facts = $derived(data.nominationFacts);

  /** Whether an entry to the editor is offered: nominations can be edited and an election admits the entity. */
  const entryOffered = $derived(!!facts && facts.editable && facts.admissibleElectionIds.length > 0);

  /** Which sentence stands in place of the nominations. `undefined` where the page knows none to be true: no entry is offered, no lock is on, and the facts do not say that nominations can be edited. */
  const emptyKind = $derived.by((): EmptyKind | undefined => {
    if (entryOffered) return 'define';
    if (lockReason) return 'locked';
    return facts?.editable ? 'noElection' : undefined;
  });

  ////////////////////////////////////////////////////////////////////
  // The button
  ////////////////////////////////////////////////////////////////////

  /** Where the main button leads and what it does. `undefined` while the entity's tasks are not known. */
  const target = $derived(nominationsViewTarget(contestantCtx.taskState, { entryOffered }));

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // The shaded background sets the cards off from the page, so the overlay is pushed while cards are listed and reverted with them.
  $effect(() => {
    if (viewState === 'listed') return pageStyles.push({ drawer: { background: 'bg-base-200' } });
  });
</script>

<!-- One row of a card: the label above its value, which wraps at any character. A row given a line shows it under the value. -->
{#snippet row(label: string, value: string | undefined, testId: string, line?: string)}
  <div>
    <dt class="small-info uc-first">{label}</dt>
    <dd class="mt-xs [overflow-wrap:anywhere]" data-testid={testId}>
      {value}
      {#if line}
        <p class="small-info mt-xs" data-testid="nomination-requested-parent">{line}</p>
      {/if}
    </dd>
  </div>
{/snippet}

<MainContent
  title={t('contestantApp.nominations.title')}
  data-testid="contestant-nominations"
  data-nominations-state={viewState}
  data-nominations-locked={lockReason ? 'true' : 'false'}
  data-nominations-editable={entryOffered ? 'true' : 'false'}>
  {#snippet note()}
    {#if lockReason}
      <NotEditableNote reason={lockReason} data-testid="contestant-nominations-locked-note" />
    {/if}
  {/snippet}

  {#if viewState === 'listed' && nominations}
    <p class="text-center">
      {t(entryOffered ? descriptor.nominationsDescriptionEditable : descriptor.nominationsDescription)}
    </p>
    <ul
      class="mt-lg gap-lg flex list-none flex-col self-stretch pl-0"
      role="list"
      data-testid="contestant-nominations-list">
      {#each nominations as nomination (nomination.id)}
        {@const headingId = `nomination-${nomination.id}-heading`}
        {@const typedParentName = typedParentNameOf(nomination)}
        <li>
          <article
            class="bg-base-100 p-lg rounded-lg"
            aria-labelledby={headingId}
            data-testid="contestant-nomination"
            data-confirmed={nomination.confirmed ? 'true' : 'false'}>
            <h2 class="text-lg" id={headingId} data-testid="nomination-election">{nomination.electionName}</h2>
            <dl class="mt-md gap-md flex flex-col">
              {@render row(t('common.constituency'), nomination.constituencyName, 'nomination-constituency')}
              {#if nomination.parent}
                {@render row(
                  t(descriptor.nominationParentLabel),
                  nomination.parent.name || nomination.parent.shortName,
                  'nomination-parent'
                )}
              {:else if typedParentName}
                {@render row(
                  t(descriptor.nominationParentLabel),
                  typedParentName,
                  'nomination-parent',
                  t('contestantApp.nominations.requestedParent')
                )}
              {/if}
              {#if nomination.electionSymbol}
                {@render row(
                  t(descriptor.electionSymbolLabel),
                  nomination.electionSymbol,
                  'nomination-election-symbol'
                )}
              {/if}
              {@render row(
                t('contestantApp.nominations.state.label'),
                nomination.confirmed ? t('common.confirmed') : t('contestantApp.nominations.state.pending'),
                'nomination-state'
              )}
            </dl>
            {#if !nomination.confirmed}
              <p class="small-info mt-md" data-testid="nomination-pending-note">
                {t('contestantApp.nominations.state.pendingInfo')}
              </p>
            {/if}
          </article>
        </li>
      {/each}
    </ul>
  {:else if viewState === 'empty' && emptyKind}
    <p class="text-center" data-testid="contestant-nominations-empty" data-empty={emptyKind}>
      {t(descriptor[EMPTY_SENTENCE[emptyKind]])}
    </p>
    {#if emptyKind === 'noElection'}
      <ContactSupport class="mt-lg" />
    {/if}
  {/if}

  {#snippet primaryActions()}
    {#if target}
      <Button
        variant="main"
        text={t(BUTTON_LABEL[target.action])}
        href={getRoute.current(target.route)}
        data-testid="contestant-nominations-continue"
        data-action={target.action} />
    {:else}
      <Button variant="main" text={t('common.continue')} loading data-testid="contestant-nominations-continue" />
    {/if}
    {#if viewState === 'listed' && entryOffered}
      <Button
        text={t('contestantApp.nominations.edit')}
        icon="create"
        iconPos="left"
        href={getRoute.current('ContestantAppNominationElections')}
        data-testid="contestant-nominations-edit" />
    {/if}
  {/snippet}
</MainContent>
