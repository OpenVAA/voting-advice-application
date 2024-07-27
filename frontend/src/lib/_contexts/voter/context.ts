import {error} from '@sveltejs/kit';
import {setContext, getContext, hasContext} from 'svelte';
import {
  DistanceMetric,
  Match,
  MatchingAlgorithm,
  MissingValueDistanceMethod
} from '$voter/vaa-matching';
import {getAppContext, type AppContext} from '../app';
import {derived, get, writable, type Readable, type Writable} from 'svelte/store';
import type {Constituency, Election, Id, Nomination} from '$lib/_vaa-data';
import {AnswerStore} from './answerStore';
import {Voter} from './voter';
import {createDataObjectStore} from './createDataObjectStore';

const VOTER_CONTEXT_KEY = Symbol();

export function getVoterContext(): VoterContext {
  if (!hasContext(VOTER_CONTEXT_KEY))
    error(500, 'getVoterContext() called before initVoterContext()');
  return getContext<VoterContext>(VOTER_CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()` and cannot be called twice.
 * @returns The context object
 */
export function initVoterContext(): VoterContext {
  console.info('[debug] initVoterContext()');
  if (hasContext(VOTER_CONTEXT_KEY)) error(500, 'initVoterContext() called for a second time');
  const appContext = getAppContext();
  const {dataRoot} = appContext;

  const answers = new AnswerStore();

  const electionId = writable<Id | undefined>();
  const election = createDataObjectStore<Election>(electionId, (id) =>
    get(dataRoot).elections?.find((e) => e.id === id)
  );

  const constituencyId = writable<Id | undefined>();
  // TODO: Check whether we should also subscribe to election changes
  const constituency = createDataObjectStore<Constituency>(constituencyId, (id) =>
    get(election)?.constituencies?.find((e) => e.id === id)
  );

  const algorithm = new MatchingAlgorithm({
    distanceMetric: DistanceMetric.Manhattan,
    missingValueOptions: {
      missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    }
  });

  // TODO: Use questions and resultsAvailable
  // TODO: Return en empty list or undefined when candidates are not available?
  const matchedCandidates = derived(
    [answers, dataRoot, constituency],
    ([$answers, $dataRoot, $constituency]) => {
      console.info(
        `[debug] _contexts/voter.ts: matchedCandidates updated with ${Object.keys($answers).length} answers`,
        $dataRoot
      );
      const voter = new Voter($answers);
      return $constituency?.nominations
        ? match(voter, $constituency?.nominations)
        : Promise.resolve([]);
    }
  );

  function match(voter: Voter, nominations: Nomination[]): Promise<Array<Match<Nomination>>> {
    console.info(
      `[debug] _contexts/voter.ts: faking matching algorithm with ${algorithm} and ${Object.entries(
        voter.answers
      )
        .map(([k, v]) => k + ':' + v.value)
        .join(', ')}`
    );
    return Promise.resolve(nominations.map((n) => new Match<Nomination>(Math.random(), n)));
  }

  return setContext<VoterContext>(VOTER_CONTEXT_KEY, {
    answers,
    election,
    electionId,
    constituency,
    constituencyId,
    algorithm,
    matchedCandidates,
    ...appContext
  });
}

export type VoterContext = AppContext & {
  algorithm: MatchingAlgorithm;
  answers: AnswerStore;
  election: Readable<Election | undefined>;
  electionId?: Writable<Id | undefined>;
  constituency: Readable<Constituency | undefined>;
  constituencyId?: Writable<Id | undefined>;
  matchedCandidates: Readable<Promise<Array<Match<Nomination>>>>;
};
