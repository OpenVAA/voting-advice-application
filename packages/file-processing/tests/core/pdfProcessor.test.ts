import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertPdfToMarkdown } from '../../src/core/pdfProcessor';
import { FakeLLMProvider } from '../helpers/fakeLLMProvider';

// Create a mock LLM provider instance that will be reused across tests
const mockLLMProvider = new FakeLLMProvider();

// Mock the LLMProvider
vi.mock('@openvaa/llm-refactor', () => ({
  LLMProvider: vi.fn().mockImplementation(() => mockLLMProvider)
}));

// Mock the promptLoader
vi.mock('../../src/utils/promptLoader', () => ({
  loadPrompt: vi.fn().mockResolvedValue({
    id: 'pdfToMarkdown',
    prompt: 'Convert this PDF to markdown',
    usedVars: []
  })
}));

describe('convertPdfToMarkdown', () => {
  const mockPdfBuffer = Buffer.from('mock-pdf-content');

  beforeEach(() => {
    vi.clearAllMocks();
    mockLLMProvider.clearHistory();

    // Set up a default stream response
    mockLLMProvider.setDefaultStreamResponse({
      text: '# Sample PDF Output\n\nThis is converted markdown.',
      costs: { input: 0.001, output: 0.002, total: 0.003 }
    });
  });

  describe('basic PDF conversion', () => {
    it('should convert PDF buffer to markdown', async () => {
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.markdown).toBeDefined();
      expect(result.markdown).toContain('# Sample PDF Output');
      expect(result.metadata).toBeDefined();
    });

    it('should use provided API key', async () => {
      const { LLMProvider } = await import('@openvaa/llm-refactor');

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'custom-api-key'
      });

      expect(LLMProvider).toHaveBeenCalledWith({
        provider: 'google',
        apiKey: 'custom-api-key',
        modelConfig: {
          primary: 'gemini-2.0-flash-exp'
        }
      });
    });

    it('should use default model when not specified', async () => {
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.metadata.modelUsed).toBe('gemini-2.0-flash-exp');
    });

    it('should use custom model when specified', async () => {
      const customModel = 'gemini-2.0-flash';
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key',
        model: customModel
      });

      expect(result.metadata.modelUsed).toBe(customModel);
    });
  });

  describe('metadata handling', () => {
    it('should include original filename in metadata', async () => {
      const filename = 'test-document.pdf';
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key',
        originalFileName: filename
      });

      expect(result.metadata.originalFileName).toBe(filename);
    });

    it('should include processing timestamp', async () => {
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.metadata.processingTimestamp).toBeDefined();
      expect(new Date(result.metadata.processingTimestamp).toString()).not.toBe('Invalid Date');
    });

    it('should handle missing filename gracefully', async () => {
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.metadata.originalFileName).toBeUndefined();
    });

    it('should include cost information in metadata', async () => {
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.metadata.costs).toBeDefined();
      expect(result.metadata.costs.input).toBeDefined();
      expect(result.metadata.costs.output).toBeDefined();
      expect(result.metadata.costs.total).toBeDefined();
    });
  });

  describe('buffer handling', () => {
    it('should convert buffer to base64 in API call', async () => {
      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      const streamCalls = mockLLMProvider.getStreamCallHistory();
      expect(streamCalls).toHaveLength(1);

      const call = streamCalls[0];
      expect(call.messages).toBeDefined();
      expect(call.messages?.[0].content).toBeDefined();

      // Check that the content includes the PDF data
      const content = call.messages?.[0].content;
      if (Array.isArray(content)) {
        const fileContent = content.find((c) => c.type === 'file');
        expect(fileContent).toBeDefined();
        expect(fileContent).toHaveProperty('mediaType', 'application/pdf');
        expect(fileContent).toHaveProperty('data');
      }
    });

    it('should handle large PDF buffers', async () => {
      const largePdfBuffer = Buffer.alloc(1024 * 1024); // 1MB buffer

      const result = await convertPdfToMarkdown({
        pdfBuffer: largePdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.markdown).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw error when conversion returns empty text', async () => {
      mockLLMProvider.setDefaultStreamResponse({
        text: '',
        costs: { input: 0.001, output: 0.002, total: 0.003 }
      });

      await expect(
        convertPdfToMarkdown({
          pdfBuffer: mockPdfBuffer,
          apiKey: 'test-api-key'
        })
      ).rejects.toThrow('Failed to extract markdown content from PDF');
    });

    it('should handle whitespace-only responses', async () => {
      mockLLMProvider.setDefaultStreamResponse({
        text: '   \n\n  \t  ',
        costs: { input: 0.001, output: 0.002, total: 0.003 }
      });

      await expect(
        convertPdfToMarkdown({
          pdfBuffer: mockPdfBuffer,
          apiKey: 'test-api-key'
        })
      ).rejects.toThrow('Failed to extract markdown content from PDF');
    });

    it('should propagate LLM provider errors', async () => {
      // Configure the mock to throw an error
      const originalStreamText = mockLLMProvider.streamText;
      mockLLMProvider.streamText = () => {
        throw new Error('API rate limit exceeded');
      };

      await expect(
        convertPdfToMarkdown({
          pdfBuffer: mockPdfBuffer,
          apiKey: 'test-api-key'
        })
      ).rejects.toThrow('API rate limit exceeded');

      // Restore the original method
      mockLLMProvider.streamText = originalStreamText;
    });
  });

  describe('prompt loading', () => {
    it('should load PDF to markdown prompt', async () => {
      const { loadPrompt } = await import('../../src/utils/promptLoader');

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(loadPrompt).toHaveBeenCalledWith({ promptFileName: 'pdfToMarkdown' });
    });

    it('should include prompt in API call', async () => {
      const { loadPrompt } = await import('../../src/utils/promptLoader');

      vi.mocked(loadPrompt).mockResolvedValueOnce({
        id: 'pdfToMarkdown',
        prompt: 'Custom PDF conversion prompt',
        usedVars: []
      });

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      const streamCalls = mockLLMProvider.getStreamCallHistory();
      expect(streamCalls).toHaveLength(1);

      const call = streamCalls[0];
      const content = call.messages?.[0].content;
      if (Array.isArray(content)) {
        const textContent = content.find((c) => c.type === 'text');
        expect(textContent).toBeDefined();
        if (textContent && 'text' in textContent) {
          expect(textContent.text).toBe('Custom PDF conversion prompt');
        }
      }
    });
  });

  describe('markdown output', () => {
    it('should trim markdown output', async () => {
      mockLLMProvider.setDefaultStreamResponse({
        text: '   \n# Title\n\nContent\n\n   ',
        costs: { input: 0.001, output: 0.002, total: 0.003 }
      });

      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.markdown).toBe('# Title\n\nContent');
    });

    it('should preserve markdown formatting', async () => {
      const expectedMarkdown = `# Title

## Subtitle

- Item 1
- Item 2

**Bold text** and *italic text*.`;

      mockLLMProvider.setDefaultStreamResponse({
        text: expectedMarkdown,
        costs: { input: 0.001, output: 0.002, total: 0.003 }
      });

      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.markdown).toBe(expectedMarkdown);
    });
  });

  describe('model configuration', () => {
    it('should pass model name to streamText call', async () => {
      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key',
        model: 'gemini-1.5-pro'
      });

      const streamCalls = mockLLMProvider.getStreamCallHistory();
      expect(streamCalls).toHaveLength(1);
      expect(streamCalls[0].modelConfig?.primary).toBe('gemini-1.5-pro');
    });
  });
});
