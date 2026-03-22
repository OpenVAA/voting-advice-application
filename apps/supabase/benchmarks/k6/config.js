/**
 * Shared configuration for k6 benchmark scripts.
 *
 * Environment variables:
 *   SUPABASE_URL      - PostgREST API URL (default: http://127.0.0.1:54321)
 *   SUPABASE_ANON_KEY - Supabase anon key (default: local dev key)
 */

// Supabase local dev default anon key
const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const SUPABASE_URL = __ENV.SUPABASE_URL || 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || LOCAL_ANON_KEY;

// Predictable UUID patterns matching generate-shared-data.sql
export const PROJECT_IDS = Array.from({length: 5}, (_, i) =>
  `00000000-0000-0000-0001-${String(i + 1).padStart(12, '0')}`
);

export const CONSTITUENCY_IDS = Array.from({length: 50}, (_, i) =>
  `00000000-0000-0000-0002-${String(i + 1).padStart(12, '0')}`
);

// Map each project to its 10 constituencies
export const PROJECT_CONSTITUENCIES = {};
for (let p = 0; p < 5; p++) {
  PROJECT_CONSTITUENCIES[PROJECT_IDS[p]] = CONSTITUENCY_IDS.slice(p * 10, (p + 1) * 10);
}
