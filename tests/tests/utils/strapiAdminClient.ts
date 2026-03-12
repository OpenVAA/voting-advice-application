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
   * Update app settings via the Strapi content-manager admin API.
   *
   * Uses the single-type content-manager endpoint to update app-setting fields.
   * IMPORTANT: The content-manager admin API expects parsed JSON (not stringified),
   * unlike the Admin Tools controllers which do `JSON.parse(ctx.request.body)`.
   *
   * @param data - Object with app-setting fields to update
   * @throws Error if the request fails
   */
  async updateAppSettings(data: Record<string, unknown>): Promise<void> {
    this.ensureAuthenticated();

    const response = await this.requestContext!.put(
      '/content-manager/single-types/api::app-setting.app-setting',
      {
        headers: this.headers,
        data
      }
    );

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Update app settings failed with status ${response.status()}: ${body}`);
    }
  }

  /**
   * Send an email to a candidate via Admin Tools `/send-email` endpoint.
   *
   * @param params - Email parameters including candidateId, subject, content, and optional requireRegistrationKey flag
   * @throws Error if the request fails
   */
  async sendEmail(params: {
    candidateId: string;
    subject: string;
    content: string;
    requireRegistrationKey?: boolean;
  }): Promise<void> {
    this.ensureAuthenticated();

    const response = await this.requestContext!.post('/openvaa-admin-tools/send-email', {
      headers: this.headers,
      data: JSON.stringify(params)
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Send email failed with status ${response.status()}: ${body}`);
    }
  }

  /**
   * Trigger a forgot-password email for a candidate via Admin Tools.
   *
   * NOTE: This method does NOT return the resetUrl. Per user decision, the reset
   * link must be read from the SES email (via emailHelper), not from the API response.
   * This method only triggers the email sending.
   *
   * @param params - Object containing the candidate's documentId
   * @throws Error if the request fails
   */
  async sendForgotPassword(params: { documentId: string }): Promise<void> {
    this.ensureAuthenticated();

    const response = await this.requestContext!.post(
      '/openvaa-admin-tools/candidate-auth/forgot-password',
      {
        headers: this.headers,
        data: JSON.stringify(params)
      }
    );

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Send forgot password failed with status ${response.status()}: ${body}`);
    }
  }

  /**
   * Force-set a candidate's password via Admin Tools.
   *
   * Used to restore candidate passwords after password change/reset tests.
   *
   * @param params - Object containing the candidate's documentId and new password
   * @throws Error if the request fails
   */
  async setPassword(params: { documentId: string; password: string }): Promise<void> {
    this.ensureAuthenticated();

    const response = await this.requestContext!.post(
      '/openvaa-admin-tools/candidate-auth/set-password',
      {
        headers: this.headers,
        data: JSON.stringify(params)
      }
    );

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Set password failed with status ${response.status()}: ${body}`);
    }
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
