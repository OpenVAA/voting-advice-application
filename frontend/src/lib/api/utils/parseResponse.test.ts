import { describe, expect, test, vi } from 'vitest';
import { parseResponse, type ResponseParser } from './parseResponse';

describe('parseResponse', () => {
  test('should parse json response', async () => {
    const mockData = { key: 'value', number: 42 };
    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockData)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'json');
    expect(result).toEqual(mockData);
    expect(mockResponse.json).toHaveBeenCalledOnce();
  });

  test('should parse text response', async () => {
    const mockText = 'Hello, world!';
    const mockResponse = {
      text: vi.fn().mockResolvedValue(mockText)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'text');
    expect(result).toBe(mockText);
    expect(mockResponse.text).toHaveBeenCalledOnce();
  });

  test('should parse blob response', async () => {
    const mockBlob = new Blob(['test data'], { type: 'text/plain' });
    const mockResponse = {
      blob: vi.fn().mockResolvedValue(mockBlob)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'blob');
    expect(result).toBe(mockBlob);
    expect(mockResponse.blob).toHaveBeenCalledOnce();
  });

  test('should return raw response for none parser', () => {
    const mockResponse = {
      status: 200,
      ok: true,
      headers: new Headers()
    } as Response;

    const result = parseResponse(mockResponse, 'none');
    expect(result).toBe(mockResponse);
  });

  test('should handle json with nested objects', async () => {
    const mockData = {
      nested: {
        deep: {
          value: 'test'
        }
      },
      array: [1, 2, 3]
    };
    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockData)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'json');
    expect(result).toEqual(mockData);
  });

  test('should handle empty text response', async () => {
    const mockResponse = {
      text: vi.fn().mockResolvedValue('')
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'text');
    expect(result).toBe('');
  });

  test('should handle empty blob response', async () => {
    const emptyBlob = new Blob([]);
    const mockResponse = {
      blob: vi.fn().mockResolvedValue(emptyBlob)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'blob');
    expect(result).toBe(emptyBlob);
    expect((result as Blob).size).toBe(0);
  });

  test('should throw error for invalid parser', () => {
    const mockResponse = {} as Response;
    const invalidParser = 'invalid' as ResponseParser;

    expect(() => parseResponse(mockResponse, invalidParser)).toThrow('Invalid parse option: invalid');
  });

  test('should throw error for undefined parser', () => {
    const mockResponse = {} as Response;

    expect(() => parseResponse(mockResponse, undefined as ResponseParser)).toThrow('Invalid parse option: undefined');
  });
});
