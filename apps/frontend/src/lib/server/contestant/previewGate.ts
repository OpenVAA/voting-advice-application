/**
 * Whether an entity's preview is open, answered on the server (server-side).
 *
 * The answer is computed from rows the server read in the request it answers: the entity with its saved answers and nominations and the question data of its elections, which the caller read, and the election and constituency data, which this module reads through the request's own provider. Nothing a browser sent is trusted: the module is handed no count, no flag and no list that a request's URL or body carried.
 *
 * The rule is defined elsewhere and only called here. `hasNomination` and `previewOpenOf` of `$lib/contestant/tasks` say when a preview is open; `requiredInfoQuestionsOf` and `unansweredQuestionsOf` of the same module say which questions an entity must answer and which it has not; `rollUpQuestionCategories` of `$lib/contexts/utils/questionRollup` says which categories and questions an entity is asked. The Contestant App's context calls the same five in the browser, so the home's preview entry and this answer follow one rule.
 *
 * The module keeps nothing between calls. A data root holds every object it was given, so one bound outside a call would answer the next request from this request's rows: the data root, the rolled-up lists and every value derived from an entity are locals of the call that built them, and the module's top level holds imports, types and function declarations alone.
 *
 * Tested in `previewGate.test.ts`.
 */

import { log } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { hasNomination, previewOpenOf, requiredInfoQuestionsOf, unansweredQuestionsOf } from '$lib/contestant/tasks';
import { rollUpQuestionCategories } from '$lib/contexts/utils/questionRollup';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type { SavedAnswers } from '$lib/contestant/tasks';

/** The two reads the answer needs beyond what its caller holds. A data provider satisfies it. */
export type PreviewGateReader = {
  getElectionData(options: { locale: string }): Promise<DPDataType['elections']>;
  getConstituencyData(options: { locale: string }): Promise<DPDataType['constituencies']>;
};

/** The part of an entity's user data the answer reads: the entity's type and saved answers, and where it is nominated. */
export type PreviewGateEntity = {
  readonly entity: { readonly type: EntityType; readonly answers?: SavedAnswers | null };
  readonly nominations: ReadonlyArray<{ readonly electionId: Id; readonly constituencyId: Id }> | null | undefined;
};

/** What `isPreviewOpen` is handed. */
export type PreviewGateInput = {
  /** A reader of election and constituency data that this request alone holds. */
  dataProvider: PreviewGateReader;
  /** The locale of the request, in which the two reads are made. */
  locale: string;
  /** The entity as the server read it in this request. */
  userData: PreviewGateEntity;
  /** The question data of the entity's elections as the server read it in this request, or the error of a failed read. */
  questionData: unknown;
};

/**
 * Whether the entity's preview is open: the entity has a nomination, no required info question it is asked is unanswered and no opinion question it is asked is unanswered.
 *
 * An entity with no nomination is answered at once, and nothing is read for it. For any other the election and the constituency data are read, a data root is built from them and the question data, the elections and constituencies of the entity's nominations are resolved on it, and the questions the entity is asked are rolled up for its type.
 *
 * @param input - The request's reader and locale, and the entity and question data read in the request.
 * @returns `true` for an open preview and `false` for a closed one; `undefined` when no answer can be given, because the question data is not usable, a read failed, or a nomination names an election or a constituency the data does not hold. That case is logged once.
 */
export async function isPreviewOpen({
  dataProvider,
  locale,
  userData,
  questionData
}: PreviewGateInput): Promise<boolean | undefined> {
  const { entity, nominations } = userData;
  if (!nominations || !hasNomination(nominations)) return false;

  if (!isQuestionData(questionData)) {
    log.error("[previewGate] No usable question data to decide an entity's preview from", { err: questionData });
    return undefined;
  }

  try {
    const [electionData, constituencyData] = await Promise.all([
      dataProvider.getElectionData({ locale }),
      dataProvider.getConstituencyData({ locale })
    ]);

    const dataRoot = new DataRoot();
    dataRoot.provideElectionData(electionData);
    dataRoot.provideConstituencyData(constituencyData);
    dataRoot.provideQuestionData(questionData);

    const { infoQuestions, opinionQuestions } = rollUpQuestionCategories({
      dataRoot,
      elections: removeDuplicates(nominations.map((nomination) => dataRoot.getElection(nomination.electionId))),
      constituencies: removeDuplicates(
        nominations.map((nomination) => dataRoot.getConstituency(nomination.constituencyId))
      ),
      entityType: entity.type
    });

    return previewOpenOf({
      hasNomination: true,
      unansweredRequiredInfoCount: unansweredQuestionsOf(requiredInfoQuestionsOf(infoQuestions), entity.answers).length,
      unansweredOpinionCount: unansweredQuestionsOf(opinionQuestions, entity.answers).length
    });
  } catch (e) {
    log.error(`[previewGate] Could not decide an entity's preview: ${e instanceof Error ? e.message : '-'}`, {
      err: e
    });
    return undefined;
  }
}

/** Whether a value is question data as a data root takes it, and not the error of a failed read or anything else. */
function isQuestionData(value: unknown): value is DPDataType['questions'] {
  if (!value || typeof value !== 'object' || value instanceof Error) return false;
  const { categories, questions } = value as { categories?: unknown; questions?: unknown };
  return Array.isArray(categories) && Array.isArray(questions);
}
