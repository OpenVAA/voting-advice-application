import { beforeEach, describe, expect, test, vi } from 'vitest';
import { UniversalAdapter } from './universalAdapter';
import { isRefusedResponse } from '../utils/isRefusedResponse';
import { parseResponse } from '../utils/parseResponse';
import type * as ParseResponseModule from '../utils/parseResponse';

// Only mock the constants - everything else should use real implementations
vi.mock('$lib/utils/constants', () => ({
  constants: {
    PUBLIC_CACHE_ENABLED: false
  }
}));

// The parser is SPIED, not replaced: every case in this file runs the real implementation. The spy exists so the seam pin below can assert the parser was never INVOKED for a refused response, which is a different property from "an error was produced" and is the one that fails if the response check is deleted, moved after the parse, or made conditional.
vi.mock('../utils/parseResponse', async (importOriginal) => {
  const actual = await importOriginal<typeof ParseResponseModule>();
  return { ...actual, parseResponse: vi.fn(actual.parseResponse) };
});

// Concrete implementation for testing
class TestAdapter extends UniversalAdapter {}

describe('UniversalAdapter', () => {
  let adapter: TestAdapter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    adapter = new TestAdapter({ fetch: mockFetch });
    vi.mocked(parseResponse).mockClear();
  });

  describe('construction', () => {
    test('each adapter makes its requests through the fetch it was constructed with', async () => {
      const mockResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({}) } as unknown as Response;
      const otherFetch = vi.fn().mockResolvedValue(mockResponse);
      mockFetch.mockResolvedValue(mockResponse);
      const other = new TestAdapter({ fetch: otherFetch });

      await adapter.fetch('http://openvaa.org/a');
      await other.fetch('http://openvaa.org/b');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('http://openvaa.org/a', {});
      expect(otherFetch).toHaveBeenCalledTimes(1);
      expect(otherFetch).toHaveBeenCalledWith('http://openvaa.org/b', {});
    });
  });

  describe('fetch (without caching)', () => {
    test('should make successful fetch request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'test' })
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.fetch('http://openvaa.org/api');

      expect(mockFetch).toHaveBeenCalledWith('http://openvaa.org/api', {});
      expect(result).toBe(mockResponse);
    });

    test('should add auth token to headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await adapter.fetch('http://openvaa.org/api', {}, { authToken: 'test-token' });

      const callArgs = mockFetch.mock.calls[0];
      const headers = new Headers(callArgs[1]?.headers);
      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });

    test('should throw error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ message: 'Not found' })
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(adapter.fetch('http://openvaa.org/api')).rejects.toThrow(
        /Error with UniversalAdapter\.fetch when parsing response.*404.*Not found/
      );
    });

    test('should handle fetch network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(adapter.fetch('http://openvaa.org/api')).rejects.toThrow(
        /Error with UniversalAdapter\.fetch when fetching.*Network error/
      );
    });

    test('should handle response without error message', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(adapter.fetch('http://openvaa.org/api')).rejects.toThrow(
        /Could not parse error message from Response/
      );
    });

    test('should handle non-JSON error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(adapter.fetch('http://openvaa.org/api')).rejects.toThrow(
        /Could not parse error message from Response/
      );
    });
  });

  describe('fetch (with caching enabled)', () => {
    let originalCacheEnabled: boolean;
    let adapterWithCache: TestAdapter;
    let mockFetchForCache: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      // Re-mock constants with cache enabled for this suite
      const constants = await import('$lib/utils/constants');
      originalCacheEnabled = constants.constants.PUBLIC_CACHE_ENABLED;
      vi.mocked(constants.constants).PUBLIC_CACHE_ENABLED = true;

      mockFetchForCache = vi.fn();
      adapterWithCache = new TestAdapter({ fetch: mockFetchForCache });
    });

    afterEach(() => {
      // Restore original value
      import('$lib/utils/constants').then((constants) => {
        vi.mocked(constants.constants).PUBLIC_CACHE_ENABLED = originalCacheEnabled;
      });
    });

    test('should cache GET requests when conditions are met', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'cached' })
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api');

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toContain('/api/cache?resource=');
      expect(url).toContain(encodeURIComponent('http://openvaa.org/api'));
    });

    test('should cache GET requests with explicit GET method', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', { method: 'GET' });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toContain('/api/cache?resource=');
    });

    test('should NOT cache when disableCache is true', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', {}, { disableCache: true });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(url).not.toContain('/api/cache');
    });

    test('should NOT cache when Authorization header is present', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', {
        headers: { Authorization: 'Bearer token' }
      });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(url).not.toContain('/api/cache');
    });

    test('should NOT cache when authToken is provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', {}, { authToken: 'my-token' });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(url).not.toContain('/api/cache');
    });

    test('should NOT cache POST requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', { method: 'POST' });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(url).not.toContain('/api/cache');
    });

    test('should NOT cache PUT requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', { method: 'PUT' });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(url).not.toContain('/api/cache');
    });

    test('should NOT cache DELETE requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', { method: 'DELETE' });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(url).not.toContain('/api/cache');
    });

    test('should NOT cache PATCH requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetchForCache.mockResolvedValue(mockResponse);

      await adapterWithCache.fetch('http://openvaa.org/api', { method: 'PATCH' });

      const [url] = mockFetchForCache.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(url).not.toContain('/api/cache');
    });
  });

  describe('get', () => {
    test('should make GET request with default json parser', async () => {
      const mockData = { result: 'success' };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData)
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.get({ url: 'http://openvaa.org/api' });

      expect(mockFetch).toHaveBeenCalled();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api');
      expect(init).toEqual({ method: 'GET' });
      expect(result).toEqual(mockData);
    });

    test('should make GET request with text parser', async () => {
      const mockText = 'plain text response';
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(mockText)
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.get({ url: 'http://openvaa.org/api', parser: 'text' });

      expect(result).toBe(mockText);
    });

    test('should make GET request with blob parser', async () => {
      const mockBlob = new Blob(['test']);
      const mockResponse = {
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob)
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.get({ url: 'http://openvaa.org/api', parser: 'blob' });

      expect(result).toBe(mockBlob);
    });

    test('should make GET request with none parser', async () => {
      const mockResponse = {
        ok: true,
        status: 200
      } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.get({ url: 'http://openvaa.org/api', parser: 'none' });

      expect(result).toBe(mockResponse);
    });

    test('should append query parameters', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await adapter.get({
        url: 'http://openvaa.org/api',
        params: { foo: 'bar', baz: 123 }
      });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('foo=bar');
      expect(callUrl).toContain('baz=123');
    });

    test('should pass auth token to fetch', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await adapter.get({
        url: 'http://openvaa.org/api',
        authToken: 'my-token'
      });

      const callArgs = mockFetch.mock.calls[0];
      const headers = new Headers(callArgs[1]?.headers);
      expect(headers.get('Authorization')).toBe('Bearer my-token');
    });

    test('should pass custom init options', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await adapter.get({
        url: 'http://openvaa.org/api',
        init: { headers: { 'X-Custom': 'value' } }
      });

      const callInit = mockFetch.mock.calls[0][1];
      expect(callInit.headers).toBeDefined();
    });
  });

  describe('delete', () => {
    test('should make DELETE request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ deleted: true })
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.delete({ url: 'http://openvaa.org/api/1' });

      expect(mockFetch).toHaveBeenCalled();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://openvaa.org/api/1');
      expect(init).toEqual({ method: 'DELETE' });
      expect(result).toEqual({ deleted: true });
    });

    test('should make DELETE request with custom parser', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue('Deleted')
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.delete({
        url: 'http://openvaa.org/api/1',
        parser: 'text'
      });

      expect(result).toBe('Deleted');
    });
  });

  describe('post', () => {
    test('should make POST request with json body', async () => {
      const mockData = { created: true };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData)
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const body = { name: 'test', value: 123 };
      const result = await adapter.post({
        url: 'http://openvaa.org/api',
        body
      });

      const callInit = mockFetch.mock.calls[0][1];
      expect(callInit.method).toBe('POST');
      expect(callInit.body).toBe(JSON.stringify(body));
      expect(new Headers(callInit.headers).get('Content-Type')).toBe('application/json');
      expect(result).toEqual(mockData);
    });

    test('should make POST request without body', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await adapter.post({ url: 'http://openvaa.org/api' });

      const callInit = mockFetch.mock.calls[0][1];
      expect(callInit.method).toBe('POST');
      expect(callInit.body).toBeUndefined();
    });

    test('should make POST request with text parser', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue('Created')
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.post({
        url: 'http://openvaa.org/api',
        body: { data: 'test' },
        parser: 'text'
      });

      expect(result).toBe('Created');
    });

    test('should throw error when both body and init.body are provided', async () => {
      await expect(
        adapter.post({
          url: 'http://openvaa.org/api',
          body: { data: 'test' },
          init: { body: 'duplicate' }
        })
      ).rejects.toThrow('Cannot pass both body and init.body');
    });

    test('should throw error for non-serializable body', async () => {
      const formData = new FormData();
      await expect(
        adapter.post({
          url: 'http://openvaa.org/api',
          body: formData as unknown as JSONData
        })
      ).rejects.toThrow('Do not pass non-serializable data to the body');
    });

    test('should handle nested objects in body', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const body = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3]
      };

      await adapter.post({ url: 'http://openvaa.org/api', body });

      const callInit = mockFetch.mock.calls[0][1];
      expect(callInit.body).toBe(JSON.stringify(body));
    });

    test('should pass custom headers', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await adapter.post({
        url: 'http://openvaa.org/api',
        body: { test: 'data' },
        init: { headers: { 'X-Custom': 'header' } }
      });

      const callInit = mockFetch.mock.calls[0][1];
      expect(callInit.headers).toBeDefined();
    });
  });

  describe('put', () => {
    test('should make PUT request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ updated: true })
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const body = { name: 'updated' };
      const result = await adapter.put({
        url: 'http://openvaa.org/api/1',
        body
      });

      const callInit = mockFetch.mock.calls[0][1];
      expect(callInit.method).toBe('PUT');
      expect(callInit.body).toBe(JSON.stringify(body));
      expect(result).toEqual({ updated: true });
    });

    test('should make PUT request with custom parser', async () => {
      const mockBlob = new Blob(['updated']);
      const mockResponse = {
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob)
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await adapter.put({
        url: 'http://openvaa.org/api/1',
        body: { data: 'test' },
        parser: 'blob'
      });

      expect(result).toBe(mockBlob);
    });
  });

  /**
   * THE SEAM PIN.
   *
   * `should throw error when response is not ok`, above, asserts that a refused response produces an error. It does NOT assert that nothing was parsed, and those are different properties: a check moved to after the parse still produces the error while having handed the refusal's body to a parser first. These cases assert the second property, at the parser, for every verb.
   */
  describe('the refusal seam', () => {
    const VERBS = ['get', 'delete', 'post', 'put'] as const;

    /**
     * Drive one adapter verb against whatever the mocked fetch is currently returning.
     * @param verb - The verb to drive.
     * @returns The verb's promise, unawaited.
     */
    function drive(verb: (typeof VERBS)[number]): Promise<unknown> {
      const args = { url: 'http://openvaa.org/api', parser: 'text' } as const;
      switch (verb) {
        case 'get':
          return adapter.get(args);
        case 'delete':
          return adapter.delete(args);
        case 'post':
          return adapter.post({ ...args, body: { data: 'test' } });
        case 'put':
          return adapter.put({ ...args, body: { data: 'test' } });
      }
    }

    test.each(VERBS)('%s: a refused response never reaches the parser', async (verb) => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: 'Forbidden' }),
        text: vi.fn().mockResolvedValue('Forbidden')
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(drive(verb)).rejects.toThrow(/403/);

      // The parsing helper was never invoked at all — not invoked and then thrown past.
      expect(parseResponse).not.toHaveBeenCalled();
      // And the response's own parser was never touched by anything else on the path either.
      expect(mockResponse.text).not.toHaveBeenCalled();
    });

    test.each(VERBS)('%s: a successful response DOES reach the parser', async (verb) => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('parsed body')
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(drive(verb)).resolves.toBe('parsed body');

      // The positive control for the case above: the assertion CAN observe an invocation, so a zero there is the check doing its work rather than the spy being wired to nothing.
      expect(parseResponse).toHaveBeenCalledTimes(1);
      expect(mockResponse.text).toHaveBeenCalledOnce();
    });

    test.each([
      { label: '200 OK', response: { ok: true, status: 200 }, refused: false },
      { label: '204 No Content', response: { ok: true, status: 204 }, refused: false },
      { label: '401 Unauthorized', response: { ok: false, status: 401 }, refused: true },
      { label: '403 Forbidden', response: { ok: false, status: 403 }, refused: true },
      { label: '500 Internal Server Error', response: { ok: false, status: 500 }, refused: true }
    ])('fetch refuses $label exactly when the shared predicate does', async ({ response, refused }) => {
      const mockResponse = {
        ...response,
        json: vi.fn().mockResolvedValue({ message: 'refused' })
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      expect(isRefusedResponse(mockResponse)).toBe(refused);
      if (refused) {
        await expect(adapter.fetch('http://openvaa.org/api')).rejects.toThrow(/UniversalAdapter\.fetch/);
      } else {
        await expect(adapter.fetch('http://openvaa.org/api')).resolves.toBe(mockResponse);
      }
    });

    test('two interleaved calls, one refused and one successful, each get their own outcome', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ id: 'the successful call’s own body' })
      } as unknown as Response;
      const refusedResponse = {
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: 'Forbidden' })
      } as unknown as Response;

      // The only ordering mechanism here is a promise resolved from the outside: no timer, so the interleaving is program control flow rather than a race that happened to be won.
      let openRefused!: () => void;
      const refusedGate = new Promise<void>((resolve) => {
        openRefused = resolve;
      });

      mockFetch.mockImplementation(async (url: string) => {
        if (String(url).includes('refused')) {
          await refusedGate;
          return refusedResponse;
        }
        return okResponse;
      });

      const settled: Array<string> = [];
      const refused = adapter.get({ url: 'http://openvaa.org/refused' }).then(
        (value) => settled.push(`refused resolved with ${JSON.stringify(value)}`),
        (error: Error) => settled.push(`refused rejected: ${error.message}`)
      );

      // The successful call runs to completion INSIDE the refused call's window.
      const okValue = await adapter.get({ url: 'http://openvaa.org/ok' });
      expect(okValue).toEqual({ id: 'the successful call’s own body' });
      // The refused call cannot have settled: nothing has opened its gate.
      expect(settled).toEqual([]);

      openRefused();
      await refused;

      expect(settled).toEqual([expect.stringContaining('refused rejected')]);
      expect(settled[0]).toContain('403');
      // The successful call's value is still its own, unaffected by the refusal that settled after it.
      expect(okValue).toEqual({ id: 'the successful call’s own body' });
    });
  });
});
