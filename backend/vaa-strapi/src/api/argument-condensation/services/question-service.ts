/**
 * Question retrieval service for argument condensation
 */

// Add an interface at the top of the file
export interface CandidateAnswer {
  candidateId: string | number;
  value: string | number;
  openAnswer: Record<string, string> | null;
}

export interface QuestionTypeSettings {
  type: string;
  choices?: Array<{
    id: string;
    label: Record<string, string>;
    normalizableValue: string;
  }>;
  // Add other possible properties here
}

// Add an interface at the top of the file
export interface ArgumentCondensationQuestion {
  id: string | number;
  documentId: string;
  text?: Record<string, string> | any;
  questionType: {
    id: string | number; // Allow both string and number types
    name?: string; // Make name optional
    settings: QuestionTypeSettings;
  };
}

/**
 * Fetches processable Likert questions (single choice ordinal type), filtered by documentIds if provided
 * @param documentIds Optional array of document IDs to filter by
 * @returns All Likert questions if no IDs provided, otherwise only matching questions
 */
async function fetchProcessableQuestions(documentIds?: Array<string>): Promise<Array<ArgumentCondensationQuestion>> {
  const questions = await strapi.documents('api::question.question').findMany({
    fields: ['id', 'documentId', 'text'] as any, // replaces `select: ['id','documentId','text']`
    populate: {
      questionType: {
        fields: ['id', 'name', 'settings']
      }
    }
  });

  // Helper function to validate if the object is a valid QuestionTypeSettings
  const isValidQuestionTypeSettings = (settings: any): settings is QuestionTypeSettings => {
    return settings && typeof settings === 'object' && typeof settings.type === 'string';
  };

  // TODO: Needs to be changed when we have more question types
  const processableQuestions = questions
    .filter((q) => {
      const settings = q.questionType?.settings;
      return isValidQuestionTypeSettings(settings) && settings.type === 'singleChoiceOrdinal';
    })
    .map((q) => {
      // First cast to unknown to satisfy TypeScript
      const settings = q.questionType.settings as unknown;

      return {
        ...q,
        questionType: {
          ...q.questionType,
          settings: settings as QuestionTypeSettings
        }
      } as ArgumentCondensationQuestion;
    });

  console.info('processableQuestions:', processableQuestions);

  return documentIds?.length
    ? processableQuestions.filter((q) => documentIds.includes(q.documentId))
    : processableQuestions;
}

/**
 * Fetches all answers for the specified question IDs from all candidates
 * @param questionDocumentIds Array of question document IDs
 * @param locale Language code to use for open answers (defaults to 'fi')
 */
async function fetchAnswersForQuestions(
  questionDocumentIds: Array<string>,
  locale: string = 'fi'
): Promise<Record<string, Array<CandidateAnswer>>> {
  const candidates = await strapi.documents('api::candidate.candidate').findMany({
    fields: ['id', 'answers'],
    where: {
      answers: {
        $notNull: true
      }
    }
  });

  const answersMap: Record<string, Array<CandidateAnswer>> = Object.fromEntries(
    questionDocumentIds.map((qId) => [qId, []])
  );

  candidates
    .filter((candidate) => typeof candidate.answers === 'object')
    .forEach((candidate) => {
      questionDocumentIds.forEach((qId) => {
        const answer = candidate.answers[qId];
        if (answer) {
          const openAnswerText = answer.info?.[locale];
          // Create the openAnswer object or null
          const openAnswer = openAnswerText ? { [locale]: openAnswerText } : null;

          // Only add answers where openAnswer is not null
          if (openAnswer !== null) {
            answersMap[qId].push({
              candidateId: candidate.id,
              value: answer.value,
              openAnswer
            });
          }
        }
      });
    });

  return answersMap;
}

/**
 * Logs detailed information about retrieved questions
 */
function logQuestionDetails(questions) {
  // Log full details of the first question to inspect structure
  if (questions.length > 0) {
    console.info('FIRST QUESTION DETAILS:');
    console.info(JSON.stringify(questions[0], null, 2));

    // Log all questions with key properties
    console.info('\nALL QUESTIONS:');
    questions.forEach((q, index) => {
      console.info(
        `[${index}] id: ${q.id}, documentId: ${q.documentId}, type: ${q.questionType?.settings?.type || 'unknown'}, text: ${JSON.stringify(q.text).substring(0, 50)}...`
      );
    });
  }
}

/**
 * Test function to verify question retrieval
 */
async function testQuestionRetrieval() {
  try {
    console.info('\n============ TESTING QUESTION RETRIEVAL ============');
    const questions = await fetchProcessableQuestions();
    logQuestionDetails(questions);
    console.info('============ TEST COMPLETE ============\n');
    return questions;
  } catch (error) {
    console.error('Error testing question retrieval:', error);
    throw error;
  }
}

/**
 * Test function to verify answer retrieval for questions
 */
async function testAnswerRetrieval() {
  const questions = await fetchProcessableQuestions();
  if (questions.length === 0) {
    return { success: false, message: 'No questions found to test' };
  }

  try {
    const testQuestionIds = questions.map((q) => q.documentId);
    const answersMap = await fetchAnswersForQuestions(testQuestionIds);
    const totalAnswers = Object.values(answersMap).reduce((sum, answers) => sum + answers.length, 0);

    return {
      success: true,
      message: 'Answer retrieval test completed successfully',
      questionsChecked: testQuestionIds.length,
      totalAnswers,
      answersByQuestion: Object.fromEntries(Object.entries(answersMap).map(([qId, answers]) => [qId, answers.length])),
      sampleAnswers: Object.fromEntries(
        Object.entries(answersMap).map(([qId, answers]) => [
          qId,
          answers[0]
            ? {
                candidateId: answers[0].candidateId,
                value: answers[0].value,
                hasOpenAnswer: !!answers[0].openAnswer
              }
            : null
        ])
      )
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching answers: ${error.message}`,
      error: error.toString()
    };
  }
}

export default {
  fetchProcessableQuestions,
  fetchAnswersForQuestions,
  logQuestionDetails,
  testQuestionRetrieval,
  testAnswerRetrieval
};
