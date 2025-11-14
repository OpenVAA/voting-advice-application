import { extractPromptVars } from '@openvaa/llm-refactor';
import { readdir, readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

const packageRoot = join(__dirname, '..');

/**
 * Test suite to validate prompt files for each supported language
 */
describe('Prompt File Validation', () => {
  // Hardcoded expected prompt names
  const expectedPrompts = ['generateTerms.yaml', 'generateInfoSections.yaml', 'generateBoth.yaml', 'instructions.yaml'];

  // Expected fields for each prompt type
  const expectedFields = {
    'generateTerms.yaml': ['prompt', 'params'],
    'generateInfoSections.yaml': ['prompt', 'params'],
    'generateBoth.yaml': ['prompt', 'params'],
    'instructions.yaml': []
  };

  // Expected fields for example files
  const expectedExampleFields = ['question', 'infoSectionExample', 'termExample'];

  // Expected params for each generate-* prompt
  const expectedParams = {
    'generateTerms.yaml': [
      'question',
      'generalInstructions',
      'termDefInstructions',
      'questionContext',
      'customInstructions',
      'neutralityRequirements',
      'examples'
    ],
    'generateInfoSections.yaml': [
      'question',
      'generalInstructions',
      'infoSectionInstructions',
      'sectionTopics',
      'questionContext',
      'customInstructions',
      'neutralityRequirements',
      'examples'
    ],
    'generateBoth.yaml': [
      'question',
      'generalInstructions',
      'infoSectionInstructions',
      'sectionTopics',
      'termDefInstructions',
      'questionContext',
      'customInstructions',
      'neutralityRequirements',
      'examples'
    ]
  };

  // Get list of supported languages dynamically
  async function getSupportedLanguages(): Promise<Array<string>> {
    const promptsDir = join(packageRoot, 'src', 'prompts');
    const dirs = await readdir(promptsDir, { withFileTypes: true });
    return dirs.filter((dir) => dir.isDirectory()).map((dir) => dir.name);
  }

  // Get supported languages and run tests
  let supportedLanguages: Array<string>;

  beforeAll(async () => {
    supportedLanguages = await getSupportedLanguages();
    expect(supportedLanguages.length).toBeGreaterThan(0); // Ensure there is at least one language
  });

  // (a) Check if expected prompt files exist for each language
  it('should have all expected prompt files for each language', async () => {
    for (const language of supportedLanguages) {
      const promptsDir = join(packageRoot, 'src', 'prompts', language);
      const files = await readdir(promptsDir);
      for (const expectedPrompt of expectedPrompts) {
        expect(files).toContain(expectedPrompt);
      }
    }
  });

  // (b) Check if each prompt YAML has the expected fields
  for (const promptFile of expectedPrompts) {
    it(`should have expected fields in ${promptFile}`, async () => {
      for (const language of supportedLanguages) {
        const filePath = join(packageRoot, 'src', 'prompts', language, promptFile);
        const raw = await readFile(filePath, 'utf-8');
        const parsed = loadYaml(raw) as Record<string, unknown>;

        const fieldsToCheck = expectedFields[promptFile as keyof typeof expectedFields];
        for (const field of fieldsToCheck) {
          expect(parsed).toHaveProperty(field);
        }
      }
    });
  }

  // (c) Check if params in generate-* prompts match the ones used in the prompt text
  const generatePrompts = expectedPrompts.filter((p) => p.startsWith('generate'));
  for (const promptFile of generatePrompts) {
    it(`should have matching params in ${promptFile}`, async () => {
      for (const language of supportedLanguages) {
        const filePath = join(packageRoot, 'src', 'prompts', language, promptFile);
        const raw = await readFile(filePath, 'utf-8');
        const parsed = loadYaml(raw) as Record<string, unknown>;

        if ('params' in parsed && typeof parsed.params === 'object' && parsed.params !== null) {
          const declaredParams = Object.keys(parsed.params);
          const expectedParamList = expectedParams[promptFile as keyof typeof expectedParams];
          expect(declaredParams).toEqual(expect.arrayContaining(expectedParamList));

          // Check if all params in prompt text are declared
          if ('prompt' in parsed && typeof parsed.prompt === 'string') {
            const usedVars = extractPromptVars(parsed.prompt);
            for (const usedVar of usedVars) {
              expect(declaredParams).toContain(usedVar);
            }
          }
        }
      }
    });
  }

  // (d) Check if example files have the correct fields
  it('should have correct fields in all example files', async () => {
    for (const language of supportedLanguages) {
      const examplesDir = join(packageRoot, 'src', 'prompts', language, 'examples');

      // Check if examples directory exists
      try {
        const exampleFiles = await readdir(examplesDir);

        for (const exampleFile of exampleFiles) {
          if (exampleFile.endsWith('.yaml')) {
            const filePath = join(examplesDir, exampleFile);
            const raw = await readFile(filePath, 'utf-8');
            const parsed = loadYaml(raw) as Record<string, unknown>;

            // Check that all expected fields are present
            for (const field of expectedExampleFields) {
              expect(parsed).toHaveProperty(field);
              expect(parsed[field]).toBeTruthy(); // Ensure field is not empty
            }

            // Additional validation for specific fields
            if (typeof parsed.question === 'string') {
              expect(parsed.question.trim().length).toBeGreaterThan(0);
            }

            if (typeof parsed.infoSectionExample === 'string') {
              expect(parsed.infoSectionExample.trim().length).toBeGreaterThan(0);
              // Try to parse as JSON to ensure it's valid
              expect(() => JSON.parse(parsed.infoSectionExample as string)).not.toThrow();
            }

            if (typeof parsed.termExample === 'string') {
              expect(parsed.termExample.trim().length).toBeGreaterThan(0);
              // Try to parse as JSON to ensure it's valid
              expect(() => JSON.parse(parsed.termExample as string)).not.toThrow();
            }
          }
        }
      } catch (error) {
        // If examples directory doesn't exist, that's also a problem
        throw new Error(`Examples directory not found for language ${language}: ${error}`);
      }
    }
  });
});
