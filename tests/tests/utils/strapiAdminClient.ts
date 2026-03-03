/**
 * Strapi Admin Tools API client for E2E test data management.
 *
 * Authenticates with the Strapi admin panel and provides methods for
 * importing and deleting test data via the Admin Tools plugin endpoints.
 *
 * @example
 * ```ts
 * const client = new StrapiAdminClient();
 * await client.login();
 * await client.importData({ elections: [...], candidates: [...] });
 * await client.deleteData({ elections: 'test-', candidates: 'test-' });
 * await client.dispose();
 * ```
 */

import { request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

/**
 * Result of an import operation via Admin Tools `/import-data` endpoint.
 */
export interface ImportDataResult {
  type: 'success' | 'failure';
  created?: Record<string, number>;
  updated?: Record<string, number>;
  cause?: string;
}

/**
 * Result of a delete operation via Admin Tools `/delete-data` endpoint.
 */
export interface DeleteDataResult {
  type: 'success' | 'failure';
  deleted?: Record<string, number>;
  cause?: string;
}

/**
 * Result of a find operation via Admin Tools `/find-data` endpoint.
 */
export interface FindDataResult {
  type: 'success' | 'failure';
  data?: Array<Record<string, unknown>>;
  cause?: string;
}

/**
 * Client for the Strapi Admin Tools plugin API.
 *
 * All Admin Tools endpoints require admin panel authentication (not content API auth).
 * The client authenticates via `POST /admin/login` and uses the JWT token for subsequent requests.
 *
 * IMPORTANT: The Admin Tools data controller does `JSON.parse(ctx.request.body)`,
 * which means the request body must be sent as a stringified JSON string, not as
 * a pre-parsed object. This client handles that automatically.
 */
export class StrapiAdminClient {
  private baseUrl: string;
  private token: string | null = null;
  private requestContext: APIRequestContext | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? `http://localhost:${process.env.STRAPI_PORT ?? '1337'}`;
  }

  /**
   * Authenticate with the Strapi admin panel.
   *
   * @param email - Admin email (defaults to mock admin from dev seed data)
   * @param password - Admin password (defaults to mock admin password)
   * @throws Error if login fails (401 for bad credentials, 403 for insufficient permissions)
   */
  async login(email = 'mock.admin@openvaa.org', password = 'admin'): Promise<void> {
    this.requestContext = await request.newContext({
      baseURL: this.baseUrl
    });

    const response = await this.requestContext.post('/admin/login', {
      data: { email, password }
    });

    if (!response.ok()) {
      const status = response.status();
      const body = await response.text();
      if (status === 401) {
        throw new Error(
          `Admin login failed: Invalid credentials for ${email}. ` +
            'Ensure the admin user exists and the password is correct.'
        );
      }
      if (status === 403) {
        throw new Error(`Admin login forbidden: The admin user ${email} does not have sufficient permissions.`);
      }
      throw new Error(`Admin login failed with status ${status}: ${body}`);
    }

    const responseBody = await response.json();
    this.token = responseBody.data?.token;
    if (!this.token) {
      throw new Error(
        'No token in admin login response. ' + `Response shape: ${JSON.stringify(Object.keys(responseBody))}`
      );
    }
  }

  /**
   * Get authorization headers for authenticated requests.
   * @throws Error if not authenticated
   */
  private get headers(): Record<string, string> {
    if (!this.token) {
      throw new Error('Not authenticated. Call login() first.');
    }
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Import test data via Admin Tools `/import-data` endpoint.
   *
   * The data object keys should match importable collection names:
   * alliances, appCustomization, candidates, constituencies, constituencyGroups,
   * elections, feedbacks, nominations, parties, questionTypes, questionCategories, questions
   *
   * @param data - Object mapping collection names to arrays of records to import
   * @returns Import result with created/updated counts per collection
   * @throws Error if the request fails
   */
  async importData(data: Record<string, Array<unknown>>): Promise<ImportDataResult> {
    this.ensureAuthenticated();

    const response = await this.requestContext!.post('/openvaa-admin-tools/import-data', {
      headers: this.headers,
      data: JSON.stringify({ data })
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Import data failed with status ${response.status()}: ${body}`);
    }

    return response.json();
  }

  /**
   * Delete test data via Admin Tools `/delete-data` endpoint.
   *
   * Values are externalId prefixes -- all records with externalIds starting with
   * the given prefix will be deleted from each collection.
   *
   * @param data - Object mapping collection names to externalId prefixes
   * @returns Delete result with deleted counts per collection
   * @throws Error if the request fails
   */
  async deleteData(data: Record<string, string>): Promise<DeleteDataResult> {
    this.ensureAuthenticated();

    const response = await this.requestContext!.post('/openvaa-admin-tools/delete-data', {
      headers: this.headers,
      data: JSON.stringify({ data })
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Delete data failed with status ${response.status()}: ${body}`);
    }

    return response.json();
  }

  /**
   * Find data via Admin Tools `/find-data` endpoint.
   *
   * @param collection - The collection to search in
   * @param filters - Strapi-style filters object
   * @param populate - Optional populate configuration
   * @returns Find result with matching records
   * @throws Error if the request fails
   */
  async findData(
    collection: string,
    filters: Record<string, unknown>,
    populate?: Record<string, unknown> | Array<string>
  ): Promise<FindDataResult> {
    this.ensureAuthenticated();

    const response = await this.requestContext!.post('/openvaa-admin-tools/find-data', {
      headers: this.headers,
      data: JSON.stringify({ collection, filters, populate })
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Find data failed with status ${response.status()}: ${body}`);
    }

    return response.json();
  }

  /**
   * Dispose the underlying API request context.
   * Always call this when done to free resources.
   */
  async dispose(): Promise<void> {
    await this.requestContext?.dispose();
    this.requestContext = null;
    this.token = null;
  }

  /**
   * Ensure the client is authenticated before making API calls.
   * @throws Error if not authenticated
   */
  private ensureAuthenticated(): void {
    if (!this.token || !this.requestContext) {
      throw new Error('Not authenticated. Call login() first.');
    }
  }
}
