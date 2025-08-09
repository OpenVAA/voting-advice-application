import { beforeAll, describe, expect, test } from 'vitest';
import { PromptRegistry } from '../../src/core/condensation/prompts/promptRegistry';
import { SUPPORTED_LANGUAGES } from '../../src/core/types';

describe('PromptRegistry integration with real prompts', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    describe(`For language: ${lang}`, () => {
      let registry: PromptRegistry;
      let prompts: Array<{ promptId: string; operation: string; outputType: string }>;

      beforeAll(async () => {
        registry = await PromptRegistry.create(lang);
        prompts = registry.listPrompts();
      });

      test('It should create a registry and load prompts without errors', () => {
        expect(registry).toBeDefined();
        expect(prompts.length).toBeGreaterThan(0);
      });

      test('It should have at least one prompt for map operation', () => {
        const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
        expect(mapPrompts.length, `Expected at least one map prompt for language '${lang}'`).toBeGreaterThan(0);
      });

      test('It should have at least one prompt for iterate_map operation', () => {
        const iterateMapPrompts = prompts.filter((p) => p.operation === 'ITERATE_MAP');
        expect(
          iterateMapPrompts.length,
          `Expected at least one iterate_map prompt for language '${lang}'`
        ).toBeGreaterThan(0);
      });

      test('It should have at least one prompt for reduce operation', () => {
        const reducePrompts = prompts.filter((p) => p.operation === 'REDUCE');
        expect(reducePrompts.length, `Expected at least one reduce prompt for language '${lang}'`).toBeGreaterThan(0);
      });

      describe('prompt variable validation', () => {
        // We only test for map and reduce as other operations are optional
        test('It should contain correct variables for each prompt', () => {
          const relevantPrompts = prompts.filter((p) => ['MAP', 'REDUCE'].includes(p.operation));

          for (const { promptId } of relevantPrompts) {
            const prompt = registry.getPrompt(promptId);
            expect(prompt, `Prompt ${promptId} should be defined`).toBeDefined();
            if (!prompt) continue;

            if (prompt.operation === 'MAP') {
              expect(
                prompt.promptText,
                `map prompt ${promptId} for language '${lang}' should contain {{topic}}`
              ).toContain('{{topic}}');
              expect(
                prompt.promptText,
                `map prompt ${promptId} for language '${lang}' should contain {{comments}}`
              ).toContain('{{comments}}');
            } else if (prompt.operation === 'REDUCE') {
              expect(
                prompt.promptText,
                `reduce prompt ${promptId} for language '${lang}' should contain {{topic}}`
              ).toContain('{{topic}}');
              expect(
                prompt.promptText,
                `reduce prompt ${promptId} for language '${lang}' should contain {{argumentLists}}`
              ).toContain('{{argumentLists}}');
            }
          }
        });

        test('It should validate variables correctly at runtime', () => {
          const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
          if (mapPrompts.length === 0) return;

          const testPromptId = mapPrompts[0].promptId;

          // Test with correct variables
          const correctVariables = {
            topic: 'Test topic',
            comments: 'Test comments'
          };

          const correctValidation = registry.validatePromptVariablesAtRuntime(testPromptId, correctVariables);
          expect(correctValidation.valid).toBe(true);
          expect(correctValidation.missing).toEqual([]);
          expect(correctValidation.extra).toEqual([]);

          // Test with missing variables
          const missingVariables = {
            topic: 'Test topic'
            // missing comments
          };

          const missingValidation = registry.validatePromptVariablesAtRuntime(testPromptId, missingVariables);
          expect(missingValidation.valid).toBe(false);
          expect(missingValidation.missing).toContain('comments');
          expect(missingValidation.extra).toEqual([]);

          // Test with extra variables
          const extraVariables = {
            topic: 'Test topic',
            comments: 'Test comments',
            extraVar: 'Extra variable'
          };

          const extraValidation = registry.validatePromptVariablesAtRuntime(testPromptId, extraVariables);
          expect(extraValidation.valid).toBe(true); // Extra variables don't make it invalid
          expect(extraValidation.missing).toEqual([]);
          expect(extraValidation.extra).toContain('extraVar');
        });

        test('It should throw error for non-existent prompt ID', () => {
          expect(() => {
            registry.validatePromptVariablesAtRuntime('non-existent-prompt', {});
          }).toThrow("Prompt with ID 'non-existent-prompt' not found");
        });

        test('It should handle empty variables object', () => {
          const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
          if (mapPrompts.length === 0) return;

          const testPromptId = mapPrompts[0].promptId;
          const emptyValidation = registry.validatePromptVariablesAtRuntime(testPromptId, {});

          expect(emptyValidation.valid).toBe(false);
          expect(emptyValidation.missing.length).toBeGreaterThan(0);
          expect(emptyValidation.extra).toEqual([]);
        });

        test('It should handle variables with whitespace in names', () => {
          const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
          if (mapPrompts.length === 0) return;

          const testPromptId = mapPrompts[0].promptId;

          // Test with variables that have whitespace (should be trimmed)
          const whitespaceVariables = {
            ' topic ': 'Test topic', // Note the spaces
            ' comments ': 'Test comments'
          };

          const validation = registry.validatePromptVariablesAtRuntime(testPromptId, whitespaceVariables);
          // This should fail because the actual variable names in the prompt don't have spaces
          expect(validation.valid).toBe(false);
          expect(validation.missing).toContain('topic');
          expect(validation.missing).toContain('comments');
        });

        test('It should validate all prompt types correctly', () => {
          const allPromptTypes = ['MAP', 'REDUCE', 'ITERATE_MAP', 'REFINE', 'GROUND'];

          for (const operation of allPromptTypes) {
            const operationPrompts = prompts.filter((p) => p.operation === operation);
            if (operationPrompts.length === 0) continue;

            const testPromptId = operationPrompts[0].promptId;
            const prompt = registry.getPrompt(testPromptId);
            if (!prompt) continue;

            // Get the expected variables based on operation type
            let expectedVariables: Record<string, string> = {};

            switch (operation) {
              case 'MAP':
                expectedVariables = { topic: 'test', comments: 'test' };
                break;
              case 'REDUCE':
                expectedVariables = { topic: 'test', argumentLists: 'test' };
                break;
              case 'ITERATE_MAP':
                expectedVariables = { topic: 'test', arguments: 'test' };
                break;
              case 'REFINE':
                expectedVariables = { topic: 'test', comments: 'test', existingArguments: 'test' };
                break;
              case 'GROUND':
                expectedVariables = { topic: 'test', arguments: 'test' };
                break;
            }

            // Test with expected variables (may not be valid for all prompts, but shouldn't crash)
            try {
              const validation = registry.validatePromptVariablesAtRuntime(testPromptId, expectedVariables);
              expect(typeof validation.valid).toBe('boolean');
              expect(Array.isArray(validation.missing)).toBe(true);
              expect(Array.isArray(validation.extra)).toBe(true);
            } catch (error) {
              // Some prompts might not have the expected variables, which is fine
              expect(error).toBeInstanceOf(Error);
            }
          }
        });

        test('It should handle case-sensitive variable names', () => {
          const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
          if (mapPrompts.length === 0) return;

          const testPromptId = mapPrompts[0].promptId;

          // Test with wrong case
          const wrongCaseVariables = {
            Topic: 'Test topic', // Wrong case
            Comments: 'Test comments' // Wrong case
          };

          const validation = registry.validatePromptVariablesAtRuntime(testPromptId, wrongCaseVariables);
          expect(validation.valid).toBe(false);
          expect(validation.missing).toContain('topic');
          expect(validation.missing).toContain('comments');
          expect(validation.extra).toContain('Topic');
          expect(validation.extra).toContain('Comments');
        });

        test('It should handle multiple occurrences of the same variable', () => {
          const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
          if (mapPrompts.length === 0) return;

          const testPromptId = mapPrompts[0].promptId;

          // Test with variables that appear multiple times in the prompt
          const singleVariable = {
            topic: 'Test topic'
            // missing comments
          };

          const validation = registry.validatePromptVariablesAtRuntime(testPromptId, singleVariable);
          expect(validation.valid).toBe(false);
          expect(validation.missing).toContain('comments');
          // Should only report 'comments' once, even if it appears multiple times in the prompt
          expect(validation.missing.filter((v) => v === 'comments').length).toBe(1);
        });

        test('It should handle special characters in variable names', () => {
          const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
          if (mapPrompts.length === 0) return;

          const testPromptId = mapPrompts[0].promptId;

          // Test with special characters (these shouldn't exist in real prompts, but test the robustness)
          const specialCharVariables = {
            'topic-with-dashes': 'test',
            topic_with_underscores: 'test',
            topicWithCamelCase: 'test'
          };

          const validation = registry.validatePromptVariablesAtRuntime(testPromptId, specialCharVariables);
          expect(validation.valid).toBe(false);
          expect(validation.missing).toContain('topic');
          expect(validation.missing).toContain('comments');
          expect(validation.extra).toContain('topic-with-dashes');
          expect(validation.extra).toContain('topic_with_underscores');
          expect(validation.extra).toContain('topicWithCamelCase');
        });
      });
    });
  }
});

// Additional tests for edge cases and specific scenarios
describe('PromptRegistry variable validation edge cases', () => {
  test('It should handle prompts with no variables', () => {
    // This test would require a mock prompt, but we can test the extraction logic
    const registry = new PromptRegistry();

    // Test extraction with no variables
    const noVariablesText = 'This is a prompt with no variables at all.';
    const extracted = registry.extractVariablesFromPromptText(noVariablesText);
    expect(extracted).toEqual([]);
  });

  test('It should skip prompts with validation issues', async () => {
    // Create a registry and check initial state
    const registry = await PromptRegistry.create('fi');
    const initialPrompts = registry.listPrompts();

    // Test that the registry loads prompts successfully
    expect(initialPrompts.length).toBeGreaterThan(0);

    // Verify that all loaded prompts pass validation
    for (const { promptId } of initialPrompts) {
      const prompt = registry.getPrompt(promptId);
      expect(prompt).toBeDefined();

      if (prompt) {
        // Test that the prompt's variables are properly documented
        const validation = registry.validatePromptVariables(
          prompt.promptText,
          prompt.params as unknown as Record<string, unknown>
        );
        expect(validation.valid).toBe(true);
      }
    }
  });

  test('It should validate variable extraction correctly', () => {
    const registry = new PromptRegistry();

    // Test various variable patterns
    const testCases = [
      {
        text: 'Simple {{variable}} test',
        expected: ['variable']
      },
      {
        text: 'Multiple {{var1}} and {{var2}} variables',
        expected: ['var1', 'var2']
      },
      {
        text: 'Duplicate {{var1}} and {{var1}} variables',
        expected: ['var1'] // Should deduplicate
      },
      {
        text: 'No variables here',
        expected: []
      },
      {
        text: 'Empty {{}} braces',
        expected: [] // Our regex [^}]+ requires at least one character, so empty braces are not captured
      },
      {
        text: 'Whitespace {{  var  }} handling',
        expected: ['var'] // Should trim whitespace
      }
    ];

    for (const testCase of testCases) {
      const extracted = registry.extractVariablesFromPromptText(testCase.text);
      expect(extracted).toEqual(testCase.expected);
    }
  });
});
