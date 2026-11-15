/**
 * The Turborepo cache key of the two Vite apps' `build` tasks, asserted through a turbo dry run.
 *
 * A cache hit replays `build/` instead of running `vite build`, so the hash must cover every file the build reads: a replayed build must never be older than the messages, static assets and Svelte/Vite/Tailwind/inlang configuration it was built from. The frontend build also writes its generated Paraglide runtime into `src/lib/paraglide/`; hashing that directory would make every build invalidate its own cache entry, while leaving it out of the outputs would make a cache hit skip it, and `typecheck`, `lint:check` and `svelte-check` type-check against it.
 *
 * `apps/frontend/turbo.json` and `apps/docs/turbo.json` hold the configuration; this spec checks its effect on the resolved task graph rather than the config text, so a change to the root `turbo.json` that alters the merge is caught too.
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in; it sits beside the other repo-root gate specs in this package. Both CI jobs that run it create the generated Paraglide directory first, which is what lets the "no generated input" test bite.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const TURBO_BIN = join(REPO_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'turbo.cmd' : 'turbo');
const GENERATED_PARAGLIDE = 'src/lib/paraglide/';

const APPS = [
  { taskId: '@openvaa/frontend#build', dir: 'apps/frontend' },
  { taskId: '@openvaa/docs#build', dir: 'apps/docs' }
] as const;

interface DryRunTask {
  taskId: string;
  inputs: Record<string, string>;
  outputs: Array<string>;
  resolvedTaskDefinition: {
    dependsOn: Array<string>;
    inputs: Array<string>;
    outputs: Array<string>;
  };
}

const ROOT_BUILD_DEPENDS_ON = (
  JSON.parse(readFileSync(resolve(REPO_ROOT, 'turbo.json'), 'utf8')) as {
    tasks: { build: { dependsOn: Array<string> } };
  }
).tasks.build.dependsOn;

/** Run the repo-pinned turbo's build dry run for both apps, with every remote-cache credential stripped from the child's env. */
function readBuildDryRun(): Array<DryRunTask> {
  if (!existsSync(TURBO_BIN)) {
    throw new Error(`${TURBO_BIN} is missing, so the build dry run cannot be obtained. Run \`yarn install\`.`);
  }
  const env = { ...process.env };
  delete env.TURBO_TOKEN;
  delete env.TURBO_TEAM;
  delete env.TURBO_API;
  let raw: string;
  try {
    raw = execFileSync(
      TURBO_BIN,
      ['run', 'build', '--dry=json', '--filter=@openvaa/frontend', '--filter=@openvaa/docs'],
      { cwd: REPO_ROOT, encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? '';
    throw new Error(`\`turbo run build --dry=json\` failed: ${(error as Error).message}\n${stderr}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`\`turbo run build --dry=json\` did not print JSON. Output head:\n${raw.slice(0, 500)}`);
  }
  const tasks = (parsed as { tasks?: unknown }).tasks;
  if (!Array.isArray(tasks)) {
    throw new Error('`turbo run build --dry=json` printed JSON without a `tasks` array.');
  }
  return tasks as Array<DryRunTask>;
}

/** Files git tracks under `dir` that exist on disk, relative to `dir`. */
function trackedFiles(dir: string): Array<string> {
  return execFileSync('git', ['ls-files', '-z', '--', dir], { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\0')
    .filter((path) => path.length > 0 && existsSync(join(REPO_ROOT, path)))
    .map((path) => path.slice(dir.length + 1));
}

describe('the Vite apps build cache key covers what the build reads, and only that', () => {
  let tasks: Array<DryRunTask>;

  beforeAll(() => {
    tasks = readBuildDryRun();
  }, 60_000);

  function task(taskId: string): DryRunTask {
    const found = tasks.find((candidate) => candidate.taskId === taskId);
    if (!found) throw new Error(`The build dry run has no task \`${taskId}\`.`);
    return found;
  }

  for (const { taskId, dir } of APPS) {
    it(`the tracked population of ${dir} is non-empty and includes svelte.config.js`, () => {
      const tracked = trackedFiles(dir);
      expect(tracked.length).toBeGreaterThan(0);
      expect(tracked).toContain('svelte.config.js');
    });

    it(`${taskId} hashes every file git tracks in ${dir}`, () => {
      const hashed = new Set(Object.keys(task(taskId).inputs));
      expect(trackedFiles(dir).filter((path) => !hashed.has(path))).toEqual([]);
    });

    it(`${taskId} keeps the root build dependsOn`, () => {
      expect(task(taskId).resolvedTaskDefinition.dependsOn).toEqual(ROOT_BUILD_DEPENDS_ON);
    });
  }

  it('the frontend tracked population includes the message catalogues', () => {
    expect(trackedFiles('apps/frontend').some((path) => path.startsWith('messages/'))).toBe(true);
  });

  it('@openvaa/frontend#build hashes none of the Paraglide output it generates', () => {
    const hashed = Object.keys(task('@openvaa/frontend#build').inputs);
    expect(hashed.filter((path) => path.startsWith(GENERATED_PARAGLIDE))).toEqual([]);
  });

  it('@openvaa/frontend#build excludes the generated Paraglide directory from its inputs', () => {
    expect(task('@openvaa/frontend#build').resolvedTaskDefinition.inputs).toContain(`!${GENERATED_PARAGLIDE}**`);
  });

  it('@openvaa/frontend#build restores the generated Paraglide directory on a cache hit', () => {
    expect(task('@openvaa/frontend#build').outputs).toEqual(
      expect.arrayContaining(['build/**', `${GENERATED_PARAGLIDE}**`])
    );
  });
});
