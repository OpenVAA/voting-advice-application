/**
 * Ensure essential dev/test data exists in development:
 * 1. A Strapi admin panel user (so the admin panel is accessible)
 * 2. A candidate users-permissions user (so E2E tests can log in)
 *
 * This is called on every bootstrap and is a no-op in production.
 * Both operations are idempotent -- they skip creation if the user already exists.
 *
 * Credentials are read from env vars with sensible defaults for local dev:
 * - DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD
 * - DEV_CANDIDATE_EMAIL / DEV_CANDIDATE_PASSWORD
 */
export async function ensureDevData() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  await ensureAdmin();
  await ensureCandidate();
}

/**
 * Ensure a Strapi admin panel user exists.
 */
async function ensureAdmin() {
  const hasAdmin = await strapi.service('admin::user').exists();
  const superAdminRole = await strapi.service('admin::role').getSuperAdmin();

  if (hasAdmin || !superAdminRole) {
    return;
  }

  const email = process.env.DEV_ADMIN_EMAIL ?? 'mock.admin@openvaa.org';
  const password = process.env.DEV_ADMIN_PASSWORD ?? 'admin';

  const params = {
    username: 'admin',
    password,
    firstname: 'Admin',
    lastname: 'Admin',
    email,
    blocked: false,
    isActive: true,
    registrationToken: null,
    roles: superAdminRole ? [superAdminRole.id] : []
  };

  await strapi.service('admin::user').create(params);
  console.info('Created dev admin user:', email);
}

/**
 * Ensure a candidate users-permissions user exists for E2E testing.
 *
 * Finds or creates a candidate content-type entry with externalId 'test-candidate-alpha'
 * and links it to a users-permissions user so the candidate app login works.
 */
async function ensureCandidate() {
  const email = process.env.DEV_CANDIDATE_EMAIL ?? 'mock.candidate.2@openvaa.org';
  const password = process.env.DEV_CANDIDATE_PASSWORD ?? 'Password1!';

  // Check if users-permissions user already exists
  const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
    where: { email }
  });

  if (existingUser) {
    return;
  }

  // Find or create the candidate content-type entry
  const externalId = 'test-candidate-alpha';
  let candidate = await strapi.documents('api::candidate.candidate').findFirst({
    filters: { externalId }
  });

  if (!candidate) {
    candidate = await strapi.documents('api::candidate.candidate').create({
      data: {
        firstName: 'Test Candidate',
        lastName: 'Alpha',
        email,
        externalId,
        termsOfUseAccepted: new Date()
      }
    });
    console.info('Created dev candidate entry:', externalId);
  }

  // Get the authenticated role
  const authenticated = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' }
  });

  if (!authenticated) {
    console.warn('Authenticated role not found, skipping dev candidate user creation');
    return;
  }

  // Create the users-permissions user linked to the candidate
  await strapi.documents('plugin::users-permissions.user').create({
    data: {
      username: email,
      email,
      password,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: authenticated.id,
      candidate: candidate.documentId
    }
  });

  // Clear the registration key so the candidate is considered registered
  await strapi.documents('api::candidate.candidate').update({
    documentId: candidate.documentId,
    data: {
      registrationKey: null
    }
  });

  console.info('Created dev candidate user:', email);
}
