#!/usr/bin/env npx tsx
/**
 * Developer convenience: print a summary of what the Phase 58 e2e template
 * will seed. Use during spec authoring to verify candidate/org/constituency
 * counts and relational wiring are as expected.
 *
 * Usage:   yarn tsx tests/debug-setup.ts
 */

import {
  E2E_ADDENDUM_CANDIDATES,
  E2E_CANDIDATES,
  E2E_DEFAULT_CANDIDATES,
  E2E_ORGANIZATIONS,
  E2E_QUESTIONS,
  E2E_VOTER_CANDIDATES
} from './tests/utils/e2eFixtureRefs';

function main() {
  console.log('Phase 58 e2e template summary:');
  console.log(`  candidates total:   ${E2E_CANDIDATES.length}`);
  console.log(`    default:          ${E2E_DEFAULT_CANDIDATES.length}`);
  console.log(`    voter:            ${E2E_VOTER_CANDIDATES.length}`);
  console.log(`    unregistered:     ${E2E_ADDENDUM_CANDIDATES.length}`);
  console.log(`  organizations:      ${E2E_ORGANIZATIONS.length}`);
  console.log(`  questions:          ${E2E_QUESTIONS.length}`);
  // TODO(Phase 60+): variant debug — switch template via env var or CLI flag.
}

main();
