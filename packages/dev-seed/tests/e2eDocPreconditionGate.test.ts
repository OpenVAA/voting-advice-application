/**
 * The E2E suite's documented prerequisites, asserted rather than described.
 *
 * ## The invariants
 *
 * TWO retired instructions are held retired here, because they are one defect class seen twice: a document that describes a run sequence the harness no longer supports.
 *
 * 1. **A database reset is not a precondition.** The suite creates and owns its own project, reads and writes only inside it, and its teardowns clear it. A document that says otherwise does not merely mislead: it sends a reader, or an agent reading these files as instruction, to destroy the state a run in flight depends on, and it re-opens the question every no-reset run exists to settle.
 * 2. **A plain `yarn dev` is not the way to start the application under test.** That command serves the DEFAULT project while the harness seeds its own, so the suite would drive an application with no elections, no questions and no nominations. The served-project gate in `tests/global-setup.ts` now aborts such a run by name, and this file keeps the documents from instructing it in the first place.
 *
 * ## Why a one-time edit is not enough
 *
 * The instruction was true once, and text that was true once comes back — a reader restoring "the step that used to be there", a merge resurrecting an older block, a new document copying an old one. Retiring it is a snapshot; this file is the part that keeps it retired, and it runs on `yarn test:unit` like every other spec here.
 *
 * ## What is checked, and what is deliberately permitted
 *
 * The reset command still has legitimate homes: the command maps that document what it does, and the pitfall warning that a reset run in another terminal wipes a suite mid-run. Both are enumerated below as an explicit allowlist, with a reason each. Two halves are then asserted over every occurrence found: no occurrence may be FRAMED as a step taken before a run, and no occurrence may sit outside the allowlist. The framing half catches the instruction returning in new words; the allowlist half catches it returning in words the framing patterns do not know, because an occurrence nobody has vouched for is not something this file is willing to pass.
 *
 * The development command needs a different shape of check, because BANNING the string would be wrong: `yarn dev` is the correct command for local development and the documents rightly say so a dozen times. What is retired is the PAIRING — `yarn dev` offered as the way to bring up the application that the suite is then pointed at. So the population narrows twice: to occurrences that share a window with an invocation of the suite, and then away from those whose window scopes the server to the project the suite seeds. That second narrowing is decided against the harness's own project constant rather than a literal typed here, so a document naming some other project does not qualify for it. Whatever survives both narrowings must be vouched for by name.
 *
 * ## Scope
 *
 * The live documents only, listed in `DOCUMENTS`. Historical records elsewhere in the repository state what was true when they were written and are not this guard's business.
 *
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests. It sits beside the other repo-root readers rather than in a home of its own.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { E2E_PROJECT_ID } from '../src/supabaseAdminClient';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

/** The live documents a reader or an agent takes instruction from. Anything not listed here is out of scope. */
const DOCUMENTS = ['CLAUDE.md', 'tests/README.md', 'tests/IDURA-TEST-RUNBOOK.md'] as const;

/** The reset command, in the one spelling every mention of it contains — the `-with-data` variant and the full-stack wrappers all name it, so a single needle finds every occurrence without a list of aliases to keep in step. */
const RESET_COMMAND = /db:reset/;

/** Lines of context either side of an occurrence. Three is enough to hold a fenced command block's neighbouring commands and the sentence introducing it, and short enough that an unrelated paragraph two topics away is not read as this occurrence's framing. */
const WINDOW = 3;

/**
 * The shapes that turn a mention of the reset command into a PRECONDITION of running the suite.
 *
 * Each was verified to fire on the retired instructions and on none of the permitted survivors before this file was trusted; a pattern that matched everything, or nothing, would assert nothing either way.
 */
const PRECONDITION_FRAMING: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: 'an E2E invocation in the same block', pattern: /test:e2e|playwright test/i },
  { label: 'a prerequisite label', pattern: /prereq/i },
  {
    label: 'ordering language placing it before a run',
    pattern: /\bbefore (the |a |any )?(run|running|runs|suite|specs?)\b/i
  },
  { label: 'a clean-database instruction', pattern: /\bclean DB\b/i },
  { label: 'reset-first phrasing', pattern: /\b(reset|clean|wipe)[^.\n]{0,40}\bfirst\b/i }
];

/**
 * The occurrences that stay, each with the reason it is not an instruction to clear the database before a run.
 *
 * `text` is matched after whitespace collapsing, so re-aligning a comment in a command block does not redden this file, while changing what the line SAYS does. Every entry is asserted below to match exactly one occurrence, so an entry left behind by a deleted line fails as loudly as an occurrence nobody listed.
 */
const ALLOWLIST: ReadonlyArray<{ file: string; text: string; reason: string }> = [
  {
    file: 'CLAUDE.md',
    text: 'yarn db:reset # Reset the database only (drops + recreates from migrations + seed.sql)',
    reason: 'Setup command map — documents what the command does, asks nobody to run it.'
  },
  {
    file: 'CLAUDE.md',
    text: 'yarn db:reset # Reset the DB only: ensure Supabase is up, then `supabase db reset` (migrations + seed.sql)',
    reason: 'Database command map — the canonical description of the command.'
  },
  {
    file: 'CLAUDE.md',
    text: 'yarn db:reset-with-data # db:reset, then db:seed --template default',
    reason: 'Database command map — names the reset only to define a sibling command.'
  },
  {
    file: 'CLAUDE.md',
    text: 'yarn dev:reset # db:reset, then launch the full stack (yarn dev)',
    reason: 'Full-stack command map — names the reset only to define a wrapper command.'
  },
  {
    file: 'CLAUDE.md',
    text: 'yarn dev:reset-with-data # db:reset-with-data, then launch the full stack (yarn dev)',
    reason: 'Full-stack command map — names the reset only to define a wrapper command.'
  },
  {
    file: 'CLAUDE.md',
    text: 'yarn db:reset-with-data # db:reset + default template (Finnish demo, 4 locales); DB only',
    reason: 'Local-seeding command map — a development workflow, unrelated to running the suite.'
  },
  {
    file: 'CLAUDE.md',
    text: '- **Database issues**: `yarn db:reset` resets the database only; `yarn dev:reset` resets it and relaunches the full stack.',
    reason: 'Troubleshooting remedy for a broken database — a repair, not a step in a run.'
  },
  {
    file: 'tests/README.md',
    text: "- **`yarn db:reset` in another terminal will wipe the suite mid-run** — the teardown projects are the only legitimate path to clear test data. Don't reset while the suite is running. This warning carries _more_ weight now that no run asks for a reset: reaching for that command by hand is the one remaining way to destroy a run's data underneath it.",
    reason:
      'The mid-run wipe warning — it forbids the act rather than prescribing it, and matters more now that no run performs one.'
  }
];

/**
 * The BARE development command, excluding its `dev:`-prefixed siblings.
 *
 * The negative lookahead is the whole point: `yarn dev:clean`, `yarn dev:reset` and `yarn dev:reset-with-data` are different commands with their own documented purposes, and folding them into this population would make every command-map row a candidate violation.
 */
const DEV_COMMAND = /\byarn dev\b(?!:)/;

/**
 * The signal that a mention of the development command sits inside an E2E RUN RECIPE rather than inside ordinary development prose.
 *
 * This is the discrimination rule the whole check turns on. Banning the string `yarn dev` would be wrong — it is the correct command for local development, and the documents rightly say so in a dozen places. What is retired is the pairing: `yarn dev` offered as the way to bring up the application that the E2E suite is then pointed at. So the population narrows to occurrences that share a window with an invocation of the suite, and every member of THAT population must be vouched for.
 */
const E2E_INVOCATION = /test:e2e|playwright test/i;

/**
 * The counter-signal that a documented dev server IS pointed at the project the suite seeds, and so is a correct instruction rather than the retired one.
 *
 * Built from the harness's OWN constant, never from a literal typed here: the exemption is then decidable against the thing it is an exemption from, and a document that names some other project id does not qualify for it. Matched over the WINDOW rather than the line because both correct forms exist in the documents — a `PUBLIC_PROJECT_ID=… yarn dev` prefix on one line, and an `export PUBLIC_PROJECT_ID=…` a line or two above the command that inherits it.
 */
const SCOPED_TO_SUITE_PROJECT = new RegExp(`PUBLIC_PROJECT_ID=${E2E_PROJECT_ID}`, 'i');

/**
 * Every co-occurrence of the development command and an E2E invocation that is NOT the retired run recipe, with the reason it is not.
 *
 * Same contract as {@link ALLOWLIST}: matched after whitespace collapsing, and asserted below to match exactly one occurrence each, so an entry outliving its line fails as loudly as a line nobody listed.
 */
const DEV_COMMAND_ALLOWLIST: ReadonlyArray<{ file: string; text: string; reason: string }> = [
  {
    file: 'tests/README.md',
    text: "- stop the other server occupying the port, then start this repo's `yarn dev`; or",
    reason:
      "A verbatim reproduction of the preflight's own failure text, quoted so a reader can match the message on screen. It is a remedy for a port held by a foreign server, not an instruction on how to serve the suite."
  },
  {
    file: 'tests/README.md',
    text: "**The alternate-port hatch.** `FRONTEND_PORT` works in two forms. A `FRONTEND_PORT` line in the root `.env` sets the port for the frontend dev server **and** for Playwright, and persists across sessions (the frontend's Vite config reads that file through `loadEnv`). Prefixing a single command — `FRONTEND_PORT=5273 yarn dev`, `FRONTEND_PORT=5273 yarn test:e2e` — overrides the file for that one run, because a shell value wins over `.env`. Whichever form you use, the dev server and the suite have to end up on the same port; otherwise the preflight aborts and names the mismatch.",
    reason:
      'Port mechanics. It names both commands only to show where an environment prefix goes, and prescribes no run sequence.'
  },
  {
    file: 'tests/README.md',
    text: 'Related: `yarn dev` now refuses to start when its port is already taken (`Error: Port <port> is already in use`) instead of quietly moving to the next one. That closes the same-address collision at source. It does not close the case where another process holds the wildcard address and both servers coexist on the same port number — that one is what the preflight catches.',
    reason:
      "A statement about the development server's `strictPort` behaviour, adjacent to the port discussion rather than to any run recipe."
  }
];

/** One line of a document that names the reset command, with the context read around it. */
type Occurrence = {
  file: string;
  line: number;
  text: string;
  window: string;
};

/**
 * Collapse runs of whitespace so alignment inside a command block is not part of a line's identity.
 * @param text - The raw line.
 * @returns The line trimmed, with internal whitespace runs collapsed to single spaces.
 */
function normalise(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Every line of every in-scope document that names the given command.
 *
 * Reading the files here rather than at module scope keeps the failure of an unreadable document an ordinary test failure naming the path, instead of a collection error naming nothing.
 * @param needle - The command to search for, as a non-global pattern.
 * @returns The occurrences, in document then line order.
 */
function findOccurrences(needle: RegExp): Array<Occurrence> {
  const found: Array<Occurrence> = [];
  for (const file of DOCUMENTS) {
    const lines = readFileSync(resolve(REPO_ROOT, file), 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (!needle.test(line)) return;
      found.push({
        file,
        line: index + 1,
        text: normalise(line),
        window: lines.slice(Math.max(0, index - WINDOW), index + WINDOW + 1).join('\n')
      });
    });
  }
  return found;
}

describe('no live document states a database reset as a precondition of running the E2E suite', () => {
  const occurrences = findOccurrences(RESET_COMMAND);

  it('reads a non-empty population out of every document in scope', () => {
    // The non-vacuity guard for everything below: an assertion over an empty set passes without asserting anything, and a document that moved would produce exactly that silent pass.
    for (const file of DOCUMENTS) {
      expect(readFileSync(resolve(REPO_ROOT, file), 'utf8').length).toBeGreaterThan(0);
    }
    expect(occurrences.length).toBeGreaterThan(0);
    // Both documents that legitimately name the command must still be represented, so a scan that silently lost one of them is not read as a clean result.
    expect(new Set(occurrences.map((occurrence) => occurrence.file))).toEqual(
      new Set(['CLAUDE.md', 'tests/README.md'])
    );
  });

  it('frames no occurrence as a step taken before a run', () => {
    const violations = occurrences.flatMap((occurrence) =>
      PRECONDITION_FRAMING.filter(({ pattern }) => pattern.test(occurrence.window)).map(
        ({ label }) =>
          `${occurrence.file}:${occurrence.line} — '${occurrence.text}' reads as a precondition of a run (${label} appears within ${WINDOW} lines). The suite owns its own project and clears it itself, so a reset is not a prerequisite; retire the instruction rather than rewording it.`
      )
    );
    expect(violations).toEqual([]);
  });

  it('leaves no occurrence unaccounted for', () => {
    const unlisted = occurrences
      .filter(
        (occurrence) => !ALLOWLIST.some((entry) => entry.file === occurrence.file && entry.text === occurrence.text)
      )
      .map(
        (occurrence) =>
          `${occurrence.file}:${occurrence.line} — '${occurrence.text}' is a new mention of the reset command in a live document. Either retire it, or add it to ALLOWLIST in this file with the reason it is not an instruction to clear the database before a run.`
      );
    expect(unlisted).toEqual([]);
  });

  it('keeps the allowlist exact — every entry accounts for exactly one occurrence', () => {
    // The other direction of the same invariant. Without it a deleted line leaves a permission behind that would quietly re-admit the same text later, and this file would still be green while permitting something nothing on disk says.
    const stale = ALLOWLIST.map((entry) => ({
      entry,
      matches: occurrences.filter((occurrence) => occurrence.file === entry.file && occurrence.text === entry.text)
        .length
    }))
      .filter(({ matches }) => matches !== 1)
      .map(
        ({ entry, matches }) =>
          `ALLOWLIST entry for ${entry.file} matched ${matches} occurrences, expected exactly 1: '${entry.text}'`
      );
    expect(stale).toEqual([]);
  });
});

describe('no live document instructs a plain `yarn dev` as the way to serve the application under test', () => {
  const occurrences = findOccurrences(DEV_COMMAND);
  const inRunRecipe = occurrences.filter(
    (occurrence) => E2E_INVOCATION.test(occurrence.window) && !SCOPED_TO_SUITE_PROJECT.test(occurrence.window)
  );

  it('reads a non-empty population, and still finds the co-occurrences it discriminates over', () => {
    // Two floors, not one. The first says the development command is still mentioned somewhere, so a document that moved is not read as a clean result. The second says the narrowing rule still selects something: a co-occurrence population of zero would let every assertion below pass while proving nothing, which is the exact failure a check like this is worth nothing without.
    expect(occurrences.length).toBeGreaterThan(0);
    expect(inRunRecipe.length).toBeGreaterThan(0);
  });

  it('vouches for every place the development command shares a window with an E2E invocation', () => {
    const unlisted = inRunRecipe
      .filter(
        (occurrence) =>
          !DEV_COMMAND_ALLOWLIST.some((entry) => entry.file === occurrence.file && entry.text === occurrence.text)
      )
      .map(
        (occurrence) =>
          `${occurrence.file}:${occurrence.line} — '${occurrence.text}' names \`yarn dev\` within ${WINDOW} lines of an E2E invocation. A plain \`yarn dev\` serves the DEFAULT project while the suite seeds its own, so the suite would drive an empty application; instruct \`tests/scripts/e2e-run.sh\` instead, or add this line to DEV_COMMAND_ALLOWLIST with the reason it is not a run recipe.`
      );
    expect(unlisted).toEqual([]);
  });

  it('keeps the development-command allowlist exact — every entry accounts for exactly one occurrence', () => {
    const stale = DEV_COMMAND_ALLOWLIST.map((entry) => ({
      entry,
      matches: occurrences.filter((occurrence) => occurrence.file === entry.file && occurrence.text === entry.text)
        .length
    }))
      .filter(({ matches }) => matches !== 1)
      .map(
        ({ entry, matches }) =>
          `DEV_COMMAND_ALLOWLIST entry for ${entry.file} matched ${matches} occurrences, expected exactly 1: '${entry.text}'`
      );
    expect(stale).toEqual([]);
  });
});
