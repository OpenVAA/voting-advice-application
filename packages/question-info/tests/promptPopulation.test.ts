import { BooleanQuestion, DataRoot, QUESTION_TYPE } from '@openvaa/data';
import { describe, expect, test, vi } from 'vitest';
import { generateQuestionInfo } from '../src/api';
import { QUESTION_INFO_OPERATION } from '../src/types';
import type { Controller } from '@openvaa/core';
import type { QuestionInfoOptions } from '../src/types';

// No-op controller for tests
const noOpLogger: Controller = {
  info: () => {},
  warning: () => {},
  error: () => {},
  progress: () => {},
  checkAbort: () => {},
  defineSubOperations: () => {},
  getCurrentOperation: () => null
};

describe('Prompt Population Bug Test', () => {
  test('should populate prompt template variables correctly', async () => {
    const root = new DataRoot();
    const question = new BooleanQuestion({
      data: {
        id: 'test-q-1',
        type: QUESTION_TYPE.Boolean,
        name: 'Should we increase renewable energy investment?',
        categoryId: 'test-category'
      },
      root
    });

    // Create a spy to capture what's being sent to the LLM
    const generateObjectParallelSpy = vi.fn().mockResolvedValue([
      {
        object: {
          infoSections: [{ title: 'Test', content: 'Test content' }]
        },
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        latencyMs: 10,
        attempts: 1,
        costs: { total: 0 }
      }
    ]);

    const mockLLMProvider = {
      generateObjectParallel: generateObjectParallelSpy
    } as any;

    const options: QuestionInfoOptions = {
      runId: 'test-run',
      operations: [QUESTION_INFO_OPERATION.InfoSections],
      language: 'en',
      modelConfig: { primary: 'gpt-4' },
      llmProvider: mockLLMProvider,
      controller: noOpLogger,
      llmModel: 'gpt-4'
    };

    await generateQuestionInfo({ questions: [question], options });

    // Check what was actually sent to the LLM
    expect(generateObjectParallelSpy).toHaveBeenCalledTimes(1);
    const callArgs = generateObjectParallelSpy.mock.calls[0][0];
    const firstRequest = callArgs.requests[0];
    const promptContent = firstRequest.messages[0].content;

    console.log('\n=== PROMPT SENT TO LLM ===');
    console.log(promptContent);
    console.log('=== END PROMPT ===\n');

    // These assertions will FAIL if the bug exists
    expect(promptContent).toContain('Should we increase renewable energy investment?');
    expect(promptContent).not.toContain('{{question}}');
    expect(promptContent).not.toContain('{{generalInstructions}}');
    expect(promptContent).not.toContain('{{infoSectionInstructions}}');
    expect(promptContent).not.toContain('{{examples}}');
  });
});
