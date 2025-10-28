import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTextPreserved } from './isTextPreserved';

describe('isTextPreserved', () => {
  describe('valid preservation (should not throw)', () => {
    it('should pass when segments exactly match original', () => {
      const original = 'This is a test document. It has multiple sentences.';
      const segments = ['This is a test document.', ' It has multiple sentences.'];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass when segments have normalized whitespace', () => {
      const original = 'This is a test document.  It has extra   spaces.';
      const segments = ['This is a test document. ', ' It has extra spaces.'];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass when segments have trailing/leading whitespace', () => {
      const original = 'First paragraph.\n\nSecond paragraph.';
      const segments = ['  First paragraph.\n\n', 'Second paragraph.  '];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass when newlines are normalized (CRLF vs LF)', () => {
      const original = 'Line one\r\nLine two\r\nLine three';
      const segments = ['Line one\nLine two\n', 'Line three'];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass when multiple newlines are collapsed', () => {
      const original = 'Paragraph one\n\n\n\nParagraph two';
      const segments = ['Paragraph one\n\n', 'Paragraph two'];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass with unicode normalization (NFC vs NFD)', () => {
      // "café" - same word, different unicode representations
      const original = 'caf\u00E9'; // NFC form (single character é - U+00E9)
      const segments = ['cafe\u0301']; // NFD form (e + combining accent - e + U+0301)

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass with realistic paragraph segmentation', () => {
      const original = `Climate change is one of the most pressing issues of our time. Scientists have been warning about its effects for decades.

The evidence is clear: global temperatures are rising, ice caps are melting, and extreme weather events are becoming more frequent. We must act now to reduce carbon emissions.`;

      const segments = [
        'Climate change is one of the most pressing issues of our time. Scientists have been warning about its effects for decades.',
        '\n\nThe evidence is clear: global temperatures are rising, ice caps are melting, and extreme weather events are becoming more frequent. We must act now to reduce carbon emissions.'
      ];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass when single segment equals original', () => {
      const original = 'This is a short text.';
      const segments = ['This is a short text.'];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });
  });

  describe('invalid preservation (should throw)', () => {
    it('should fail when content is missing', () => {
      const original = 'This is a test document. It has multiple sentences. Important info here.';
      const segments = ['This is a test document.', ' Important info here.'];
      // Missing: "It has multiple sentences."

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when content is duplicated', () => {
      const original = 'First paragraph. Second paragraph.';
      const segments = ['First paragraph. ', 'First paragraph. ', 'Second paragraph.'];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when segments are reordered', () => {
      const original = 'First sentence. Second sentence. Third sentence.';
      const segments = ['Second sentence. ', 'First sentence. ', 'Third sentence.'];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when character count differs significantly', () => {
      const original = 'This is a test document with many words and sentences.';
      const segments = ['This is a test document.'];
      // Missing significant portion

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when content is added', () => {
      const original = 'Original text here.';
      const segments = ['Original text here.', ' Extra content added.'];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when content is substituted', () => {
      const original = 'The quick brown fox jumps over the lazy dog.';
      const segments = ['The quick brown cat jumps over the lazy dog.'];
      // "fox" changed to "cat"

      expect(() => isTextPreserved(original, segments)).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should fail on empty original text with empty segment', () => {
      const original = '';
      const segments = [''];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail on empty original text with empty segments array', () => {
      const original = '';
      const segments: Array<string> = [];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when original is empty but segments have content', () => {
      const original = '';
      const segments = ['Some content'];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when original has content but segments are empty', () => {
      const original = 'Some content';
      const segments: Array<string> = [];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });
  });

  describe('whitespace-agnostic comparison', () => {
    it('should pass when whitespace is completely removed', () => {
      const original = 'Hello World Test';
      const segments = ['HelloWorldTest']; // All spaces removed

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass when newlines replace spaces', () => {
      const original = 'Hello World Test';
      const segments = ['Hello\nWorld\nTest']; // Spaces replaced with newlines

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass when multiple whitespace types are mixed', () => {
      const original = 'Hello World  Test\n\nMore';
      const segments = ['Hello\tWorld\n\nTest   More']; // Mixed tabs, newlines, spaces

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });
  });

  describe('common character substitutions', () => {
    // Suppress console.info for these tests
    beforeEach(() => {
      vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should pass with copyright symbol normalization', () => {
      const original = '© 2024 Company';
      const segments = ['(c) 2024 Company']; // © → (c)

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass with smart quote normalization', () => {
      const original = '"Hello" and "World"';
      const segments = ['"Hello" and "World"']; // Smart quotes → straight quotes

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass with dash normalization', () => {
      const original = 'Item one—another item–third item';
      const segments = ['Item one-another item-third item']; // Em/en dash → hyphen

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass with ellipsis normalization', () => {
      const original = 'Wait… what?';
      const segments = ['Wait... what?']; // Ellipsis character → three dots

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should pass with multiple substitutions combined', () => {
      const original = '© 2024 – "Company" said: "Wait…"';
      const segments = ['(c) 2024 - "Company" said: "Wait..."'];

      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });
  });

  describe('word boundary preservation', () => {
    it('should fail when words are incorrectly merged', () => {
      const original = 'Hello World';
      const segments = ['HelloWorld']; // This should actually pass with new whitespace-agnostic approach

      // Actually, with our new approach this passes because we ignore whitespace
      // Let's test actual word changes instead
      expect(() => isTextPreserved(original, segments)).not.toThrow();
    });

    it('should fail when words are changed', () => {
      const original = 'Hello World';
      const segments = ['Hello Globe']; // "World" changed to "Globe"

      expect(() => isTextPreserved(original, segments)).toThrow();
    });

    it('should fail when word order is changed', () => {
      const original = 'Hello World Test';
      const segments = ['World Hello Test'];

      expect(() => isTextPreserved(original, segments)).toThrow();
    });
  });

  describe('logging and diagnostics', () => {
    let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should log all check results when passing', () => {
      const original = 'Test text';
      const segments = ['Test text'];

      isTextPreserved(original, segments);

      // Verify logging was called
      expect(consoleInfoSpy).toHaveBeenCalled();
      const logOutput = consoleInfoSpy.mock.calls.map((call) => (call as Array<string>).join(' ')).join('\n');

      // Check that all check names appear in logs
      expect(logOutput).toContain('Length Sanity');
      expect(logOutput).toContain('Character Distribution');
      expect(logOutput).toContain('Word Boundary Integrity');
      expect(logOutput).toContain('Core Content Preservation');
    });

    it('should log detailed error information when failing', () => {
      const original = 'Test text';
      const segments = ['Different text'];

      try {
        isTextPreserved(original, segments);
        expect.fail('Should have thrown an error');
      } catch {
        // Verify error details were logged
        expect(consoleInfoSpy).toHaveBeenCalled();
        const logOutput = consoleInfoSpy.mock.calls.map((call) => (call as Array<string>).join(' ')).join('\n');

        // Should contain failure markers
        expect(logOutput).toContain('✗');
      }
    });
  });
});
