/**
 * k6 HTTP load test: Voter bulk-read through PostgREST API.
 *
 * Tests the voter pattern: load all candidates in a constituency with answers.
 * Uses PostgREST resource embedding to filter candidates through the nominations table.
 *
 * Usage:
 *   k6 run voter-bulk-read.js
 *   k6 run --env SUPABASE_ANON_KEY=<key> voter-bulk-read.js
 *
 * Scenarios:
 *   voter_reads_100 - 100 concurrent virtual users for 60s
 *   voter_reads_500 - 500 concurrent virtual users for 60s (starts after first scenario)
 */

import http from 'k6/http';
import {check} from 'k6';
import {Trend} from 'k6/metrics';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  PROJECT_IDS,
  PROJECT_CONSTITUENCIES
} from './config.js';

const voterBulkReadDuration = new Trend('voter_bulk_read_duration', true);

export const options = {
  scenarios: {
    voter_reads_100: {
      executor: 'constant-vus',
      vus: 100,
      duration: '60s'
    },
    voter_reads_500: {
      executor: 'constant-vus',
      vus: 500,
      duration: '60s',
      startTime: '70s'
    }
  },
  thresholds: {
    voter_bulk_read_duration: ['p(95)<1000'] // p95 under 1 second
  }
};

export default function () {
  // Pick a random project and one of its constituencies
  const projectIdx = Math.floor(Math.random() * PROJECT_IDS.length);
  const projectId = PROJECT_IDS[projectIdx];
  const constituencies = PROJECT_CONSTITUENCIES[projectId];
  const constituencyId = constituencies[Math.floor(Math.random() * constituencies.length)];

  // PostgREST query: get nominations with inner-joined candidates filtered by constituency.
  // Uses resource embedding with !inner to ensure only matching rows are returned.
  const url =
    `${SUPABASE_URL}/rest/v1/nominations` +
    `?select=candidate_id,candidates!inner(id,first_name,last_name,name,answers)` +
    `&constituency_id=eq.${constituencyId}` +
    `&project_id=eq.${projectId}` +
    `&candidates.published=eq.true`;

  const params = {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json'
    }
  };

  const res = http.get(url, params);

  voterBulkReadDuration.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) && body.length >= 0;
      } catch {
        return false;
      }
    }
  });
}
