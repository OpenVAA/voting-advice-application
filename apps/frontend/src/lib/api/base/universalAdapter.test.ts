import { beforeEach, describe, expect, test, vi } from 'vitest';
import { UniversalAdapter } from './universalAdapter';

// Only mock the constants - everything else should use real implementations
vi.mock('$lib/utils/constants', () => ({
  constants: {
    PUBLIC_CACHE_ENABLED: false
  }
}));

// Concrete implementation for testing
class TestAdapter extends UniversalAdapter {}

describe('UniversalAdapter', () => {
  let adapter: TestAdapter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    adapter = new TestAdapter();
    mockFetch = vi.fn();
  });

  describe('init', () => {
    test('should initialize with fetch function', () => {
      const result = adapter.init({ fetch: mockFetch });
      expect(result).toBe(adapter);
    });

    test('should throw error if fetch is used before init', async () => {
      await expect(adapter.fetch('http://openvaa.org')).rejects.toThrow();
    });
  });

  describe('fetch (without caching)', () => {
    beforeEach(() => {
      adapter.init({ fetch: mockFetch });
    });

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

      adapterWithCache = new TestAdapter();
      mockFetchForCache = vi.fn();
      adapterWithCache.init({ fetch: mockFetchForCache });
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
    beforeEach(() => {
      adapter.init({ fetch: mockFetch });
    });

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
    beforeEach(() => {
      adapter.init({ fetch: mockFetch });
    });

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
    beforeEach(() => {
      adapter.init({ fetch: mockFetch });
    });

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
    beforeEach(() => {
      adapter.init({ fetch: mockFetch });
    });

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
});
