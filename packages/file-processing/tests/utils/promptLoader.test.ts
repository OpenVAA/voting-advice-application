import { describe, it, expect, vi } from 'vitest';
import { loadPrompt } from '../../src/utils/promptLoader';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}));

// Mock the LLM refactor utilities
vi.mock('@openvaa/llm-refactor', () => ({
  extractPromptVars: vi.fn((text) => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map((m: string) => m.replace(/\{\{|\}\}/g, ''));
  }),
  validatePromptVars: vi.fn()
}));

describe('promptLoader', () => {
  describe('loadPrompt', () => {
    it('should load a YAML prompt file', async () => {
      const mockYaml = `
id: testPrompt
params:
  var1: string
  var2: string
prompt: |
  This is a test prompt with {{var1}} and {{var2}}
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'testPrompt' });

      expect(result.id).toBe('testPrompt');
      expect(result.prompt).toContain('This is a test prompt');
      expect(result.params).toEqual({ var1: 'string', var2: 'string' });
    });

    it('should extract variables from prompt', async () => {
      const mockYaml = `
id: varTest
prompt: |
  Prompt with {{variable1}} and {{variable2}}
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'varTest' });

      expect(result.usedVars).toContain('variable1');
      expect(result.usedVars).toContain('variable2');
    });

    it('should load from correct file path', async () => {
      const mockYaml = `
id: pathTest
prompt: Test prompt
`;
      (readFile as any).mockResolvedValue(mockYaml);

      await loadPrompt({ promptFileName: 'pathTest' });

      const expectedPath = expect.stringContaining('prompts/pathTest.yaml');
      expect(readFile).toHaveBeenCalledWith(expectedPath, 'utf-8');
    });

    it('should handle prompts without params', async () => {
      const mockYaml = `
id: noParams
prompt: Simple prompt without params
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'noParams' });

      expect(result.id).toBe('noParams');
      expect(result.params).toBeUndefined();
      expect(result.prompt).toBe('Simple prompt without params');
    });

    it('should handle multiline prompts', async () => {
      const mockYaml = `
id: multiline
prompt: |
  Line 1
  Line 2
  Line 3
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'multiline' });

      expect(result.prompt).toContain('Line 1');
      expect(result.prompt).toContain('Line 2');
      expect(result.prompt).toContain('Line 3');
    });

    it('should validate prompt variables', async () => {
      const mockYaml = `
id: validated
params:
  requiredVar: string
prompt: |
  Prompt with {{requiredVar}}
`;
      (readFile as any).mockResolvedValue(mockYaml);
      const { validatePromptVars } = await import('@openvaa/llm-refactor');

      await loadPrompt({ promptFileName: 'validated' });

      expect(validatePromptVars).toHaveBeenCalledWith({
        promptText: expect.stringContaining('Prompt with {{requiredVar}}'),
        params: { requiredVar: 'string' }
      });
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid YAML', async () => {
      (readFile as any).mockResolvedValue('invalid: yaml: structure:');

      await expect(loadPrompt({ promptFileName: 'invalid' })).rejects.toThrow();
    });

    it('should throw error when prompt field is missing', async () => {
      const mockYaml = `
id: missingPrompt
params:
  var: string
`;
      (readFile as any).mockResolvedValue(mockYaml);

      await expect(loadPrompt({ promptFileName: 'missingPrompt' })).rejects.toThrow(
        "Prompt missingPrompt must contain 'prompt' field"
      );
    });

    it('should throw error for non-object YAML', async () => {
      (readFile as any).mockResolvedValue('just a string');

      await expect(loadPrompt({ promptFileName: 'notObject' })).rejects.toThrow('Invalid YAML for prompt notObject');
    });

    it('should throw error when file not found', async () => {
      (readFile as any).mockRejectedValue(new Error('ENOENT: File not found'));

      await expect(loadPrompt({ promptFileName: 'nonexistent' })).rejects.toThrow('ENOENT: File not found');
    });

    it('should handle null YAML content', async () => {
      (readFile as any).mockResolvedValue('null');

      await expect(loadPrompt({ promptFileName: 'nullContent' })).rejects.toThrow(
        'Invalid YAML for prompt nullContent'
      );
    });
  });

  describe('variable extraction', () => {
    it('should extract all template variables', async () => {
      const mockYaml = `
id: multiVar
prompt: |
  {{var1}} and {{var2}} and {{var3}}
`;
      (readFile as any).mockResolvedValue(mockYaml);
      const { extractPromptVars } = await import('@openvaa/llm-refactor');

      await loadPrompt({ promptFileName: 'multiVar' });

      expect(extractPromptVars).toHaveBeenCalledWith(expect.stringContaining('{{var1}} and {{var2}} and {{var3}}'));
    });

    it('should handle prompts with no variables', async () => {
      const mockYaml = `
id: noVars
prompt: Plain text without any template variables
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'noVars' });

      expect(result.usedVars).toEqual([]);
    });
  });

  describe('real prompt files', () => {
    it('should load segmentation prompt', async () => {
      const mockYaml = `
id: segmentation
params:
  text: string
  minSegmentLength: string
  maxSegmentLength: string
prompt: |
  You are a document segmentation expert. Divide the following text into logical segments.
  {{text}}
  Segments should be {{minSegmentLength}}-{{maxSegmentLength}} characters.
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'segmentation' });

      expect(result.id).toBe('segmentation');
      expect(result.params?.text).toBe('string');
      expect(result.params?.minSegmentLength).toBe('string');
      expect(result.params?.maxSegmentLength).toBe('string');
    });

    it('should load metadata extraction prompt', async () => {
      const mockYaml = `
id: metadataExtraction
params:
  documentStart: string
  documentEnd: string
prompt: |
  Extract metadata from document.
  Beginning: {{documentStart}}
  End: {{documentEnd}}
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'metadataExtraction' });

      expect(result.id).toBe('metadataExtraction');
      expect(result.params?.documentStart).toBe('string');
      expect(result.params?.documentEnd).toBe('string');
    });

    it('should load segment analysis prompt', async () => {
      const mockYaml = `
id: segmentAnalysis
params:
  segmentWithContext: string
prompt: |
  Analyze the following segment.
  {{segmentWithContext}}
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'segmentAnalysis' });

      expect(result.id).toBe('segmentAnalysis');
      expect(result.params?.segmentWithContext).toBe('string');
    });

    it('should load PDF to markdown prompt', async () => {
      const mockYaml = `
id: pdfToMarkdown
prompt: |
  Convert the following PDF to markdown format.
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'pdfToMarkdown' });

      expect(result.id).toBe('pdfToMarkdown');
      expect(result.prompt).toContain('Convert');
    });
  });

  describe('edge cases', () => {
    it('should handle empty params object', async () => {
      const mockYaml = `
id: emptyParams
params: {}
prompt: Test prompt
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'emptyParams' });

      expect(result.params).toEqual({});
    });

    it('should handle complex nested params', async () => {
      const mockYaml = `
id: nestedParams
params:
  simple: string
  complex:
    nested: value
prompt: Test
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'nestedParams' });

      expect(result.params).toBeDefined();
      expect(result.params?.simple).toBe('string');
    });

    it('should preserve whitespace in prompts', async () => {
      const mockYaml = `
id: whitespace
prompt: |
  Line 1
  
  Line 3 with gap above
    Indented line
`;
      (readFile as any).mockResolvedValue(mockYaml);

      const result = await loadPrompt({ promptFileName: 'whitespace' });

      expect(result.prompt).toContain('Line 1\n\nLine 3');
      expect(result.prompt).toContain('  Indented line');
    });
  });
});
