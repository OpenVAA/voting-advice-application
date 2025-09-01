import { type Id } from '@openvaa/core';
import { type Actions, fail } from '@sveltejs/kit';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';
import { PipelineController } from '$lib/server/admin/jobs/pipelineController';
import { AUTH_TOKEN_KEY } from '$lib/server/auth';
import { getLLMProvider } from '$lib/server/llm/llmProvider';
import { constants as pub } from '$lib/utils/constants';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Handle form submit from the UI to start question info generation.
 */
export const actions = {
  default: async ({ fetch, request, params: { lang }, cookies }) => {
    try {
      console.info('[question-info] action start');
      const formData = await request.formData();
      const electionId = formData.get('electionId')?.toString();
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());
      console.info('[question-info] parsed form', { electionId, nQuestionIds: questionIds.length });

      if (!electionId) {
        console.warn('[question-info] early exit: missing electionId');
        return fail(400, { type: 'error', error: 'Missing electionId' });
      }

      // Create a job for tracking progress using the SvelteKit fetch function
      const adminEmail = 'admin@example.com'; // TODO: Get from actual admin context

      const jobResponse = await fetch('/api/admin/jobs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'question-info-generation',
          author: adminEmail
        })
      });

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error('[question-info] Job creation failed:', errorText);
        throw new Error('Failed to create job');
      }

      const { jobId } = await jobResponse.json();
      console.info('[question-info] created job:', jobId);

      // DEBUG: Check if the job was created and is in active state
      const jobCheckResponse = await fetch(UNIVERSAL_API_ROUTES.jobProgress(jobId));

      if (jobCheckResponse.ok) {
        const jobData = await jobCheckResponse.json();
        console.info('[question-info] job initial state:', {
          id: jobData.id,
          status: jobData.status,
          progress: jobData.progress,
          feature: jobData.feature
        });
      } else {
        console.error('[question-info] Failed to check job state:', jobCheckResponse.status);
      }

      console.info('[question-info] calling generateQuestionInfo()…');
      const authToken = cookies.get(AUTH_TOKEN_KEY);
      if (!authToken) {
        return fail(401, { type: 'error', error: 'Authentication required' });
      }

      const result = await generateQuestionInfo({
        electionId,
        questionIds,
        fetch,
        locale: lang as string,
        jobId,
        authToken
      });
      console.info('[question-info] generateQuestionInfo() returned', result);

      return result ? { type: 'success' } : fail(500);
    } catch (err) {
      console.error('[question-info] error', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return fail(500, { type: 'error', error: errorMessage });
    }
  }
} satisfies Actions;

/**
 * Create a pipeline of sub-operations based on the questions to be processed.
 * Each question gets equal weight for now, but this could be adjusted based on complexity.
 */
function createQuestionPipeline(questions: Array<AnyQuestionVariant>): Array<{ id: string; weight: number }> {
  const pipeline: Array<{ id: string; weight: number }> = [];

  // Create equal weight operations for each question
  for (const question of questions) {
    pipeline.push({
      id: `question-${question.id}-info-generation`,
      weight: 1
    });
  }

  return pipeline;
}

/**
 * Generate question info for selected or all questions.
 * - Loads elections, constituencies, questions, and nominations
 * - Generates info sections for each question using LLM
 * - Saves the generated info to the database
 * @param args.electionId - Election id to scope questions
 * @param args.questionIds - If empty, runs all questions applicable to the election
 * @param args.fetch - SvelteKit fetch function for data loading
 * @param args.locale - Language for prompts ('en'|'fi' currently supported)
 * @param args.jobId - Job ID for tracking progress
 * @returns DataApiActionResult indicating success/failure
 */
async function generateQuestionInfo({
  electionId,
  questionIds,
  fetch,
  locale,
  jobId,
  authToken
}: {
  electionId: Id;
  questionIds: Array<Id>;
  fetch: {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response>;
  };
  locale: string;
  jobId: string;
  authToken: string;
}): Promise<DataApiActionResult> {
  // Create controller immediately - it will be initialized with pipeline later
  const controller = new PipelineController(jobId);

  try {
    // 1) Load data
    await controller.info('Loading election and question data for question info generation...');
    const dataRoot = await loadElectionData({
      electionId,
      locale,
      fetch
    });
    await controller.info('Data loaded successfully!');

    // 2) Resolve questions: selected or all applicable opinion questions for the election
    const election = dataRoot.getElection(electionId);

    const allOpinionForElection = dataRoot.findQuestions({ type: 'opinion', elections: election });

    const selectedQuestions = questionIds.length
      ? questionIds.map((id) => dataRoot.getQuestion(id))
      : allOpinionForElection;

    console.info('[question-info] selectedQuestions', selectedQuestions);
    await controller.info(`Found ${allOpinionForElection.length} opinion questions for election "${election.name}"`);

    if (!selectedQuestions.length) {
      // Initialize with minimal pipeline for this case
      controller.initializePipeline([{ id: 'no-questions', weight: 1 }]);
      await controller.warning(`No opinion questions to process for election ${electionId}`);
      await controller.complete();
      return { type: 'success' };
    }

    // Create pipeline dynamically based on the questions we'll actually process
    const pipeline = createQuestionPipeline(selectedQuestions);
    controller.initializePipeline(pipeline);

    // 3) LLM setup
    const llm = getLLMProvider();

    // 4) Generate info for each question sequentially
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      await controller.info(`Processing question "${question.name}" (${i + 1}/${selectedQuestions.length})`);

      // Generate info sections for the question
      await generateInfoForQuestion({
        question,
        llm,
        locale,
        controller,
        authToken
      });
    }

    // Results are now saved per question above

    await controller.complete();

    return { type: 'success' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log the error
    await controller.error(`Question info generation failed: ${errorMessage}`);
    await controller.fail(errorMessage);

    throw error;
  }
}

/**
 * Generate info sections for a single question using LLM.
 * @param question - The question to generate info for
 * @param llm - The LLM provider
 * @param locale - The language locale
 * @param controller - Controller for progress tracking
 */
async function generateInfoForQuestion({
  question,
  llm,
  locale,
  controller,
  authToken
}: {
  question: AnyQuestionVariant;
  llm: {
    generate: (options: {
      messages: Array<{ role: 'system'; content: string }>;
      temperature: number;
      model: string;
    }) => Promise<{ content: string }>;
  };
  locale: string;
  controller: PipelineController;
  authToken: string;
}): Promise<void> {
  try {
    // A placeholder prompt for generating question info
    const prompt = `Generate helpful background information for the following question about an election:

Question: ${question.name}
Question Type: ${question.type}
Category: ${question.category?.name || 'Unknown'}

Please generate 2-3 informative sections that would help voters understand the context and importance of this question. Each section should have:
1. A clear title
2. Informative content explaining the background, context, or implications
3. Be written in ${locale === 'fi' ? 'Finnish' : locale === 'sv' ? 'Swedish' : 'English'}

Format your response as a JSON array with this structure:
[
  {
    "title": "Section Title",
    "content": "Section content explaining the background..."
  }
]

Focus on providing factual, balanced information that helps voters make informed decisions.`;

    const messages = [{ role: 'system' as const, content: prompt }];

    await controller.info(`Generating info for question "${question.name}" using LLM...`);

    // Make LLM call
    const llmResponse = await llm.generate({
      messages,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    // Parse the response
    let infoSections;
    try {
      infoSections = JSON.parse(llmResponse.content);
      await controller.info(
        `Successfully generated ${infoSections.length} info sections for question "${question.name}"`
      );
    } catch (parseError) {
      await controller.warning(`Failed to parse LLM response for question "${question.name}": ${parseError}`);
      // Create a fallback info section
      infoSections = [
        {
          title: 'Background Information',
          content: 'Background information could not be generated automatically. Please review and edit manually.'
        }
      ];
    }

    // Save the generated info sections to the question's customData
    try {
      const updateResponse = await fetch(
        `${pub.PUBLIC_SERVER_BACKEND_URL}/openvaa-admin-tools/update-question-custom-data-public`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            questionId: question.id,
            locale,
            questionInfoSections: infoSections
          })
        }
      );

      if (updateResponse.ok) {
        await controller.info(`Successfully saved info sections for question "${question.name}"`);
      } else {
        const errorText = await updateResponse.text();
        await controller.warning(`Failed to save info sections for question "${question.name}": ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await controller.warning(`Error saving info sections for question "${question.name}": ${errorMessage}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await controller.error(`Failed to generate info for question "${question.name}": ${errorMessage}`);
    throw error;
  }
}
