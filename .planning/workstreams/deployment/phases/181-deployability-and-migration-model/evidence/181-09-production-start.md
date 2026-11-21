BUILD_EXIT=0
START_ALL_SET=listening
MISSING_PUBLIC_SUPABASE_URL_EXIT=1
MISSING_PUBLIC_SUPABASE_ANON_KEY_EXIT=1
MISSING_PUBLIC_PROJECT_ID_EXIT=1
MISSING_ORIGIN_EXIT=1
MISSING_TWO_EXIT=1
MISSING_PUBLIC_SUPABASE_URL_MESSAGE=Error: Required environment variables are not set: PUBLIC_SUPABASE_URL
MISSING_PUBLIC_SUPABASE_ANON_KEY_MESSAGE=Error: Required environment variables are not set: PUBLIC_SUPABASE_ANON_KEY
MISSING_PUBLIC_PROJECT_ID_MESSAGE=Error: Required environment variables are not set: PUBLIC_PROJECT_ID
MISSING_ORIGIN_MESSAGE=Error: Required environment variables are not set: ORIGIN
MISSING_TWO_MESSAGE=Error: Required environment variables are not set: PUBLIC_PROJECT_ID, ORIGIN
A6=held

# The built production server, outside Docker: the start-up check

Every status above was read from the command itself: a build's or a start's own exit status, taken with `wait` on the process this plan started, and an HTTP status from `curl -s -o <file> -w '%{http_code}'`. None was read through a pipe, and no status is that of a process this plan had to stop. The five `MISSING_*_MESSAGE` lines are copied from each run's standard error by `grep`, unedited.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12, 18:34:54Z to 18:37:12Z |
| Commit | `fafaada0d1686f8bef1935c8c3d72f8de6a51c8c` (the `HEAD` when the task began) |
| Tracked changes in the worktree | none before the build and none after the last run (`git status --porcelain --untracked-files=no` empty both times) |
| Node | v24.21.0 |
| `@sveltejs/kit` | 2.70.3 |
| `@sveltejs/adapter-node` | 5.5.7 |
| Start command | `node ./apps/frontend/build/index.js`, from the repository root, as the image starts it |
| Port | 3181, free before every start (`lsof -nP -iTCP:3181 -sTCP:LISTEN` empty) and free after the last run |

No Supabase stack was started, stopped or contacted. `PUBLIC_SUPABASE_URL` named `http://127.0.0.1:9`, where nothing listens, in every start that was given it.

## How each environment was constructed

- **Every start** ran as `env -i PATH=<node 24.21.0 bin>:/usr/bin:/bin:/usr/sbin:/sbin HOME=<home> PORT=3181 <the named variables> node ./apps/frontend/build/index.js`. `env -i` clears the environment, so the process saw `PATH`, `HOME`, `PORT` and the variables written on that command line, and nothing from the calling shell. A removed variable is one that was not written; no variable was set to the empty string to stand for "unset". The one start with `ORIGIN=` is the separate observation at the end and says so.
- **The full set:** `PUBLIC_SUPABASE_URL=http://127.0.0.1:9`, `PUBLIC_SUPABASE_ANON_KEY=unset-anon-key`, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`, `ORIGIN=http://localhost:3181`.
- **The root `.env` was not opened, listed or printed.** That the server took no variable from it is shown by the red runs themselves: each start that left a variable out reported exactly that variable as unset, and no other.
- **The build** ran as `env -i PATH=<node 24.21.0 bin>:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin HOME=<home> TURBO_CACHE_DIR=<an empty directory under tmp/> yarn build`, so no `BUILD_SHA` reached it from the shell (the shell had none set either). `/usr/local/bin` is in that `PATH` because the `yarn` shim lives there; `yarn node --version` under the same environment printed `v24.21.0`. The build itself reads the root `.env` through Vite and kit, which this plan cannot switch off without editing the config. What the build saw of `BUILD_SHA` is read from its result: the served build id is a time-based number (below).

## Type check and lint before the build

| Command | Status | Result |
|---------|--------|--------|
| `yarn workspace @openvaa/frontend typecheck` | 0 | `COMPLETED 2817 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `yarn workspace @openvaa/frontend lint` | 0 | no finding (empty output) |

Both ran in the background with their output in a file and their status in a second file. Neither goes through turbo.

## The build

| Item | Value |
|------|-------|
| Command | `yarn build` from the repository root (`turbo run build`), in the background, polled |
| Status | 0 (`BUILD_EXIT`) |
| Turbo summary | `Tasks:    14 successful, 14 total` and `Cached:    0 cached, 14 total` |
| Cache | a directory private to this build, empty at the start; remote caching disabled |
| `BUILD_SHA` | not in the environment |
| Output | `apps/frontend/build/index.js` written 15 s after the build started |
| Build id on disk | `apps/frontend/build/client/_app/version.json` holds `{"version":"1791830151116"}`, which is 2026-10-12T18:35:51Z in milliseconds |

Nothing was replayed: every one of the 14 tasks executed in this worktree.

## The control: all four variables set

Run before any red run.

| Item | Value |
|------|-------|
| Result | the process listened on port 3181 (`START_ALL_SET=listening`), read with `lsof -nP -a -p <pid> -iTCP:3181 -sTCP:LISTEN` |
| Standard output | `Listening on http://0.0.0.0:3181` |
| Standard error | empty |
| `GET /api/health` | 200, body `{"status":"ok","build":"1791830151116"}` |
| Stop | `SIGTERM` to the pid this plan started; the process ended and the port was free |

So the check can pass, and a red run below is red because of what it was not given.

## The five red starts

Each process was given up to 20 seconds. All five ended by themselves; none was stopped by this plan.

| Run | Variable not given | Exit status | Lines of standard error ending with the message that names it | Standard output |
|-----|--------------------|-------------|-------------------------------------------------------------|-----------------|
| 1 | `PUBLIC_SUPABASE_URL` | 1 | 1 | empty |
| 2 | `PUBLIC_SUPABASE_ANON_KEY` | 1 | 1 | empty |
| 3 | `PUBLIC_PROJECT_ID` | 1 | 1 | empty |
| 4 | `ORIGIN` | 1 | 1 | empty |
| 5 | `PUBLIC_PROJECT_ID` and `ORIGIN` | 1 | 1 | empty |

- The matching line of each run is its `MISSING_*_MESSAGE` above. It was found with `grep` for `Required environment variables are not set: <names>` anchored at the end of the line, so a message naming a further variable would not have matched.
- Run 5 names both variables in one error, in the order of `REQUIRED_ENV`.
- Each standard error holds 12 lines: Node's report of the uncaught error (the source line of the `throw`, the error line, the stack through `Server.init` and the adapter's handler, and the Node version). The source line holds the template text `${missing.join(", ")}`, not a name, and does not match the anchored search.
- None of the five wrote `Listening on`, so none opened the port.

## No value in any output

The standard error and the standard output of all seven starts of this part were searched with `grep -F` for each of the four values given:

| Value | Files that hold it |
|-------|--------------------|
| `unset-anon-key` | 0 |
| `127.0.0.1:9` | 0 |
| `00000000-0000-0000-0000-000000000001` | 0 |
| `localhost:3181` | 0 |

The error names variables and prints no value.

## Assumption A6

`A6=held`. A production start whose `init` throws ends the process with status 1, before the server listens. `apps/frontend/src/hooks.server.ts` was not edited.

## adapter-node with `ORIGIN` set to the empty string

Observed once: the full set with `ORIGIN=` (the variable present and empty). The process ended by itself with status 1. Its error is the adapter's own, raised while the handler module loads and before `init` runs:

```
Error: Invalid ORIGIN: ''. ORIGIN must be a valid URL with http:// or https:// protocol. For example: 'http://localhost:3000' or 'https://my.site'
```

The start-up check's message does not occur in that output (0 lines hold `Required environment variables`). So an empty `ORIGIN` is refused by the adapter and an absent one by `init`; both end the start with status 1.

## Full standard error of each run

In the text below the absolute path of the repository is written `<repo>`. Nothing else is changed.

### Control, all four set

```
(empty)
```

### Run 1, `PUBLIC_SUPABASE_URL` not given

```
file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692
	if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
	                              ^

Error: Required environment variables are not set: PUBLIC_SUPABASE_URL
    at Object.init (file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692:32)
    at file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3789:35
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Server.init (file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3771:3)
    at async file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1264:1

Node.js v24.21.0
```

### Run 2, `PUBLIC_SUPABASE_ANON_KEY` not given

```
file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692
	if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
	                              ^

Error: Required environment variables are not set: PUBLIC_SUPABASE_ANON_KEY
    at Object.init (file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692:32)
    at file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3789:35
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Server.init (file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3771:3)
    at async file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1264:1

Node.js v24.21.0
```

### Run 3, `PUBLIC_PROJECT_ID` not given

```
file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692
	if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
	                              ^

Error: Required environment variables are not set: PUBLIC_PROJECT_ID
    at Object.init (file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692:32)
    at file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3789:35
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Server.init (file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3771:3)
    at async file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1264:1

Node.js v24.21.0
```

### Run 4, `ORIGIN` not given

```
file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692
	if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
	                              ^

Error: Required environment variables are not set: ORIGIN
    at Object.init (file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692:32)
    at file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3789:35
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Server.init (file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3771:3)
    at async file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1264:1

Node.js v24.21.0
```

### Run 5, `PUBLIC_PROJECT_ID` and `ORIGIN` not given

```
file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692
	if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
	                              ^

Error: Required environment variables are not set: PUBLIC_PROJECT_ID, ORIGIN
    at Object.init (file://<repo>/apps/frontend/build/server/chunks/entries/hooks.server.js-B48ZaVdF.js:692:32)
    at file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3789:35
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Server.init (file://<repo>/apps/frontend/build/server/chunks/index.js-CmR3XFF9.js:3771:3)
    at async file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1264:1

Node.js v24.21.0
```

### `ORIGIN` set to the empty string

```
file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1193
		throw new Error(
		      ^

Error: Invalid ORIGIN: ''. ORIGIN must be a valid URL with http:// or https:// protocol. For example: 'http://localhost:3000' or 'https://my.site'
    at parse_origin (file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1193:9)
    at file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1246:16
    ... 3 lines matching cause stack trace ...
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {
  [cause]: TypeError: Invalid URL
      at new URL (node:internal/url:895:25)
      at parse_origin (file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1191:9)
      at file://<repo>/apps/frontend/build/server/chunks/handler-b_0c25qt.js:1246:16
      at ModuleJob.run (node:internal/modules/esm/module_job:561:25)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async node:internal/modules/esm/loader:647:26
      at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {
    code: 'ERR_INVALID_URL',
    input: ''
  }
}

Node.js v24.21.0
```

---

STUB_BODIES=minimal-valid-adapted
UPSTREAM_DEPENDENT_ROUTE=/
ROUTE_STUB_HTTP=200
STUB_REQUESTS_FROM_ROUTE=6
STUB_REQUESTS_FROM_HEALTH=0
UPSTREAM_CONNECT_CURL_EXIT=7
PAGE_SUPABASE_UNREACHABLE_HTTP=200
UPSTREAM_DISCRIMINATOR=inlined-fetches
ROUTE_WITH_STUB=6
ROUTE_WITH_REFUSED=0
HEALTH_SUPABASE_UNREACHABLE_HTTP=200
A13=held
BUILD_ID_UNSET=1791830151116
BUILD_ID_SET=0ec82ff4ddf9fe4b68bfa0264a859faafc7f8b76
BUILD_SHA_GIVEN=0ec82ff4ddf9fe4b68bfa0264a859faafc7f8b76
DIAGNOSTICS_DEFAULT_HTTP=404
DIAGNOSTICS_ENABLED_HTTP=200

# The built production server, outside Docker: health without the upstream, the build id, the diagnostics switch

Every status above was read from the command itself: an HTTP status from `curl -s -o <file> -w '%{http_code}'`, `UPSTREAM_CONNECT_CURL_EXIT` from curl's own exit status, a build's status from the build. The request counts are differences of the line count of the stub's log, taken before and after the request. None was read through a pipe.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12, 18:40:13Z to 18:44:36Z |
| Build under test | the build of the first part (no `BUILD_SHA`, id `1791830151116`) for everything up to and including the diagnostics switch; then the two rebuilds described under "The build id" |
| Server | `node ./apps/frontend/build/index.js` from the repository root, port 3181, free before every start |
| Stub | `node --input-type=module -e <code>` with `node:http` on `127.0.0.1:3182`, free before each start and after the last stop |
| Requests | `curl` to `http://127.0.0.1:3181`; the page route with `-L` |

No Supabase stack was started, stopped or contacted. "Unreachable" was produced by naming an address where nothing listens.

## How each environment was constructed

- **Every server start** ran as `env -i PATH=<node 24.21.0 bin>:/usr/bin:/bin:/usr/sbin:/sbin HOME=<home> PORT=3181 <the named variables> node ./apps/frontend/build/index.js`. The named variables were `PUBLIC_SUPABASE_URL` (the stub's address or the refusing address, as each section says), `PUBLIC_SUPABASE_ANON_KEY=unset-anon-key`, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` and `ORIGIN=http://localhost:3181`, and in one start `DEPLOYMENT_DIAGNOSTICS=true`. `DEPLOYMENT_DIAGNOSTICS` was not written in any other start.
- **The stub** ran under `env -i` with `PATH`, `HOME` and two variables of its own, the log path and the port.
- **The root `.env` was not opened, listed or printed.** That the server used the address it was given, and not another one, is shown by its behaviour: the stub on port 3182 received the page's reads when the server was given that address, and received nothing in any other start. That `DEPLOYMENT_DIAGNOSTICS` was unset in the default start is shown by the 404, with the 200 of the enabled start as its control.
- **The stub's log** is in a session scratch directory outside the repository. The copies quoted below were taken with `cp`.

## Step 1: a counting upstream that answers validly

### The stub's answers

Confirmed against `_getAppSettings`, `_getAppCustomization`, `_getElectionData`, `_getConstituencyData` and `fetchAllRows` as the tree stands, before the stub was started:

| Request | Answer | Why the caller accepts it |
|---------|--------|---------------------------|
| `GET` under `/rest/v1/` | 200, `content-type: application/json`, `content-range: */0`, body `[]` | `maybeSingle()` turns an empty array into no row; `fetchAllRows` ends on an empty page |
| `POST /rest/v1/rpc/project_open_for_voters` | 200, body `true` | with no settings row `_getAppSettings` asks this and returns the empty settings for `true` |
| anything else | 200, body `[]` | not reached in any run |

**The one adaptation (`STUB_BODIES=minimal-valid-adapted`).** The added rule, quoted from the stub:

> every answer carries `access-control-allow-origin: *`

It is one rule and the control was repeated once after it. It differs from the adaptation the plan describes in one respect: it is a header on every answer, not a body for one path. Why it was needed is in the table of what was tried, below. The stub as it ran in the recorded control:

```js
// A counting stand-in for the Supabase API. One line per request (method and url) is appended to
// the file named by STUB_LOG. The answers are the minimal ones the root load's four reads accept.
// Added rule: every answer carries `access-control-allow-origin: *`, which kit's server-side fetch
// of a universal load requires of a cross-origin answer.
import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';

const log = process.env.STUB_LOG;
const port = Number(process.env.STUB_PORT);
const CORS = { 'access-control-allow-origin': '*' };

const server = createServer((req, res) => {
  appendFileSync(log, `${req.method} ${req.url}\n`);
  // Drain the request body, if any, before answering.
  req.resume();
  req.on('end', () => {
    const pathname = (req.url ?? '').split('?')[0];
    if (req.method === 'POST' && pathname === '/rest/v1/rpc/project_open_for_voters') {
      res.writeHead(200, { 'content-type': 'application/json', ...CORS });
      res.end('true');
      return;
    }
    if (req.method === 'GET' && pathname.startsWith('/rest/v1/')) {
      res.writeHead(200, { 'content-type': 'application/json', 'content-range': '*/0', ...CORS });
      res.end('[]');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json', ...CORS });
    res.end('[]');
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`stub listening on 127.0.0.1:${port}`);
});
```

### Control: the stub sees the page's reads

The server was started with `PUBLIC_SUPABASE_URL=http://127.0.0.1:3182` and `/` was requested with `curl -L`.

| Value | Result |
|-------|--------|
| Final status (`ROUTE_STUB_HTTP`) | 200, no redirect followed |
| Requests the stub saw (`STUB_REQUESTS_FROM_ROUTE`) | 6 |
| (a) final status | 200 |
| (b) occurrences of `data-sveltekit-fetched` in the body | 6 |
| (c) lines the request added to the server's standard error | 7 |

The requests the stub saw, in order:

```
GET /rest/v1/app_settings?select=customization&project_id=eq.00000000-0000-0000-0000-000000000001
GET /rest/v1/app_settings?select=settings&project_id=eq.00000000-0000-0000-0000-000000000001
GET /rest/v1/elections?select=*%2Celection_constituency_groups%28constituency_group_id%29&project_id=eq.00000000-0000-0000-0000-000000000001&order=sort_order.asc%2Cid.asc&offset=0&limit=50000
GET /rest/v1/constituency_groups?select=*%2Cconstituency_group_constituencies%28constituency_id%29&project_id=eq.00000000-0000-0000-0000-000000000001&order=sort_order.asc%2Cid.asc&offset=0&limit=50000
POST /rest/v1/rpc/project_open_for_voters
GET /rest/v1/constituencies?select=*&project_id=eq.00000000-0000-0000-0000-000000000001&order=sort_order.asc%2Cid.asc&offset=0&limit=50000
```

These are the root load's four reads: the customization read, the settings read with the `project_open_for_voters` call that follows an absent row, the elections read, and the two reads of the constituency data. No path was answered wrongly for its caller: each read was made once, and all six answers were inlined into the page.

The seven lines of standard error are one log record:

```
{
  level: 50,
  time: 1791830514710,
  msg: 'A DataProvider returned an invalid result.',
  severityText: 'ERROR',
  attributes: { reason: 'empty', dataKey: undefined }
}
```

The page reports a project with no election (`reason: 'empty'`) and renders the application's error message. That is the valid answer of an empty project, not a failed read.

### Observation: the health route makes none

The server was stopped and started again with the same variables, so nothing was carried over. The stub's log held 6 lines. `GET /api/health` was sent three times.

| Request | Status | Seconds |
|---------|--------|---------|
| 1 | 200 | 0.012000 |
| 2 | 200 | 0.001741 |
| 3 | 200 | 0.001524 |

Lines added to the stub's log: 0 (`STUB_REQUESTS_FROM_HEALTH=0`). The same stub, in the same process, had counted the page's six reads a few seconds earlier, so it would have counted a read from the health route.

The server and the stub were then stopped by their own pids.

### What was tried first

The control was first run with the stub exactly as the plan lists it, with no `access-control-allow-origin` header. Its values are kept here and nowhere else:

    | Stub | Route | (a) final status | (b) inlined fetches | (c) server error lines | Requests the stub saw | From the health route |
    |------|-------|------------------|---------------------|------------------------|-----------------------|-----------------------|
    | the three rules of the plan, no CORS header | `/` | 200 | 0 | 7 | 16 | 0 |
    | the same with the one added rule (the recorded control) | `/` | 200 | 6 | 7 | 6 | 0 |

In the first run the stub saw each of four reads four times (the customization read, the settings read, the elections read and the constituency-groups read), no `project_open_for_voters` call and no constituencies read. The server's one log record said `reason: 'error'`. So the three rules answered every one of those paths wrongly for its caller, and each read failed and was retried.

The cause, read in the installed sources and then confirmed by the repeat: for a universal load running on the server, kit's `fetch` rejects a cross-origin answer that has no `access-control-allow-origin` header ("CORS error: No 'Access-Control-Allow-Origin' header is present on the requested resource", `@sveltejs/kit` 2.70.3, `src/runtime/server/page/load_data.js`), and the PostgREST client retries a `GET` whose fetch rejected three times (`@supabase/postgrest-js` 2.117.2, `src/fetchWithRetry.ts`). A real Supabase API sends that header. With the header added the same control gave six reads, each once, and six inlined answers.

The adaptation was made on the stub's log and the server's log record, before any request was sent to a server whose upstream refused. For the reader's judgment: without it, the three values for `/` would have been 200, 0 and 7 with the stub and 200, 0 and 7 with the upstream refusing, so nothing would have discriminated.

## Step 2: the configured upstream refuses a connection

| Check | Result |
|-------|--------|
| `curl -s -o /dev/null --max-time 5 http://127.0.0.1:9/` | exit status 7, could not connect (`UPSTREAM_CONNECT_CURL_EXIT=7`) |
| `lsof -nP -iTCP:9 -sTCP:LISTEN` | no line |

No other port was needed.

## Step 3: health with the upstream unreachable

The server was started with `PUBLIC_SUPABASE_URL=http://127.0.0.1:9`.

### Control: the same page route

`/` requested with `curl -L`:

| Value | With the stub answering | With the upstream refusing |
|-------|-------------------------|----------------------------|
| (a) final status | 200 | 200 (`PAGE_SUPABASE_UNREACHABLE_HTTP`) |
| (b) occurrences of `data-sveltekit-fetched` in the body | 6 | 0 |
| (c) lines added to the server's standard error | 7 | 7 |

The first value that differs, in the order status, inlined fetches, server error lines, is the second: `UPSTREAM_DISCRIMINATOR=inlined-fetches`, `ROUTE_WITH_STUB=6`, `ROUTE_WITH_REFUSED=0`. The route answers differently when the upstream answers and when it refuses, so the upstream is the cause. `/` discriminated, so `/contestant/login` was not tried.

Three further facts of the refused request, outside the three values:

- It took 14.48 seconds. The root load makes the customization read first and the other three together, and each failing `GET` is retried three times with waits of 1, 2 and 4 seconds.
- Its status is 200 and its body is the application's error message. A page's status does not show that the upstream is down.
- The server's log record says `reason: 'error'`, where the stub's run said `reason: 'empty'`. The count of lines is the same, which is why the third value does not differ:

```
{
  level: 50,
  time: 1791830558340,
  msg: 'A DataProvider returned an invalid result.',
  severityText: 'ERROR',
  attributes: { reason: 'error', dataKey: undefined }
}
```

### The health route

Requested on the same server, after the page request.

| Item | Value |
|------|-------|
| Status (`HEALTH_SUPABASE_UNREACHABLE_HTTP`) | 200 |
| Seconds | 0.005369 |
| Body | `{"status":"ok","build":"1791830151116"}` |

Under two seconds, with `status` equal to `ok`.

### Assumption A13

`A13=held`. The health route answered 200 in milliseconds with the upstream refusing, and made the counting stub see no request. Constructing the Supabase server client in `supabaseHandle` makes no network call for a request without cookies. `apps/frontend/src/hooks.server.ts` was not edited.

## The build id

| Leg | `BUILD_SHA` given to the build | Build status | Turbo summary | `build` at `/api/health` | `version` at `/_app/version.json` |
|-----|--------------------------------|--------------|---------------|--------------------------|-----------------------------------|
| unset | none | 0 | `Cached:    0 cached, 14 total` | `1791830151116` | `1791830151116` |
| set | `0ec82ff4ddf9fe4b68bfa0264a859faafc7f8b76` | 0 | `Cached:    0 cached, 14 total` | `0ec82ff4ddf9fe4b68bfa0264a859faafc7f8b76` | `0ec82ff4ddf9fe4b68bfa0264a859faafc7f8b76` |
| unset again | none | 0 | `Cached:    0 cached, 14 total` | `1791830668774` | `1791830668774` |

- **Unset leg** (`BUILD_ID_UNSET`): the build of the first part. Both routes answer the same string of digits, which is the build's time in milliseconds.
- **Set leg** (`BUILD_ID_SET`, `BUILD_SHA_GIVEN`): the value given was the output of `git rev-parse HEAD` at that moment, the commit of the first part of this record. Both routes answer exactly that sha.
- **Unset again:** the last build in the working tree. Both routes answer digits again, and a different number from the first build, so this is a new build and not the first one restored.
- Each of the three builds ran as `yarn build` from the repository root under `env -i` with `PATH`, `HOME`, a turbo cache directory of its own that was empty at the start, and `BUILD_SHA` only in the set leg. Every task of every build executed; nothing was replayed. Each ran in the background and was polled.
- Every status of the two routes in these legs was 200.

## The diagnostics switch

| Start | `GET /api/diagnostics` | Body |
|-------|------------------------|------|
| `DEPLOYMENT_DIAGNOSTICS` not given (`DIAGNOSTICS_DEFAULT_HTTP`) | 404 | `{"message":"Error: 404"}` |
| `DEPLOYMENT_DIAGNOSTICS=true` (`DIAGNOSTICS_ENABLED_HTTP`) | 200 | `{"origin":"http://localhost:3181","clientAddress":"127.0.0.1","clientAddressError":null,"headers":{"host":"127.0.0.1:3181"}}` |

- The body's `origin` equals the `ORIGIN` given, `http://localhost:3181`, although the request's `host` header was `127.0.0.1:3181`. The origin comes from the variable, not from the request.
- The enabled response carries `cache-control: no-store`.
- The address the body reported is `127.0.0.1`. The enabled server's whole captured output, standard output and standard error together, is 33 bytes, the line `Listening on http://0.0.0.0:3181`. It was searched for the reported address and does not hold it. No visitor address was written to a log.

## Processes and ports at the end

Seventeen processes were started by this plan across both parts (fifteen servers and two stubs), each recorded by pid when it started. All seventeen are gone (`kill -0` fails for each). Every one that did not end by itself was stopped with `SIGTERM` to its own pid; none needed `SIGKILL`. Nothing listens on ports 3181, 3182 or 9.
