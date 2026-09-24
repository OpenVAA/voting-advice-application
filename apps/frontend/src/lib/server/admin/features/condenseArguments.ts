import { handleQuestion } from '@openvaa/argument-condensation';
import { ENTITY_TYPE, QUESTION_TYPE } from '@openvaa/data';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { createAdminWriter } from '$lib/api/adminWriter';
import { createSupabaseJobClient } from '$lib/api/dataProvider';
import { getLLMProvider } from '../../llm/llmProvider';
import { assertValidJobId } from '../jobs/assertValidJobId';
import { createJobRecorder } from '../jobs/jobRecord';
import { PipelineController } from '../jobs/pipelineController';
import type { LocalizedQuestionArguments } from '@openvaa/app-shared';
import type { CondensationRunResult } from '@openvaa/argument-condensation';
import type { Id, Serializable } from '@openvaa/core';
import type { AnyQuestionVariant, SingleChoiceCategoricalQuestion } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { AdapterSource } from '$lib/api/dataProvider';

/**
 * Run argument condensation for selected or all opinion questions.
 * - Loads elections, constituencies, questions, nominations and entities
 * - Builds SupportedQuestion subset (boolean, ordinal, categorical)
 * - Collects nominated entities for the election
 * - Calls handleQuestion for each question sequentially
 * @param args.electionId - Election id to scope questions and nominations
 * @param args.questionIds - If empty, runs all opinion questions applicable to the election
 * @param args.source - The initiating admin's request context, read ONCE for its verified session and then left behind; the job's own client is built from that session's credential and carries every read and every write the run makes, so the whole run reads and writes as one identity and none of it depends on the request outliving it
 * @param args.locale - Language for prompts ('en'|'fi' currently supported)
 * @param args.jobId - Job ID for tracking progress
 * @returns DataApiActionResult indicating success/failure
 */
export async function condenseArguments({
  electionId,
  questionIds,
  source,
  locale,
  jobId
}: {
  electionId: Id;
  questionIds: Array<Id>;
  source: { fetch: Fetch; locals: App.Locals };
  locale: string;
  jobId: string;
}): Promise<DataApiActionResult> {
  // THE IDENTIFIER GUARD, AND IT IS FIRST — ahead of the pipeline controller, ahead of the job recorder, and ahead of the writer construction below, so an invalid start does no credential work and makes no outbound call. Order is the property here: the same rejection placed after the writer would let exactly the same work happen and only change what is reported afterwards. This line owns whether the identifier the job was handed is usable at all; the writer construction under it owns where that writer's credentials come from — two edits, one under the other, neither inside the other.
  assertValidJobId(jobId);

  // THIS JOB'S OWN CREDENTIAL, RESOLVED ONCE AND FIXED FOR THE WHOLE RUN — after the guard above and ahead of everything else, so an invalid start still does no credential work. `locals.safeGetSession` is this application's ONE verification path: it calls `getSession()` and then the `getUser()` round-trip that checks the token against Supabase Auth, and hands back nothing when that fails. Reading a jar or a header here instead would be a second verification path and a second thing to get wrong. Nothing below resolves it again — resolving mid-run would put the job back on the request's clock under a different name, which is the coupling this removes.
  const { session } = await source.locals.safeGetSession();

  // The job's own source, and it names a CLIENT rather than the request's `locals`. `createSupabaseJobClient` raises if the lookup above found no session, so a job that nobody authorised does not proceed anonymously. The transport is the plain global `fetch` rather than `source.fetch`: the request's `fetch` is scoped to a response this job outlives, and the point of the whole change is that nothing the job does depends on that response still being there.
  const jobSource: AdapterSource = {
    fetch: globalThis.fetch,
    client: createSupabaseJobClient({ accessToken: session?.access_token })
  };

  // Create controller immediately - it will be initialized with pipeline later
  const controller = new PipelineController(jobId);

  // This job's own writer, over this job's own credential, constructed here and held for the whole run — so neither a second admin's job nor the initiating request's own lifetime can reach it.
  //
  // reason: the writer used to be built from the initiating request's client, which carries an adapter onto that request's jar, while the action awaits this call for the job's whole multi-minute duration. Two failure modes followed from that, and BOTH ARE NOW CLOSED by the client above rather than by care taken here — they stay named because a reader arriving after the next incident needs to know what was considered, not only what was chosen:
  //   1. A refreshed session emitted as a `Set-Cookie` on a response that is only generated when the job finishes reaches nobody once the platform gateway has timed the connection out (Render's default is 100s; these jobs run for minutes), and the initiating admin's session silently regresses to the tokens it held before. CLOSED: the job's client renews nothing on its own and has no adapter to write through, so no such emission is ever attempted.
  //   2. Once the response HAS been generated, `@sveltejs/kit` replaces `event.cookies.set` with a thrower ("Cannot use 'cookies.set(...)' after the response has been generated"), so any path outliving its response — a late `insertJobResult` on an aborted job, or a future move to fire-and-forget — raised inside the Supabase client's own renewal rather than at an obvious call site. CLOSED: there is no such path left for it to raise on.
  // What this does NOT settle is what a job should do when the initiating admin's session expires partway through the run: the crash mode is gone, the authority question is open.
  const adminWriter = createAdminWriter(jobSource);

  // Track start time and input parameters for job record
  const startTime = new Date().toISOString();
  const inputParams = {
    electionId,
    questionIds,
    locale
  };

  // Accumulate all condensation results across all questions
  const allCondensationResults: Array<{
    questionId: string;
    questionName: string;
    results: Array<CondensationRunResult>;
  }> = [];

  // The job-record half — the `AdminJobRecord` assembly and the abort/fail branch — lives in `createJobRecorder`, which `generateQuestionInfo` shares. Only the `output` thunk and the two prefixes below differ between the two features; everything else was duplicated verbatim until it moved.
  const jobRecord = createJobRecorder({
    jobId,
    electionId,
    startTime,
    input: inputParams,
    adminWriter,
    controller,
    getOutput: () =>
      allCondensationResults.length > 0 ? (allCondensationResults as unknown as Array<Serializable>) : null,
    logPrefix: 'condenseArguments',
    failureMessage: 'Argument condensation failed'
  });

  try {
    // 1) Load data
    controller.info('Loading election and question data for argument condensation...');
    // THE READS MOVE ONTO THE JOB'S CLIENT TOO, and that is a decision rather than a spillover. The parameter documentation above asserts that the whole run reads and writes as one identity; leaving these four reads on the request's client would have made that sentence false the moment the writer moved, and would have left half the run exposed to exactly the expiry this change removes from the other half.
    const dataRoot = await loadElectionData({
      electionId,
      locale,
      source: jobSource
    });
    controller.info('Data loaded successfully!');

    // 2) Resolve questions: selected or all applicable opinion questions for the election
    const election = dataRoot.getElection(electionId);
    const selectedQuestions = questionIds.length
      ? questionIds.map((id) => dataRoot.getQuestion(id))
      : dataRoot.findQuestions({ type: 'opinion', elections: election });
    controller.info(
      `Resolved ${selectedQuestions.length} question(s): ${selectedQuestions.map((q) => q.name).join(', ')}`
    );
    const supportedQuestions = selectedQuestions.filter(
      (q) =>
        q.type === QUESTION_TYPE.Boolean ||
        q.type === QUESTION_TYPE.SingleChoiceOrdinal ||
        q.type === QUESTION_TYPE.SingleChoiceCategorical
    );
    controller.info(
      `${supportedQuestions.length} of those are of a supported type: ${supportedQuestions.map((q) => q.name).join(', ')}`
    );

    if (!supportedQuestions.length) {
      // Initialize with minimal pipeline for this case
      controller.initializePipeline([{ id: 'no-questions', weight: 1 }]);
      controller.warning(`No supported questions to process for election ${electionId}`);
      controller.complete();
      return { type: 'success' };
    }

    // Create pipeline dynamically based on the questions we'll actually process
    const pipeline = createQuestionPipeline(supportedQuestions);
    controller.initializePipeline(pipeline);

    // 3) Collect nominated entities (HasAnswers) for the election
    const entities = Object.values(ENTITY_TYPE).flatMap((t) =>
      dataRoot.findNominations({
        entityType: t,
        electionId: election.id,
        electionRound: election.round
      })
    );

    if (entities.length === 0) {
      controller.warning(`No nominated entities found to process for election ${electionId}`);
      controller.complete();
      return { type: 'success' };
    }

    // 4) LLM setup
    const llm = getLLMProvider();

    // 5) Run condensation sequentially per question
    for (let i = 0; i < supportedQuestions.length; i++) {
      const question = supportedQuestions[i];
      const runId = `admin-${electionId}-${question.id}-${Date.now()}`;
      controller.info(`Processing question "${question.name}" (${i + 1}/${supportedQuestions.length})`);

      const condensationResults = await handleQuestion({
        question,
        entities,
        options: {
          llmProvider: llm, // Model configured in llmProvider (currently gpt-4o-mini)
          language: locale,
          runId,
          maxCommentsPerGroup: 1000,
          createVisualizationData: false, // disable FS writes in server env for now
          controller
        }
      });

      // Store results for this question
      allCondensationResults.push({
        questionId: question.id,
        questionName: question.name,
        results: condensationResults
      });

      if (!condensationResults.length || condensationResults.every((r) => !r.data.arguments.length)) {
        controller.warning(`No arguments found for question: ${question.name}`);
        continue;
      }

      const condensedArguments: Array<LocalizedQuestionArguments> = condensationResults.map(
        ({ condensationType, data }) => ({
          type: condensationType,
          arguments: data.arguments.map(({ id, text }) => ({
            id,
            content: { [locale]: text }
          }))
        })
      );

      // Save the condensation results to the question's customData
      controller.info(`Saving condensation results for question "${question.name}"`);

      try {
        const result = await adminWriter.updateQuestion({
          id: question.id,
          data: {
            customData: {
              arguments: condensedArguments
            }
          }
        });

        if (result.type === 'success') {
          controller.info(`Successfully saved condensation results for question "${question.name}"`);
        } else {
          controller.warning(
            `Failed to save condensation results for question "${question.name}": ${JSON.stringify(result)}`
          );
        }
      } catch (error) {
        const message = (error as Error).message ?? JSON.stringify(error);
        controller.warning(`Error saving condensation results for question "${question.name}": ${message}`);
      }
    }

    controller.complete();

    // Save job record
    await jobRecord.recordCompletion({ questionsProcessed: allCondensationResults.length });

    return { type: 'success' };
  } catch (error) {
    // Marks the job aborted and records it, or fails the pipeline and records that; the branch itself is shared with `generateQuestionInfo`.
    await jobRecord.recordFailure(error);
    throw error;
  }
}

/**
 * Create a pipeline of sub-operations based on the questions to be processed.
 * Each question type creates different sub-operations:
 * - Boolean: pros, cons
 * - Ordinal: pros, cons
 * - Categorical: pros for each category
 */
function createQuestionPipeline(questions: Array<AnyQuestionVariant>): Array<{ id: string; weight: number }> {
  const pipeline: Array<{ id: string; weight: number }> = [];

  // Create equal weight operations for each question, even though the number of llmCalls and their average latency will vary
  for (const question of questions) {
    switch (question.type) {
      case QUESTION_TYPE.Boolean:
        pipeline.push(
          { id: `question-${question.id}-boolean-pros`, weight: 1 },
          { id: `question-${question.id}-boolean-cons`, weight: 1 }
        );
        break;

      case QUESTION_TYPE.SingleChoiceOrdinal:
        pipeline.push(
          { id: `question-${question.id}-ordinal-pros`, weight: 1 },
          { id: `question-${question.id}-ordinal-cons`, weight: 1 }
        );
        break;

      case QUESTION_TYPE.SingleChoiceCategorical: {
        // For categorical questions, create a pros operation for each choice/category
        const categoricalQuestion = question as SingleChoiceCategoricalQuestion;
        for (const choice of categoricalQuestion.choices) {
          pipeline.push({
            id: `question-${question.id}-categorical-${choice.id}-pros`,
            weight: 1
          });
        }
        break;
      }

      default:
        // Unknown question type, create a generic operation
        pipeline.push({ id: `question-${question.id}-generic`, weight: 1 });
    }
  }

  return pipeline;
}
