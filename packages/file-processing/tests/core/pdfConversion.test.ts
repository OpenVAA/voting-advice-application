import { promises as fs } from 'fs';
import path from 'path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { convertPdfToMarkdown } from '../../src/core/pdfConversion';
import { FakeLLMProvider } from '../helpers/fakeLLMProvider';
import type { LLMProvider } from '@openvaa/llm-refactor';

describe('convertPdfToMarkdown', () => {
  let fakeLLMProvider: FakeLLMProvider;
  let pdfBuffer: Buffer;

  beforeAll(async () => {
    const pdfPath = path.resolve(
      __dirname,
      '../../../../packages/vector-store/src/docs/storage/official/how-eu-works.pdf'
    );
    pdfBuffer = await fs.readFile(pdfPath);
  });

  beforeEach(() => {
    fakeLLMProvider = new FakeLLMProvider();
  });

  it('should convert a PDF to markdown', async () => {
    const markdownContent = '# Fake Markdown';
    fakeLLMProvider.setStreamTextResponse({
      text: Promise.resolve(markdownContent),
      costs: Promise.resolve({ total: 0.01, input: 0.005, output: 0.005, currency: 'USD' }),
      usage: Promise.resolve({ completionTokens: 200, promptTokens: 100, totalTokens: 300 })
    });

    const result = await convertPdfToMarkdown({
      pdfBuffer,
      llmProvider: fakeLLMProvider,
      runId: 'test-run-id'
    });

    expect(result.data.markdown).toBe(markdownContent);
    expect(result.llmMetrics.costs.total).toBe(0.01);
    expect(result.llmMetrics.tokens.totalTokens).toBe(300);
  });

  it('should throw an error if markdown content is empty', async () => {
    fakeLLMProvider.setStreamTextResponse({
      text: Promise.resolve('  ')
    });

    await expect(
      convertPdfToMarkdown({
        pdfBuffer,
        llmProvider: fakeLLMProvider,
        runId: 'test-run-id'
      })
    ).rejects.toThrow('Failed to extract markdown content from PDF');
  });

  it('should throw an error if llmProvider is not provided', async () => {
    await expect(
      convertPdfToMarkdown({
        pdfBuffer,
        llmProvider: undefined as unknown as LLMProvider,
        runId: 'test-run-id'
      })
    ).rejects.toThrow('LLMProvider must be provided');
  });
});
