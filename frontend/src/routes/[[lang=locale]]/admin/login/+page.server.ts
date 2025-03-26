/**
 * # Admin App login server action
 *
 * On successful login saves the jwt token into the cookie.
 */

import { fail, redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';

export const actions = {
  default: async ({ cookies, request, locals, fetch }: any) => {
    const dataWriter = await dataWriterPromise;
    dataWriter.init({ fetch });

    const data = await request.formData();
    const username = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    // First try to login and get the auth token
    const loginResponse = await dataWriter.login({ username, password }).catch((e) => {
      logDebugError(`Error during login attempt: ${e?.message ?? 'No error message'}`);
      return undefined;
    });

    if (!loginResponse?.authToken) {
      return fail(400);
    }

    const { authToken } = loginResponse;

    // Then get the user data to check the role
    const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
      logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
      return undefined;
    });

    if (!userData) {
      return fail(500);
    }

    // Debug log the entire user data to see its structure
    try {
      console.log('User Data:', JSON.stringify(userData, null, 2));
    } catch (e) {
      console.log('Error stringifying user data:', e);
    }

    // Always set the token in the cookie
    cookies.set('token', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    // Set the language if available
    const language = userData.settings?.language;
    if (language) {
      locals.currentLocale = language;
    }

    // Check if the user has admin role
    // In Strapi, a user can have multiple roles and the structure can vary
    let isAdmin = false;
    try {
      // Extract the complete role information for debugging
      console.log('Checking roles...');

      if (userData.role) {
        console.log('Role property found:', userData.role);
      }

      if (userData.roles) {
        console.log('Roles array found:', userData.roles);
      }

      // Try all possible ways the role information might be structured
      // 1. Check if there's a direct 'role' property with a 'type' field
      if (userData.role?.type === 'admin') {
        console.log('Found admin role via userData.role.type');
        isAdmin = true;
      }
      // 2. Check if role is just a string
      else if (userData.role === 'admin') {
        console.log('Found admin role via userData.role string');
        isAdmin = true;
      }
      // 3. Check if there are multiple roles in an array
      else if (Array.isArray(userData.roles)) {
        const foundAdmin = userData.roles.some((role) => {
          const isAdminRole = role === 'admin' || role.type === 'admin' || role.name === 'admin';
          if (isAdminRole) {
            console.log('Found admin role in roles array');
          }
          return isAdminRole;
        });
        isAdmin = foundAdmin;
      }
      // 4. If there's a roleType property
      else if (userData.roleType === 'admin') {
        console.log('Found admin role via userData.roleType');
        isAdmin = true;
      }
      // 5. Last resort, check any properties that might contain role info
      else {
        const userAny = userData as any;

        if (userAny.admin === true) {
          console.log('Found admin=true flag');
          isAdmin = true;
        }

        if (userAny.isAdmin === true) {
          console.log('Found isAdmin=true flag');
          isAdmin = true;
        }

        // Check if the user has the correct permissions regardless of role name
        if (userAny.permissions && Array.isArray(userAny.permissions)) {
          const hasAdminPermissions = userAny.permissions.some(
            (p: any) => p.action?.includes('admin') || p.subject?.includes('admin')
          );
          if (hasAdminPermissions) {
            console.log('Found admin permissions');
            isAdmin = true;
          }
        }
      }

      console.log('Is admin?', isAdmin);
    } catch (e) {
      logDebugError(`Error checking admin role: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (!isAdmin) {
      // If not an admin, redirect to unauthorized page
      redirect(303, `/${locals.currentLocale}/admin/unauthorized`);
    }

    // If admin, redirect to dashboard
    redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : `/${locals.currentLocale}/admin/dashboard`);
  }
};
