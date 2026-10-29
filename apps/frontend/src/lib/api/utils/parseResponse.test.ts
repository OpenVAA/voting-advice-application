import { describe, expect, test, vi } from 'vitest';
import { isRefusedResponse } from './isRefusedResponse';
import { parseResponse } from './parseResponse';
import type { ResponseParser } from './parseResponse';

describe('parseResponse', () => {
  test('should parse json response', async () => {
    const mockData = { key: 'value', number: 42 };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockData)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'json');
    expect(result).toEqual(mockData);
    expect(mockResponse.json).toHaveBeenCalledOnce();
  });

  test('should parse text response', async () => {
    const mockText = 'Hello, world!';
    const mockResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(mockText)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'text');
    expect(result).toBe(mockText);
    expect(mockResponse.text).toHaveBeenCalledOnce();
  });

  test('should parse blob response', async () => {
    const mockBlob = new Blob(['test data'], { type: 'text/plain' });
    const mockResponse = {
      ok: true,
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
      ok: true,
      json: vi.fn().mockResolvedValue(mockData)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'json');
    expect(result).toEqual(mockData);
  });

  test('should handle empty text response', async () => {
    const mockResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue('')
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'text');
    expect(result).toBe('');
  });

  test('should handle empty blob response', async () => {
    const emptyBlob = new Blob([]);
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(emptyBlob)
    } as unknown as Response;

    const result = await parseResponse(mockResponse, 'blob');
    expect(result).toBe(emptyBlob);
    expect((result as Blob).size).toBe(0);
  });

  test('should throw error for invalid parser', () => {
    const mockResponse = { ok: true } as Response;
    const invalidParser = 'invalid' as ResponseParser;

    expect(() => parseResponse(mockResponse, invalidParser)).toThrow('Invalid parse option: invalid');
  });

  test('should throw error for undefined parser', () => {
    const mockResponse = { ok: true } as Response;

    expect(() => parseResponse(mockResponse, undefined as ResponseParser)).toThrow('Invalid parse option: undefined');
  });

  /**
   * The helper's OWN refusal contract.
   *
   * These cases call `parseResponse` directly, with no adapter anywhere in the frame, because the property under test is the helper's and not its caller's: a caller that happens to check the response first makes the class closed by an arrangement, and an arrangement is reopened by the next caller who does not know about it.
   */
  describe('refusing a response the server refused', () => {
    test('throws instead of parsing a refused json response, and never calls the parser', () => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ error: 'Forbidden' })
      } as unknown as Response;

      expect(() => parseResponse(mockResponse, 'json')).toThrow(/refused/i);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    test('throws instead of parsing a refused text response, and never calls the parser', () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error')
      } as unknown as Response;

      expect(() => parseResponse(mockResponse, 'text')).toThrow(/refused/i);
      expect(mockResponse.text).not.toHaveBeenCalled();
    });

    test('throws instead of parsing a refused blob response, and never calls the parser', () => {
      const mockResponse = {
        ok: false,
        status: 404,
        blob: vi.fn().mockResolvedValue(new Blob([]))
      } as unknown as Response;

      expect(() => parseResponse(mockResponse, 'blob')).toThrow(/refused/i);
      expect(mockResponse.blob).not.toHaveBeenCalled();
    });

    test('throws rather than handing back a refused response for the none parser', () => {
      const mockResponse = { ok: false, status: 401 } as Response;

      expect(() => parseResponse(mockResponse, 'none')).toThrow(/refused/i);
    });

    test('the refusal names the status, so the caller can tell one refusal from another', () => {
      const mockResponse = { ok: false, status: 409 } as Response;

      expect(() => parseResponse(mockResponse, 'json')).toThrow(/409/);
    });

    test('refuses before it validates the parser, so no refused response can reach the switch', () => {
      const mockResponse = { ok: false, status: 403 } as Response;

      expect(() => parseResponse(mockResponse, 'invalid' as ResponseParser)).toThrow(/refused/i);
      expect(() => parseResponse(mockResponse, 'invalid' as ResponseParser)).not.toThrow(
        'Invalid parse option: invalid'
      );
    });

    /**
     * THE CONSISTENCY PIN. The helper's notion of "refused" is the adapter's notion of "refused", because both are the same exported predicate. Two notions inside one adapter would reopen the hole at whichever of them is the laxer.
     */
    test.each([
      { label: '200 OK', response: { ok: true, status: 200 }, refused: false },
      { label: '204 No Content', response: { ok: true, status: 204 }, refused: false },
      { label: '401 Unauthorized', response: { ok: false, status: 401 }, refused: true },
      { label: '403 Forbidden', response: { ok: false, status: 403 }, refused: true },
      { label: '500 Internal Server Error', response: { ok: false, status: 500 }, refused: true }
    ])('parseResponse refuses $label exactly when the shared predicate does', ({ response, refused }) => {
      const mockResponse = { ...response, json: vi.fn().mockResolvedValue({}) } as unknown as Response;

      expect(isRefusedResponse(mockResponse)).toBe(refused);
      if (refused) {
        expect(() => parseResponse(mockResponse, 'json')).toThrow(/refused/i);
      } else {
        expect(() => parseResponse(mockResponse, 'json')).not.toThrow();
      }
    });
  });
});
