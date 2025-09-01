import { describe, expect, test, vi } from 'vitest';
import { setPromptVars } from '../src/utils/setPromptVars';
import type { Controller } from '@openvaa/core';

// No-op controller for testing
const mockLogger: Controller = {
  warning: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  progress: vi.fn()
};

describe('setPromptVars', () => {
  test('should replace variables correctly', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = { name: 'John', age: 25 };

    const result = setPromptVars({ promptText, variables, controller: mockLogger });
    expect(result).toBe('Hello John, you are 25 years old.');
  });

  test('should handle object variables by JSON stringifying them', () => {
    const promptText = 'User data: {{userData}}';
    const variables = { userData: { name: 'John', age: 25 } };

    const result = setPromptVars({ promptText, variables, controller: mockLogger });
    expect(result).toBe('User data: {\n  "name": "John",\n  "age": 25\n}');
  });

  test('should throw error when missing variables in strict mode (default)', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = { name: 'John' }; // Missing 'age'

    expect(() => {
      setPromptVars({ promptText, variables, controller: mockLogger });
    }).toThrow('Prompt is missing required variables: age');
  });

  test('should leave missing variables as placeholders when strict=false', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = { name: 'John' }; // Missing 'age'

    const result = setPromptVars({ promptText, variables, controller: mockLogger, strict: false });
    expect(result).toBe('Hello John, you are {{age}} years old.');
  });

  test('should log warning when missing variables in non-strict mode', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = { name: 'John' }; // Missing 'age'

    const result = setPromptVars({
      promptText,
      variables,
      strict: false,
      controller: mockLogger
    });

    expect(result).toBe('Hello John, you are {{age}} years old.');
    expect(mockLogger.warning).toHaveBeenCalledWith('setPromptVars: Prompt is missing required variables: age');
  });

  test('should handle multiple missing variables', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old and live in {{city}}.';
    const variables = {}; // All variables missing

    const result = setPromptVars({ promptText, variables, controller: mockLogger, strict: false });
    expect(result).toBe('Hello {{name}}, you are {{age}} years old and live in {{city}}.');
  });

  test('should log warning for multiple missing variables', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old and live in {{city}}.';
    const variables = {}; // All variables missing

    const result = setPromptVars({
      promptText,
      variables,
      strict: false,
      controller: mockLogger
    });

    expect(result).toBe('Hello {{name}}, you are {{age}} years old and live in {{city}}.');
    expect(mockLogger.warning).toHaveBeenCalledWith(
      'setPromptVars: Prompt is missing required variables: name, age, city'
    );
  });

  test('should handle special regex characters in variable names', () => {
    const promptText = 'Hello {{user.name}}, you are {{user.age}} years old.';
    const variables = { 'user.name': 'John', 'user.age': 25 };

    const result = setPromptVars({ promptText, variables, controller: mockLogger });
    expect(result).toBe('Hello John, you are 25 years old.');
  });

  test('should use default controller when none provided', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = { name: 'John' }; // Missing 'age'

    // This should not throw and should use the default controller
    const result = setPromptVars({ promptText, variables, controller: mockLogger, strict: false });
    expect(result).toBe('Hello John, you are {{age}} years old.');
  });

  test('should handle empty variables object', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = {};

    expect(() => {
      setPromptVars({ promptText, variables, controller: mockLogger });
    }).toThrow('Prompt is missing required variables: name, age');
  });

  test('should handle empty variables object in non-strict mode', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = {};

    const result = setPromptVars({ promptText, variables, controller: mockLogger, strict: false });
    expect(result).toBe('Hello {{name}}, you are {{age}} years old.');
  });
});
