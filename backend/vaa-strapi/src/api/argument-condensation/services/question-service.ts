/**
 * Question retrieval service for argument condensation
 */

// Add an interface at the top of the file
interface CandidateAnswer {
  candidateId: string;
  value: any; // Using 'any' since values could be strings, numbers, booleans, etc.
  openAnswer: { fi: string } | null;
}

/**
 * Fetches all questions that can be processed for argument condensation
 */
async function fetchProcessableQuestions() {
  const qs = await strapi.db.query('api::question.question').findMany({
    select: ['id', 'documentId', 'text'],
    populate: ['questionType']
  });

  return qs.filter((q) => q.questionType?.name?.startsWith('Likert-'));
}

/**
 * Fetches all answers for the specified question IDs from all candidates
 */
async function fetchAnswersForQuestions(questionDocumentIds) {
  console.log(`Fetching answers for question document IDs: ${questionDocumentIds.join(', ')}`);

  try {
    // Fetch only the necessary data from candidates
    const candidates = await strapi.db.query('api::candidate.candidate').findMany({
      select: ['id', 'answers']
    });

    console.log(`Found ${candidates.length} candidates with potential answer data`);

    // Initialize a structure to hold answers for each question
    const answersMap: Record<string, CandidateAnswer[]> = {};
    questionDocumentIds.forEach((qId) => {
      answersMap[qId] = [];
    });

    // Process each candidate only once
    for (const candidate of candidates) {
      // Skip if no answers object
      if (!candidate.answers) {
        continue;
      }

      // For each requested question document ID
      for (const questionDocId of questionDocumentIds) {
        // If this candidate has an answer for this question
        if (candidate.answers[questionDocId]) {
          const answer = candidate.answers[questionDocId];

          // Prepare a simplified answer object
          const normalizedAnswer = {
            candidateId: candidate.id,
            value: answer.value,
            // Only include Finnish text if available
            openAnswer: answer.info && answer.info.fi ? { fi: answer.info.fi } : null
          };

          // Add to the answers for this question
          answersMap[questionDocId].push(normalizedAnswer);
        }
      }
    }

    // Log some stats about found answers
    let totalAnswersFound = 0;
    for (const qId of questionDocumentIds) {
      const count = answersMap[qId].length;
      totalAnswersFound += count;
      console.log(`Found ${count} answers for question ${qId}`);
    }
    console.log(`Total answers found: ${totalAnswersFound}`);

    return answersMap;
  } catch (error) {
    console.error('Error in fetchAnswersForQuestions:', error);
    throw error;
  }
}

/**
 * Logs detailed information about retrieved questions
 */
function logQuestionDetails(questions) {
  // Log full details of the first question to inspect structure
  if (questions.length > 0) {
    console.log('FIRST QUESTION DETAILS:');
    console.log(JSON.stringify(questions[0], null, 2));

    // Log all questions with key properties
    console.log('\nALL QUESTIONS:');
    questions.forEach((q, index) => {
      console.log(
        `[${index}] id: ${q.id}, documentId: ${q.documentId}, type: ${q.questionType?.name || 'unknown'}, text: ${JSON.stringify(q.text).substring(0, 50)}...`
      );
    });
  }
}

/**
 * Test function to verify question retrieval
 */
async function testQuestionRetrieval() {
  try {
    console.log('\n============ TESTING QUESTION RETRIEVAL ============');
    const questions = await fetchProcessableQuestions();
    logQuestionDetails(questions);
    console.log('============ TEST COMPLETE ============\n');
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
  try {
    console.log('\n============ TESTING ANSWER RETRIEVAL ============');

    // First get some questions to test with
    const questions = await fetchProcessableQuestions();
    if (questions.length === 0) {
      console.log('No questions found to test answer retrieval');
      return { success: false, message: 'No questions found to test' };
    }

    // Use the first 3 questions (or all if fewer than 3)
    const testQuestionIds = questions.slice(0, 3).map((q) => q.documentId);
    console.log(`Testing answer retrieval for ${testQuestionIds.length} questions:`, testQuestionIds);

    // Fetch answers for these questions
    try {
      const answersMap = await fetchAnswersForQuestions(testQuestionIds);

      // Log the results
      console.log('Answer retrieval results:');
      for (const [questionId, answers] of Object.entries(answersMap)) {
        console.log(`- Question document ID: ${questionId}`);
        console.log(`  Answers found: ${answers.length}`);

        // Log first answer example if available
        if (answers.length > 0) {
          console.log('  First answer example:');
          console.log(`    Candidate ID: ${answers[0].candidateId}`);
          console.log(`    Value: ${JSON.stringify(answers[0].value)}`);
          console.log(`    Open answer: ${answers[0].openAnswer?.fi || 'None'}`);
        }
      }

      // Return results
      const totalAnswers = Object.values(answersMap).reduce((sum, answers) => sum + answers.length, 0);

      console.log(`Total answers found: ${totalAnswers}`);
      console.log('============ TEST COMPLETE ============\n');

      return {
        success: true,
        message: 'Answer retrieval test completed successfully',
        questionsChecked: testQuestionIds.length,
        totalAnswers,
        answersByQuestion: Object.fromEntries(
          Object.entries(answersMap).map(([qId, answers]) => [qId, answers.length])
        ),
        sampleAnswers: Object.fromEntries(
          Object.entries(answersMap).map(([qId, answers]) => [
            qId,
            answers.length > 0
              ? {
                  candidateId: answers[0].candidateId,
                  value: JSON.stringify(answers[0].value),
                  hasOpenAnswer: !!answers[0].openAnswer
                }
              : null
          ])
        )
      };
    } catch (error) {
      console.error('Error during answer retrieval test:', error);
      return {
        success: false,
        message: `Error fetching answers: ${error.message}`,
        error: error.toString()
      };
    }
  } catch (error) {
    console.error('Error testing answer retrieval:', error);
    throw error;
  }
}

export default {
  fetchProcessableQuestions,
  fetchAnswersForQuestions,
  logQuestionDetails,
  testQuestionRetrieval,
  testAnswerRetrieval
};
