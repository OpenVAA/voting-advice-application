import { describe, it, expect, beforeEach, vi } from 'vitest';
import { convertPdfToMarkdown } from '../../src/core/pdfProcessor';

// Mock the Google GenAI module
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: '# Sample PDF Output\n\nThis is converted markdown.'
      })
    }
  }))
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
      const { GoogleGenAI } = await import('@google/genai');

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'custom-api-key'
      });

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'custom-api-key' });
    });

    it('should use default model when not specified', async () => {
      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.metadata.modelUsed).toBe('gemini-2.5-pro');
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
  });

  describe('buffer handling', () => {
    it('should convert buffer to base64', async () => {
      const { GoogleGenAI } = await import('@google/genai');
      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(mockAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              inlineData: expect.objectContaining({
                mimeType: 'application/pdf',
                data: expect.any(String)
              })
            })
          ])
        })
      );
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
    it('should throw error when API key is missing', async () => {
      // Clear the environment variable
      const originalEnv = process.env.LLM_GEMINI_API_KEY;
      delete process.env.LLM_GEMINI_API_KEY;

      await expect(
        convertPdfToMarkdown({
          pdfBuffer: mockPdfBuffer
        })
      ).rejects.toThrow('Gemini API key is required');

      // Restore environment
      if (originalEnv) {
        process.env.LLM_GEMINI_API_KEY = originalEnv;
      }
    });

    it('should use environment variable when API key not provided', async () => {
      process.env.LLM_GEMINI_API_KEY = 'env-api-key';
      const { GoogleGenAI } = await import('@google/genai');

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer
      });

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'env-api-key' });
    });

    it('should throw error when conversion fails', async () => {
      const { GoogleGenAI } = await import('@google/genai');
      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      // Mock a failed response with empty text
      mockAI.models.generateContent.mockResolvedValueOnce({ text: '' });

      await expect(
        convertPdfToMarkdown({
          pdfBuffer: mockPdfBuffer,
          apiKey: 'test-api-key'
        })
      ).rejects.toThrow('Failed to extract markdown content from PDF');
    });

    it('should throw error when API call fails', async () => {
      const { GoogleGenAI } = await import('@google/genai');
      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      mockAI.models.generateContent.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      await expect(
        convertPdfToMarkdown({
          pdfBuffer: mockPdfBuffer,
          apiKey: 'test-api-key'
        })
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle whitespace-only responses', async () => {
      const { GoogleGenAI } = await import('@google/genai');
      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      mockAI.models.generateContent.mockResolvedValueOnce({ text: '   \n\n  \t  ' });

      await expect(
        convertPdfToMarkdown({
          pdfBuffer: mockPdfBuffer,
          apiKey: 'test-api-key'
        })
      ).rejects.toThrow('Failed to extract markdown content from PDF');
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
      const { GoogleGenAI } = await import('@google/genai');
      const { loadPrompt } = await import('../../src/utils/promptLoader');

      // Mock specific prompt
      (loadPrompt as any).mockResolvedValueOnce({
        id: 'pdfToMarkdown',
        prompt: 'Custom PDF conversion prompt',
        usedVars: []
      });

      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(mockAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([expect.objectContaining({ text: 'Custom PDF conversion prompt' })])
        })
      );
    });
  });

  describe('markdown output', () => {
    it('should trim markdown output', async () => {
      const { GoogleGenAI } = await import('@google/genai');
      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      mockAI.models.generateContent.mockResolvedValueOnce({
        text: '   \n# Title\n\nContent\n\n   '
      });

      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.markdown).toBe('# Title\n\nContent');
    });

    it('should preserve markdown formatting', async () => {
      const { GoogleGenAI } = await import('@google/genai');
      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      const expectedMarkdown = `# Title

## Subtitle

- Item 1
- Item 2

**Bold text** and *italic text*.`;

      mockAI.models.generateContent.mockResolvedValueOnce({
        text: expectedMarkdown
      });

      const result = await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key'
      });

      expect(result.markdown).toBe(expectedMarkdown);
    });
  });

  describe('model configuration', () => {
    it('should pass model name to API', async () => {
      const { GoogleGenAI } = await import('@google/genai');
      const mockAI = new (GoogleGenAI as any)({ apiKey: 'test' });

      await convertPdfToMarkdown({
        pdfBuffer: mockPdfBuffer,
        apiKey: 'test-api-key',
        model: 'gemini-1.5-pro'
      });

      expect(mockAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-1.5-pro'
        })
      );
    });
  });
});
