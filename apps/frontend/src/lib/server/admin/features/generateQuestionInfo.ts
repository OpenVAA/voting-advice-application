import { generateQuestionInfo as generateQuestionInfoAPI } from '@openvaa/question-info';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { createAdminWriter } from '$lib/api/adminWriter';
import { createSupabaseJobClient } from '$lib/api/dataProvider';
import { getLLMProvider } from '../../llm/llmProvider';
import { assertValidJobId } from '../jobs/assertValidJobId';
import { createJobRecorder } from '../jobs/jobRecord';
import { PipelineController } from '../jobs/pipelineController';
import type { Id, Serializable } from '@openvaa/core';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOperation, QuestionInfoResult } from '@openvaa/question-info';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { TemporarySetQuestionData } from '$lib/api/base/dataWriter.type';
import type { AdapterSource } from '$lib/api/dataProvider';

/**
 * Generate question info (terms and/or info sections) for selected or all opinion questions.
 * - Loads elections and questions
 * - Calls generateQuestionInfo API
 * - Saves results to question customData
 *
 * @param args.electionId - Election id to scope questions
 * @param args.questionIds - If empty, runs all opinion questions applicable to the election
 * @param args.source - The initiating admin's request context, read ONCE for its verified session and then left behind; the job's own client is built from that session's credential and carries every read and every write the run makes, so the whole run reads and writes as one identity and none of it depends on the request outliving it
 * @param args.locale - Output language
 * @param args.jobId - Job ID for tracking progress
 * @param args.operations - Which operations to perform (Terms, InfoSections, or both)
 * @param args.sectionTopics - Optional custom section topics
 * @param args.customInstructions - Optional custom instructions for LLM
 * @param args.questionContext - Optional context about the election/topic
 * @returns DataApiActionResult indicating success/failure
 */
export async function generateQuestionInfo({
  electionId,
  questionIds,
  source,
  locale,
  jobId,
  operations,
  sectionTopics,
  customInstructions,
  questionContext
}: {
  electionId: Id;
  questionIds: Array<Id>;
  source: { fetch: Fetch; locals: App.Locals };
  locale: string;
  jobId: string;
  operations: Array<QuestionInfoOperation>;
  sectionTopics?: Array<string>;
  customInstructions?: string;
  questionContext?: string;
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
    operations: operations.map(String),
    locale,
    ...(sectionTopics && { sectionTopics }),
    ...(customInstructions && { customInstructions }),
    ...(questionContext && { questionContext })
  };

  let results: Array<QuestionInfoResult> | undefined;

  // The job-record half — the `AdminJobRecord` assembly and the abort/fail branch — lives in `createJobRecorder`, which `condenseArguments` shares. Only the `getOutput` thunk and the two prefixes below differ between the two features; everything else was duplicated verbatim until it moved.
  const jobRecord = createJobRecorder({
    jobId,
    electionId,
    startTime,
    input: inputParams,
    adminWriter,
    controller,
    getOutput: () => (results ? (results as unknown as Array<Serializable>) : null),
    logPrefix: 'generateQuestionInfo',
    failureMessage: 'Question info generation failed'
  });

  try {
    // 1) Load data
    controller.info('Loading election and question data for question info generation...');
    // THE READS MOVE ONTO THE JOB'S CLIENT TOO, and that is a decision rather than a spillover. The parameter documentation above asserts that the whole run reads and writes as one identity; leaving these reads on the request's client would have made that sentence false the moment the writer moved, and would have left half the run exposed to exactly the expiry this change removes from the other half.
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

    if (!selectedQuestions.length) {
      // Initialize with minimal pipeline for this case
      controller.initializePipeline([{ id: 'no-questions', weight: 1 }]);
      controller.warning(`No questions to process for election ${electionId}`);
      controller.complete();
      return { type: 'success' };
    }

    // Create pipeline dynamically based on the questions we'll process
    const pipeline = createQuestionPipeline(selectedQuestions);
    controller.initializePipeline(pipeline);

    // 3) LLM setup
    const llm = getLLMProvider();

    // 4) Build options object
    const options = {
      runId: jobId,
      operations,
      language: locale,
      llmProvider: llm, // Model configured in llmProvider (currently gpt-4o-mini)
      controller,
      ...(sectionTopics && sectionTopics.length > 0 && { sectionTopics }),
      ...(customInstructions && { customInstructions }),
      ...(questionContext && { questionContext })
    };

    // 5) Process all questions in a single API call
    controller.info(`Processing ${selectedQuestions.length} question(s) in parallel...`);

    // Call generateQuestionInfo API once with all questions
    results = await generateQuestionInfoAPI({
      questions: selectedQuestions,
      options
    });

    // 6) Process and save results for each question
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      const result = results[i];

      // Check if result is successful and has data
      if (!result.success || !result.data) {
        controller.warning(`No question info generated for question: ${question.name}`);
        controller.updateOperation(`question-${question.id}`, 1.0);
        continue;
      }

      // Transform result to localized format
      const updateData: { customData: { terms?: Array<unknown>; infoSections?: Array<unknown> } } = {
        customData: {}
      };

      if (result.data.terms && result.data.terms.length > 0) {
        updateData.customData.terms = result.data.terms.map((term) => ({
          triggers: { [locale]: term.triggers },
          title: term.title ? { [locale]: term.title } : undefined,
          content: { [locale]: term.content }
        }));
      }

      if (result.data.infoSections && result.data.infoSections.length > 0) {
        updateData.customData.infoSections = result.data.infoSections.map((section) => ({
          title: { [locale]: section.title },
          content: { [locale]: section.content }
        }));
      }

      // Save to database
      controller.info(`Saving question info for question "${question.name}"`);

      try {
        const saveResult = await adminWriter.updateQuestion({
          id: question.id,
          data: updateData as TemporarySetQuestionData
        });

        if (saveResult.type === 'success') {
          controller.info(`Successfully saved question info for question "${question.name}"`);
        } else {
          controller.warning(
            `Failed to save question info for question "${question.name}": ${JSON.stringify(saveResult)}`
          );
        }
      } catch (error) {
        const message = (error as Error).message ?? JSON.stringify(error);
        controller.warning(`Error saving question info for question "${question.name}": ${message}`);
      }

      // Update pipeline progress
      controller.updateOperation(`question-${question.id}`, 1.0);
    }

    controller.complete();

    // Save job record
    await jobRecord.recordCompletion({ questionsProcessed: results.length });

    return { type: 'success' };
  } catch (error) {
    // Marks the job aborted and records it, or fails the pipeline and records that; the branch itself is shared with `condenseArguments`.
    await jobRecord.recordFailure(error);
    throw error;
  }
}

/**
 * Create a simple pipeline with one operation per question.
 * Each question gets equal weight regardless of operations selected.
 *
 * @param questions - Questions to create pipeline for
 * @returns Pipeline array with one entry per question
 */
function createQuestionPipeline(questions: Array<AnyQuestionVariant>): Array<{ id: string; weight: number }> {
  return questions.map((question) => ({
    id: `question-${question.id}`,
    weight: 1
  }));
}
