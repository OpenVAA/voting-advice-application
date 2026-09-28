# A3 measured: what `actions/setup-node` does with `node-version-file: package.json`

**This document supersedes RESEARCH assumption A3.** A3 guessed that `actions/setup-node` *fails*
when `node-version-file: package.json` is set and `engines.node` is absent or misspelled, and said so
explicitly as an unmeasured Medium-confidence assumption. **Measured from the action's own source, A3
is FALSE: the action warns and falls through.** Criterion 2's claim must be written against the
measured answer below, not against A3.

---

## 1. What was fetched, and from which refs

The workflow pins `actions/setup-node@v4` at four sites — `.github/workflows/main.yaml:52`, `:188`,
`:267`, `:348`, each paired with a hard-coded `node-version: 22.22.1` at `:54`, `:190`, `:269`,
`:350`. The `v4` tag was resolved to a commit and the source read at that exact commit, plus at
`main` for comparison.

```bash
gh api repos/actions/setup-node/git/ref/tags/v4 --jq '{ref:.ref,type:.object.type,sha:.object.sha}'
# => {"ref":"refs/tags/v4","sha":"49933ea5288caeca8642d1e84afbd3f7d6820020","type":"commit"}

gh api repos/actions/setup-node/commits/main --jq '{sha:.sha,date:.commit.committer.date}'
# => {"sha":"94196ee1d15439c1b6651cd87ef14e88ec435966","date":"2026-08-25T17:13:52Z"}

gh api "repos/actions/setup-node/contents/src/util.ts?ref=49933ea5288caeca8642d1e84afbd3f7d6820020" --jq '.content' | base64 -d
gh api "repos/actions/setup-node/contents/src/main.ts?ref=49933ea5288caeca8642d1e84afbd3f7d6820020" --jq '.content' | base64 -d
gh api "repos/actions/setup-node/contents/src/util.ts?ref=94196ee1d15439c1b6651cd87ef14e88ec435966" --jq '.content' | base64 -d
gh api "repos/actions/setup-node/contents/src/main.ts?ref=94196ee1d15439c1b6651cd87ef14e88ec435966" --jq '.content' | base64 -d

# The compiled artefact the runner actually executes (3 932 728 bytes; the JSON contents API
# refuses it at that size, so the raw media type is required):
gh api -H "Accept: application/vnd.github.raw" \
  "repos/actions/setup-node/contents/dist/setup/index.js?ref=49933ea5288caeca8642d1e84afbd3f7d6820020"
```

- **Ref measured:** `refs/tags/v4` → commit **`49933ea5288caeca8642d1e84afbd3f7d6820020`** — this is the
  ref `main.yaml` uses.
- **Compared against:** `main` → commit **`94196ee1d15439c1b6651cd87ef14e88ec435966`** (2026-08-25).

Both the TypeScript source **and** the compiled `dist/setup/index.js` were read, because the runner
executes the compiled bundle, not `src/`. The two agree; excerpts from both are below.

---

## 2. The resolution function, verbatim

`src/util.ts:8-61` @ `49933ea5288caeca8642d1e84afbd3f7d6820020`:

```ts
export function getNodeVersionFromFile(versionFilePath: string): string | null {
  if (!fs.existsSync(versionFilePath)) {
    throw new Error(
      `The specified node version file at: ${versionFilePath} does not exist`
    );
  }

  const contents = fs.readFileSync(versionFilePath, 'utf8');

  // Try parsing the file as an NPM `package.json` file.
  try {
    const manifest = JSON.parse(contents);

    // Presume package.json file.
    if (typeof manifest === 'object' && !!manifest) {
      // Support Volta.
      // See https://docs.volta.sh/guide/understanding#managing-your-project
      if (manifest.volta?.node) {
        return manifest.volta.node;
      }

      if (manifest.engines?.node) {
        return manifest.engines.node;
      }

      // Support Volta workspaces.
      // See https://docs.volta.sh/advanced/workspaces
      if (manifest.volta?.extends) {
        const extendedFilePath = path.resolve(
          path.dirname(versionFilePath),
          manifest.volta.extends
        );
        core.info('Resolving node version from ' + extendedFilePath);
        return getNodeVersionFromFile(extendedFilePath);
      }

      // If contents are an object, we parsed JSON
      // this can happen if node-version-file is a package.json
      // yet contains no volta.node or engines.node
      //
      // If node-version file is _not_ JSON, control flow
      // will not have reached these lines.
      //
      // And because we've reached here, we know the contents
      // *are* JSON, so no further string parsing makes sense.
      return null;
    }
  } catch {
    core.info('Node version file is not JSON file');
  }

  const found = contents.match(/^(?:node(js)?\s+)?v?(?<version>[^\s]+)$/m);
  return found?.groups?.version ?? contents.trim();
}
```

**Note the return type: `string | null`.** The no-match branch at `:53` returns `null`. It does not
throw. Whether that `null` fails the job is decided entirely by the caller.

## 3. The caller — this is where the verdict is decided

`src/main.ts:85-119` @ `49933ea5288caeca8642d1e84afbd3f7d6820020`:

```ts
function resolveVersionInput(): string {
  let version = core.getInput('node-version');
  const versionFileInput = core.getInput('node-version-file');

  if (version && versionFileInput) {
    core.warning(
      'Both node-version and node-version-file inputs are specified, only node-version will be used'
    );
  }

  if (version) {
    return version;
  }

  if (versionFileInput) {
    const versionFilePath = path.join(
      process.env.GITHUB_WORKSPACE!,
      versionFileInput
    );

    const parsedVersion = getNodeVersionFromFile(versionFilePath);

    if (parsedVersion) {
      version = parsedVersion;
    } else {
      core.warning(
        `Could not determine node version from ${versionFilePath}. Falling back`
      );
    }

    core.info(`Resolved ${versionFileInput} as ${version}`);
  }

  return version;
}
```

and `src/main.ts:19` + `:36-56`, the consumer of that empty string:

```ts
    const version = resolveVersionInput();
    …
    if (version) {
      …
      const nodeDistribution = getNodejsDistribution(nodejsInfo);
      await nodeDistribution.setupNodeJs();
    }
```

`core.warning` is an annotation, not a failure — only `core.setFailed` (used at `main.ts:81`, solely
in the outer `catch`) fails a step. So an unresolvable version produces a warning annotation, an
empty `version`, a falsy `if (version)`, **no Node installation at all**, and a step that exits 0.
The job proceeds on whatever Node the runner image already has preinstalled.

## 4. The compiled artefact agrees

The same two branches in `dist/setup/index.js` @ the same commit (the file the runner executes;
`Could not determine node version from` occurs at line **97962**):

```js
    if (versionFileInput) {
        const versionFilePath = path.join(process.env.GITHUB_WORKSPACE, versionFileInput);
        const parsedVersion = (0, util_1.getNodeVersionFromFile)(versionFilePath);
        if (parsedVersion) {
            version = parsedVersion;
        }
        else {
            core.warning(`Could not determine node version from ${versionFilePath}. Falling back`);
        }
        core.info(`Resolved ${versionFileInput} as ${version}`);
    }
    return version;
```

`dist/setup/index.js:98019-…` carries the identical `volta.node` → `engines.node` → `volta.extends`
→ `return null` chain.

---

## 5. Verdicts — one per input case

| # | Input case (root `package.json`, with `node-version-file: package.json` and **no** `node-version`) | Resolved value | Verdict |
|---|---|---|---|
| i | valid `engines.node` (`">=22"`) | `">=22"` returned by `util.ts:30` | **WARNS** — no warning is emitted in this case at all; the step succeeds and installs a Node satisfying the range. Recorded as WARNS in the sense that *nothing fails*; see the range caveat below. |
| ii | no `engines` key at all | `null` (`util.ts:53`) → `core.warning('Could not determine node version from …. Falling back')` (`main.ts:110-112`) | **WARNS** |
| iii | `engines` misspelled `engine` (today's state) | `null` — `manifest.engines?.node` is `undefined`, exactly as in case ii | **WARNS** |

**Cases ii and iii are indistinguishable to the action.** A misspelled field is not a special case; it
is simply an absent one.

### The decisive consequence

**A3 is falsified.** `actions/setup-node@v4` does **not** hard-fail when `engines.node` is absent or
misspelled. It emits a warning annotation and installs nothing, leaving the runner's default Node in
place. Therefore **option (a) of OQ-2 — `node-version-file: package.json` — does not catch a
re-misspelling.** RESEARCH stated the conditional plainly: *"If it warns instead of failing, option 1
does not guard against re-misspelling and only option (b)/(c) of OQ-2 binds."* The measurement
selects that branch.

Criterion 2 may therefore **not** claim "a re-misspelling breaks every job that uses it". Under option
(a) a re-misspelling produces a yellow annotation in an otherwise green run — the precise shape of
false green this phase exists to eliminate.

### Two further measured corrections to the plan's premises

1. **Resolution order at `v4` omits `devEngines`.** The plan's Task-1 `read_first` describes the
   function as checking *"`volta.node`, then `devEngines.runtime`, then `engines.node`"*. That is the
   **`main`-branch** order. At the `v4` commit the order is `volta.node` → `engines.node` →
   `volta.extends` → `null`, and `grep -c devEngines dist/setup/index.js` @ `v4` returns **0**. The
   `devEngines.runtime` branch (and a `mise.toml` branch, and `smol-toml` as a new dependency) exists
   only on `main`; `diff` of `src/util.ts` between the two refs shows it added there. Practical effect
   for this repo: none today — `devEngines` is absent from the manifest — but any future reliance on
   `devEngines` would be silently inert under the pinned `v4`.

2. **`engines.node` is a *range*, and setup-node resolves ranges to "latest matching".** The declared
   value is `">=22"`, not a pin. Replacing `node-version: 22.22.1` with `node-version-file:
   package.json` would therefore **unpin CI from 22.22.1 to whatever the newest `>=22` release is on
   the day the job runs**. `resolveVersionInput` returns the raw range string and hands it to the
   distribution resolver as `versionSpec`. This is a behavioural change to every CI job, not a
   like-for-like substitution, and it is not mentioned anywhere in RESEARCH § B.3 option 1. It belongs
   in 153-03's scope discussion whatever mechanism is chosen.

---

## 6. Manifest resolution-order preconditions, checked not assumed

For `engines.node` to be the field a version-file resolver reads, the root manifest must declare
neither `volta` (checked first, `util.ts:25`) nor `devEngines` (checked before `engines` on `main`).

```
$ node -e "const p=require('./package.json'); console.log('volta:', JSON.stringify(p.volta)); console.log('devEngines:', JSON.stringify(p.devEngines)); console.log('engine:', JSON.stringify(p.engine)); console.log('engines:', JSON.stringify(p.engines));"
volta: undefined
devEngines: undefined
engine: {"node":">=22","yarn":"4.13","npm":"please-use-yarn"}
engines: undefined
exit=0
```

Neither key exists, so `engines.node` is unambiguously what would be read. (The `engine` /`engines`
rows above are the pre-rename state, recorded at measurement time.)

The check was flip-tested so that a passing result means something — an object carrying `volta` does
exit non-zero:

```
$ node -e "const p={volta:{node:'22'}}; if (p.volta) { console.error('volta key present'); process.exit(1);}"
volta key present
flip exit=1
```

## 7. What was deliberately not done

No workflow run was triggered. `main.yaml` triggers only on pushes to `main` and pull requests
targeting `main`; the working branch is `integration/ship-12-squash`, so no run this measurement
could observe is reachable from here. `main.yaml` was read but not edited by this measurement.
