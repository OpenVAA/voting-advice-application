#!/usr/bin/env npx tsx
/**
 * Developer convenience: print question metadata from the Phase 58 e2e
 * template. Useful while authoring new Playwright specs to look up a
 * question's external_id, type, or label.
 *
 * Usage:   yarn tsx tests/debug-questions.ts
 */

import { E2E_QUESTIONS } from './tests/utils/e2eFixtureRefs';

function main() {
  console.log(`e2e template: ${E2E_QUESTIONS.length} questions`);
  const byType = new Map<string, number>();
  for (const q of E2E_QUESTIONS) {
    byType.set(q.type, (byType.get(q.type) ?? 0) + 1);
  }
  console.log('By type:');
  for (const [type, n] of [...byType.entries()].sort()) {
    console.log(`  ${type}: ${n}`);
  }
  console.log('External IDs (first 10):');
  E2E_QUESTIONS.slice(0, 10).forEach((q, i) => console.log(`  [${i}] ${q.external_id} (${q.type})`));
  // TODO(Phase 60+): variant question inspection — use `yarn dev:seed --template ./tests/tests/setup/templates/variant-constituency.ts` then re-query DB if needed.
}

main();
