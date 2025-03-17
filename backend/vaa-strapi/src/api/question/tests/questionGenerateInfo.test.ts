import axios from 'axios';
import { beforeAll, describe, expect, it } from 'vitest';

// Configuration, expects a user with these credentials to be created
const STRAPI_URL = 'http://localhost:1337';
const ADMIN_CREDENTIALS = {
  identifier: process.env.DEV_EMAIL ?? 'admin@example.com',
  password: process.env.DEV_PASSWORD ?? 'admin1'
};

describe('Strapi Admin Role API Tests', async () => {
  // Store the JWT token for use in all tests
  let jwt = '';
  let testIds: Array<number>;

  // Authenticate before running tests
  beforeAll(async () => {
    try {
      const response = await axios.post(
        `${STRAPI_URL}/api/auth/local`,
        {
          identifier: ADMIN_CREDENTIALS.identifier,
          password: ADMIN_CREDENTIALS.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      jwt = response.data.jwt;

      // Random questions from database to test questionInfoGeneration
      const questionsResponse = await axios.get(`${STRAPI_URL}/api/questions`, {
        params: {
          'pagination[pageSize]': 2,
          'pagination[page]': 1,
          sort: 'id:asc' // Optional: sort by ID to ensure consistent results
        },
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      const questions = (questionsResponse.data.data || []) as Array<{ id: number }>;
      testIds = questions.map((question) => question.id).slice(0, 2);
    } catch (error) {
      console.error('Authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate: ' + (error.response?.data?.error?.message || error.message));
    }
  });

  it('should authenticate successfully and return a JWT token', () => {
    // Check if the JWT was set in the beforeAll hook
    expect(jwt).toBeTruthy();
    expect(typeof jwt).toBe('string');
    expect(jwt.split('.').length).toBe(3); // Simple JWT structure check
  });

  it('should successfully call generateInfo endpoint for a question', async () => {
    try {
      const response = await axios.post(
        `${STRAPI_URL}/api/questions/generateInfo`,
        {
          data: {
            ids: testIds.slice(0, 1)
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('type', 'success');
    } catch (error) {
      console.error('API call failed:', error.response?.data || error.message);
      throw error;
    }
  }, 0);

  it('should successfully call generateInfo endpoint for a list of questions', async () => {
    try {
      const response = await axios.post(
        `${STRAPI_URL}/api/questions/generateInfo`,
        {
          data: {
            ids: testIds
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('type', 'success');
    } catch (error) {
      console.error('API call failed:', error.response?.data || error.message);
      throw error;
    }
  }, 0);

  /**
    * This test takes a long time to run and generates info for all existing questions so only
    *run it when needed.
  it('should successfully call generateInfo endpoint for all questions', async () => {
    try {
      const response = await axios.post(
        `${STRAPI_URL}/api/questions/generateInfo`,
        {
          data: {
            ids: [] // empty ids generate info for all questions
          }
        }, 
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('type', 'success');
    } catch (error) {
      console.error('API call failed:', error.response?.data || error.message);
      throw error;
    }
  }, 0);
  */

  it('should fail when calling generateInfo without authentication', async () => {
    try {
      // This should fail because we're not providing authentication
      await axios.post(
        `${STRAPI_URL}/api/questions/generateInfo`,
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // If we reach this point, the test should fail
      // because the request should have thrown an error
      expect(true).toBe(false); // This will fail if the request succeeds
    } catch (error) {
      // We expect an error with 401 or 403 status
      expect(error.response.status).toBeGreaterThanOrEqual(401);
      expect(error.response.status).toBeLessThanOrEqual(403);
    }
  });
});
