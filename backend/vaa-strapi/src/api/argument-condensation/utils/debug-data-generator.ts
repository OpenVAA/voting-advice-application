import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function generateAnswersJSON(questions: any[]) {
  try {
    // Prepare data structure
    const data = questions.map((question) => ({
      id: question.id,
      text: question.text?.fi,
      type: question.questionType?.name,
      answers: question.answers
        .map((a) => a.openAnswer?.fi)
        .filter((openAnswer) => openAnswer)
        .slice(0, 10)
    }));

    // Direct path to results
    const outputPath =
      '/Users/daniel/sp-dev/voting-advice-application/packages/argument-condensation/backend-results/answers.json';
    console.log('Attempting to save to:', outputPath);

    // Ensure the results directory exists
    const resultsDir = path.dirname(outputPath);
    console.log('Results directory path:', resultsDir);

    if (!fs.existsSync(resultsDir)) {
      console.log('Creating directory:', resultsDir);
      fs.mkdirSync(resultsDir, { recursive: true });
    } else {
      console.log('Results directory already exists');
    }

    await writeFile(
      outputPath,
      JSON.stringify(data, null, 2) // Pretty print with 2 spaces
    );

    // Verify file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`File created successfully. Size: ${stats.size} bytes`);
    } else {
      console.log('Warning: File was not created');
    }

    console.log(`Debug: JSON file with answers saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating JSON:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}
