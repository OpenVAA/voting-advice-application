import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function generateAnswersCSV(questions: any[]) {
  // Prepare data for CSV
  const questionTexts = questions.map((q) => q.text);
  const answersByQuestion = questions.map((q) =>
    q.answers
      .map((a) => a.openAnswer?.fi) // Only select Finnish answers
      .filter((openAnswer) => openAnswer)
      .slice(0, 10) // Take only first 10 answers
      .map((answer) => String(answer))
  );

  // Find the maximum number of answers for any question
  const maxAnswers = Math.max(...answersByQuestion.map((answers) => answers.length));

  // Create CSV content
  let csvContent = questionTexts.join(',') + '\n'; // Headers

  // Add answers row by row
  for (let i = 0; i < maxAnswers; i++) {
    const row = answersByQuestion
      .map((answers) => {
        const answer = answers[i];
        return answer ? `"${answer.replace(/"/g, '""')}"` : ''; // Only try to replace if answer exists
      })
      .join(',');
    csvContent += row + '\n';
  }

  // Save to file in backend results directory
  const outputPath = path.join(__dirname, '../../results/answers.csv');

  // Ensure the results directory exists
  const resultsDir = path.dirname(outputPath);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  await writeFile(outputPath, csvContent);
  console.log(`Debug: CSV file with answers saved to: ${outputPath}`);
}
