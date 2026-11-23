/**
 * The instance static-asset layer.
 *
 * SvelteKit serves, lists and copies exactly one assets directory (`kit.files.assets`). To let an instance replace single files of the frontend's own `static/` (a favicon, a hero image, a font stylesheet, a logo), this module builds a merged copy at `apps/frontend/.instance/static`: the frontend's `static/` first, then every file of `instance/static/` laid over it by relative path, so an instance file wins over the base file of the same path and base-only files stay. The merged copy is generated and gitignored.
 *
 * The layer is present only when `instance/static/` holds at least one regular file; the tracked `instance/README.md` alone does not make it present.
 */
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync as lstat,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

/** The name of the file in the merged dir that records the fingerprint of the inputs it was built from. A dot-file, so it is served as an asset nobody requests. */
const FINGERPRINT_FILE = '.instance-fingerprint';

/**
 * @typedef {object} FileEntry
 * @property {string} rel The path relative to the walked directory, with `/` separators.
 * @property {string} abs The absolute path.
 * @property {number} size The size in bytes.
 * @property {number} mtimeMs The modification time.
 */

/**
 * Resolve the assets directory SvelteKit should use.
 *
 * Returns `'static'`, SvelteKit's default, when `instance/static/` holds no regular file. Otherwise returns the absolute path of the merged dir `<frontendDir>/.instance/static`, rebuilt when the files of either layer changed (by path, size and modification time) and reused untouched otherwise. The dir carries a `.instance-fingerprint` dot-file recording those inputs.
 *
 * Every entry of `instance/static/` is checked before anything is written: a symbolic link, or anything that is neither a regular file nor a directory, throws an error naming its path, so no file from outside `instance/static/` can reach the public build. A rebuild goes to a fresh temporary sibling that is renamed into place, so loaders running at the same time (`svelte-kit sync`, vite, svelte-check) never see a partly copied dir.
 *
 * @param {{ repoRoot: string, frontendDir: string }} options The repository root holding `instance/`, and the frontend workspace holding `static/`.
 * @returns {string} `'static'`, or the absolute path of the merged dir.
 */
export function instanceAssetsDir({ repoRoot, frontendDir }) {
  const instanceStatic = join(repoRoot, 'instance', 'static');
  const instanceFiles = existsSync(instanceStatic) ? walk(instanceStatic, 'instance/static') : [];
  if (instanceFiles.length === 0) return 'static';

  const baseStatic = join(frontendDir, 'static');
  const baseFiles = walk(baseStatic, relative(repoRoot, baseStatic).split(sep).join('/'));
  const fingerprint = fingerprintOf(baseFiles, instanceFiles);

  const instanceOut = join(frontendDir, '.instance');
  const dest = resolve(instanceOut, 'static');
  if (fingerprintIn(dest) === fingerprint) return dest;

  mkdirSync(instanceOut, { recursive: true });
  const tmp = mkdtempSync(join(instanceOut, 'static.tmp-'));
  let placed = false;
  try {
    cpSync(baseStatic, tmp, { recursive: true });
    for (const file of instanceFiles) {
      const target = join(tmp, file.rel);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(file.abs, target);
    }
    writeFileSync(join(tmp, FINGERPRINT_FILE), fingerprint, 'utf8');
    placed = swapIn({ tmp, dest, instanceOut, fingerprint });
  } finally {
    if (!placed) rmSync(tmp, { recursive: true, force: true });
  }
  return dest;
}

/**
 * Collect the regular files under `dir`, refusing symbolic links and special files.
 *
 * @param {string} dir The directory to walk; it must exist.
 * @param {string} label The directory's repo-relative name, used in error messages.
 * @returns {Array<FileEntry>} The regular files, sorted by relative path.
 */
function walk(dir, label) {
  /** @type {Array<FileEntry>} */
  const files = [];
  const rootStat = lstat(dir);
  if (rootStat.isSymbolicLink())
    throw new Error(`${label} is a symbolic link; symbolic links are not allowed in ${label}`);
  if (!rootStat.isDirectory()) throw new Error(`${label} is not a directory`);

  /**
   * @param {string} abs The absolute directory path.
   * @param {string} rel Its path relative to `dir`, empty for `dir` itself.
   * @returns {void}
   */
  function visit(abs, rel) {
    for (const name of readdirSync(abs).sort()) {
      const childAbs = join(abs, name);
      const childRel = rel === '' ? name : `${rel}/${name}`;
      const stats = lstat(childAbs);
      if (stats.isSymbolicLink()) {
        throw new Error(`${label}/${childRel} is a symbolic link; symbolic links are not allowed in ${label}`);
      } else if (stats.isDirectory()) {
        visit(childAbs, childRel);
      } else if (stats.isFile()) {
        files.push({ rel: childRel, abs: childAbs, size: stats.size, mtimeMs: stats.mtimeMs });
      } else {
        throw new Error(
          `${label}/${childRel} is neither a regular file nor a directory; only those are allowed in ${label}`
        );
      }
    }
  }

  visit(dir, '');
  return files;
}

/**
 * Hash the path, size and modification time of every file of both layers.
 *
 * @param {Array<FileEntry>} baseFiles The files of the frontend's `static/`.
 * @param {Array<FileEntry>} instanceFiles The files of `instance/static/`.
 * @returns {string} A sha256 hex digest.
 */
function fingerprintOf(baseFiles, instanceFiles) {
  const hash = createHash('sha256');
  for (const [layer, files] of /** @type {const} */ ([
    ['base', baseFiles],
    ['instance', instanceFiles]
  ])) {
    for (const file of files) hash.update(`${layer}\0${file.rel}\0${file.size}\0${file.mtimeMs}\n`);
  }
  return hash.digest('hex');
}

/**
 * Read the fingerprint a merged dir was built from.
 *
 * @param {string} dir The merged dir.
 * @returns {string | undefined} The fingerprint, or `undefined` when the dir or its fingerprint file is absent.
 */
function fingerprintIn(dir) {
  try {
    return readFileSync(join(dir, FINGERPRINT_FILE), 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Rename a finished build into place, replacing any earlier merged dir.
 *
 * When another loader places its own result first, that result is kept if it was built from the same inputs; otherwise the swap is tried once more.
 *
 * @param {{ tmp: string, dest: string, instanceOut: string, fingerprint: string }} options The finished build, the merged dir's path, its parent and the build's fingerprint.
 * @returns {boolean} `true` when `tmp` was renamed to `dest`, `false` when an equal concurrent result was kept and `tmp` is left for the caller to remove.
 */
function swapIn({ tmp, dest, instanceOut, fingerprint }) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const old = join(
      instanceOut,
      `static.old-${process.pid}-${Date.now()}-${attempt}-${Math.random().toString(36).slice(2)}`
    );
    try {
      renameSync(dest, old);
    } catch (error) {
      if (errorCode(error) !== 'ENOENT') throw error;
    }
    try {
      renameSync(tmp, dest);
      return true;
    } catch (error) {
      const code = errorCode(error);
      if (code !== 'ENOTEMPTY' && code !== 'EEXIST') throw error;
      if (fingerprintIn(dest) === fingerprint) return false;
    } finally {
      rmSync(old, { recursive: true, force: true });
    }
  }
  throw new Error(`could not place the merged instance assets at ${dest}: another loader kept replacing it`);
}

/**
 * @param {unknown} error A thrown value.
 * @returns {string | undefined} Its Node.js error code, if any.
 */
function errorCode(error) {
  return error instanceof Error && 'code' in error ? String(error.code) : undefined;
}
