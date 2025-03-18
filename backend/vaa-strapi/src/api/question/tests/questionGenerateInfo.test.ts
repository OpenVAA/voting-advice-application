import axios from 'axios';
import { beforeAll, describe, expect, it } from 'vitest';

// Configuration, expects a user with these credentials to be created
const STRAPI_URL = 'http://localhost:1337';
const ADMIN_CREDENTIALS = {
  identifier: process.env.DEV_EMAIL ?? 'admin@example.com',
  password: process.env.DEV_PASSWORD ?? 'admin1'
};

describe('Strapi Admin Role API Tests', () => {
  // Store the JWT token for use in all tests
  let jwt = '';

  // Authenticate before running tests
  beforeAll(async () => {
    try {
      const response = await axios.post(
        `${STRAPI_URL}/api/auth/local`,
        new URLSearchParams({
          identifier: ADMIN_CREDENTIALS.identifier,
          password: ADMIN_CREDENTIALS.password
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      jwt = response.data.jwt;
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

  it('should successfully call generateInfo endpoint for question 1', async () => {
    try {
      const response = await axios.post(
        `${STRAPI_URL}/api/questions/1/generateInfo`,
        {}, // Empty body as we're just testing access
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${jwt}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    } catch (error) {
      console.error('API call failed:', error.response?.data || error.message);
      throw error;
    }
  }, 20000);

  it('should fail when calling generateInfo without authentication', async () => {
    try {
      // This should fail because we're not providing authentication
      await axios.post(
        `${STRAPI_URL}/api/questions/1/generateInfo`,
        {},
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
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

  // Test with invalid question ID
  it('should handle invalid question ID appropriately', async () => {
    try {
      await axios.post(
        `${STRAPI_URL}/api/questions/999999/generateInfo`,
        {},
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${jwt}`
          }
        }
      );
      // If we get here without an error, it's unexpected
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBeGreaterThanOrEqual(400);
    }
  }, 20000);
});
