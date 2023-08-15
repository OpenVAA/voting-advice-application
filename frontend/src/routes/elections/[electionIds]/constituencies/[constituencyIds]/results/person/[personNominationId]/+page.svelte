<script lang="ts">
  import {
    availableMatchableQuestions,
    availableNonMatchableQuestions,
    currentPersonNomination
  } from '$lib/stores/stores';
  import {ucFirst} from '$lib/utils/strings';
  import {TemplateQuestion, type Person, type Question, PersonNomination} from '$lib/vaa-data';

  // TO DO: Now we expect the person to be a nomination,
  // allow a raw Person as well
  const person = currentPersonNomination;

  /**
   * Display the Person's answer nicely depending on Question type.
   * @param question The Question object
   * @param person The Person object
   */
  function displayAnswer(question: Question, person: Person | PersonNomination) {
    const answer = person.getAnswer(question);
    if (answer == null || answer.value === '') {
      return '<em>no answer</em>';
    }
    let info = answer.info ? ` (”${answer.info}”)` : '';
    if (question instanceof TemplateQuestion && typeof answer === 'number') {
      return question.getValueLabel(answer) + info;
    }
    return answer.value + info;
  }
</script>

{#if $person}
  <h2 class="my-4 font-bold">{$person.name} (a.k.a. {$person.shortName} or {$person.initials})</h2>

  {#if $person.electionSymbol != ''}
    <p>Symbol: {$person.electionSymbol}</p>
  {/if}

  {#if $person.organizationNominations.length}
    <!-- TO DO: Move this logic to a reusable function or Component. -->
    <p>
      Listed by:
      {$person.organizationNominations
        .map((n) => n.shortName + (n.type ? ` (${ucFirst(n.type)})` : ''))
        .join(', ')}
    </p>
    {#if $person.isIndependent}
      <em>Independent candidate</em>
    {:else if $person.memberOfNominatingOrganization}
      <em
        >Member of the same {$person.organizationNominations[0].type
          ? $person.organizationNominations[0].type
          : 'party'}</em>
    {:else}
      <em>But member of {$person.organization?.shortName} ({$person.organization?.name})</em>
    {/if}
  {:else}
    <p>Not listed by an organization, huh?</p>
  {/if}

  <h3 class="my-4 font-bold">Basic Info</h3>

  <!-- We use groupedBy here to separate the questions into categories.
       We cannot just iterate over $availableNonMatchableQuestionCategories
       because their questions lists contain also those Questions that
       are not available in this Constituency. We could, of course, just
       use filter on the questions list, thought... -->
  {#each $availableNonMatchableQuestions.groupedBy('parent') as [cat, questions]}
    <h4 class="my-4">Category: {cat.name}</h4>
    {#each questions as qst}
      <div>{qst.text}: {@html displayAnswer(qst, $person)}</div>
    {/each}
  {/each}

  <h3 class="my-4 font-bold">Opinions</h3>

  {#each $availableMatchableQuestions.groupedBy('parent') as [cat, questions]}
    <h4 class="my-4">Category: {cat.name}</h4>
    {#each questions as qst}
      <div>{qst.text}: {@html displayAnswer(qst, $person)}</div>
    {/each}
  {/each}
{:else}
  <!-- TO DO: <Loading /> -->
  <h1>Loading...</h1>
{/if}
