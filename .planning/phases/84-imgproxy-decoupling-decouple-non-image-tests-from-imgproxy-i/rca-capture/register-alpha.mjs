/**
 * Phase 84 RCA — register test-candidate-alpha auth user.
 *
 * Replicates the data.setup.ts forceRegister call without running the
 * full Playwright setup project (which would teardown immediately). Uses
 * Supabase admin API to create the auth user, then links it to the
 * existing candidate row.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const EMAIL = 'mock.candidate.2@openvaa.org';
const PASSWORD = 'Password1!';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: existing } = await admin.auth.admin.listUsers();
const found = existing.users.find((u) => u.email === EMAIL);
if (found) {
  console.error(`auth user already exists: ${found.id}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true
  });
  if (error) {
    console.error('createUser failed:', error);
    process.exit(1);
  }
  console.error(`created auth user: ${data.user.id}`);
}

// Look up auth user id
const { data: usersList } = await admin.auth.admin.listUsers();
const authUser = usersList.users.find((u) => u.email === EMAIL);
if (!authUser) {
  console.error('auth user lookup failed');
  process.exit(1);
}

// Link to candidate via update on candidates table
const { data: candidate, error: cError } = await admin
  .from('candidates')
  .select('id, auth_user_id')
  .eq('external_id', 'test-candidate-alpha')
  .single();
if (cError) {
  console.error('candidate lookup failed:', cError);
  process.exit(1);
}

if (candidate.auth_user_id !== authUser.id) {
  // Insert user_role first (required for RLS)
  const { error: roleError } = await admin
    .from('user_roles')
    .upsert({ user_id: authUser.id, role: 'candidate' }, { onConflict: 'user_id,role' });
  if (roleError) console.error('user_roles upsert failed (may already exist):', roleError);

  const { error: linkError } = await admin
    .from('candidates')
    .update({ auth_user_id: authUser.id })
    .eq('id', candidate.id);
  if (linkError) {
    console.error('link failed:', linkError);
    process.exit(1);
  }
  console.error(`linked auth_user_id ${authUser.id} to candidate ${candidate.id}`);
} else {
  console.error('candidate already linked');
}

console.log(JSON.stringify({ email: EMAIL, authUserId: authUser.id, candidateId: candidate.id }, null, 2));
