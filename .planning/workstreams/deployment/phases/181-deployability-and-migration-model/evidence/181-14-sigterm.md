PID1_COMMAND=node ./apps/frontend/build/index.js
SLOW_REQUEST_SECONDS_NO_SIGNAL=12.0
IN_FLIGHT_HTTP=200
SECONDS_TO_EXIT=9.1
CONTAINER_EXIT_CODE=0
EXITS_AFTER_DRAIN=yes
CONTROL_PID1_COMMAND=node ./apps/frontend/build/index.js
CONTROL_IN_FLIGHT=HTTP 200 after 12.0 s, curl exit 0
CONTROL_SECONDS_TO_EXIT=9.1
CONTROL_EXIT_CODE=0
SIGTERM_LEG_EXIT=0

# The stop signal reaching the production server

Every value above is from the second run of `bash infra/local/check-proxy-topology.sh --out tmp/181-14/run2 --sigterm`, whose own exit status was 0. The status was written to a file by the command that ran the script and read from that file. An HTTP status is curl's `%{http_code}` for that request. An exit code is `docker inspect --format '{{.State.ExitCode}}'` of the stopped container. The seconds to exit are the wall time of `docker stop -t 40 <container>`, which returns when the container has exited.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-14, 21:31:33Z to 21:32:27Z |
| Image | `openvaa-proxy-check-frontend:latest`, id `sha256:09722451198b…`, the image plan 181-13 built with `BUILD_SHA=d2c6ae678aae7e5fe20207a089c271f79669d4f3`. It was reused; nothing was built for this leg. |
| Proxy | `nginx@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94` (nginx 1.30.5), `proxy_request_buffering off` |
| Entry point of the image | `docker-entrypoint.sh` of `node:24-alpine`, which ends in `exec "$@"`, and the exec-form `CMD ["node", "./apps/frontend/build/index.js"]` |
| Backend | none: `PUBLIC_SUPABASE_URL` names the closed port `http://127.0.0.1:9`, the compose file's default |
| Signal | `docker stop -t 40`, sent 2 s after the upload started. 40 s is above adapter-node's `SHUTDOWN_TIMEOUT` of 30 s. |

## The slow request

A form body of 36000 bytes (a login form with a padding field, naming no real account) is posted to the login action `/contestant/login` as the public origin, with `curl --limit-rate 3000`. The proxy passes the body on as it arrives, so the request is open at Node until the last byte. The post asks for JSON (`Accept: application/json`), so the action's answer is not followed by a page render that would wait on the unreachable backend. Kit answers an action's JSON request with status 200 and the action's own result in the body; here that result is `{"type":"failure","status":400,"data":"-1"}`, the login's failure with no backend, which the server log names `Candidate login failed: fetch failed`.

With no signal the request took 12.0 s and was answered 200. That is inside the 8 to 20 s window the leg requires, so the first size and rate the script tries was enough: assumption A11 held, and no application route was changed.

## What the signal did

- Process 1 of the container is `node ./apps/frontend/build/index.js`, so `docker stop` delivers `SIGTERM` to Node.
- The request that was open when the signal arrived ended with 200 and the same body as with no signal, after 12.0 s in all. A connection cut by the server would read as 502 from nginx or 000 from curl.
- The container exited 9.1 s after the stop, with exit code 0, not 137. The upload had about 10 s left when the signal was sent, so Node finished the request and then ended with nothing holding its event loop. The stop did not reach the 40 s timeout, and no `SIGKILL` was sent.

So `EXITS_AFTER_DRAIN=yes`: adapter-node drains on `SIGTERM`, emits `sveltekit:shutdown` and never calls `process.exit`, and this application holds nothing open after that, so the process exits by itself.

## The control: a shell-form entry point

The override file the script wrote replaces the entry point with `["/bin/sh", "-c", "node ./apps/frontend/build/index.js"]`, which is how a shell-form `CMD` would start the server. On `node:24-alpine`, `/bin/sh` is BusyBox `ash`, and it replaces itself with the last command of a `-c` string: process 1 was `node`, not a shell. So the control behaved like the exec form: the in-flight request ended 200, and the container exited 9.1 s after the stop with code 0.

The control therefore does not show the failure the exec form guards against on this base image. That failure needs a shell that stays process 1 and does not forward the signal, for example a shell-form command of more than one command, or a base image whose `sh` does not replace itself with the last command. Neither was run. The exec form does not depend on the shell's behaviour, which is why the Dockerfile keeps it.

## Runs

| Run | Command | Exit status | Note |
|-----|---------|-------------|------|
| 1 | `check-proxy-topology.sh --out tmp/181-14/run1 --sigterm` | 1 | Every observation was the same as in run 2, but `sigterm.exit.by-itself` read FAIL on `exit code 0 after 9,1 s`: awk printed the seconds with the host's decimal comma (`LC_NUMERIC=fi_FI.UTF-8`) and then compared `9,1` with 35 as strings, where `9` sorts after `3`. The script's numeric awk calls now run under `LC_ALL=C`. No expectation was changed. |
| 2 | `check-proxy-topology.sh --out tmp/181-14/run2 --sigterm` | **0** | The run recorded above. |
| 3 | `check-proxy-topology.sh --out tmp/181-14/full` (no `--sigterm`, no `--with-login`) | **0** | Observations 1 to 3, 5 and 6 of plan 181-13 on the changed script: 15 PASS, 0 FAIL, the login `NOT-RUN` because it was not requested. Its two builds rebuilt `openvaa-proxy-check-frontend:latest` with the same `BUILD_SHA=d2c6ae678…` (new id `sha256:2b4e2dd4124c…`); the control build's `yarn install` was not served from cache and took 481 s. |

After run 3 no container of the project `openvaa-proxy-check` exists and nothing listens on port 8181. The frontend image and the pinned nginx image are kept.

## summary.txt of the run, pasted

```
sigterm.pid1 | expected: begins with node | observed: node ./apps/frontend/build/index.js | PASS
sigterm.slow-request.no-signal.seconds | expected: 8 to 20 | observed: 12.021508 (36000 bytes at 3000 B/s, HTTP 200) | PASS
sigterm.in-flight.open-at-signal | expected: the upload outlasts the 2 s before the stop | observed: 12.034119 s | PASS
sigterm.in-flight.status | expected: 200 | observed: 200 | PASS
sigterm.exit.by-itself | expected: an exit code other than 137 in under 35 s | observed: exit code 0 after 9.1 s | PASS
sigterm.control.shell-form.pid1 | expected: recorded | observed: node ./apps/frontend/build/index.js | RECORDED
sigterm.control.shell-form.in-flight | expected: recorded | observed: HTTP 200 after 12.013983 s (curl exit 0) | RECORDED
sigterm.control.shell-form.exit | expected: recorded | observed: exit code 0 after 9.1 s | RECORDED
```

## 07-sigterm.txt of the run, pasted

```
image: sha256:09722451198b2451bc633e612dd8211505199d025775d9f4109b064c3c4d3e87, BUILD_SHA d2c6ae678aae7e5fe20207a089c271f79669d4f3
Dockerfile CMD of the production stage: CMD ["node", "./apps/frontend/build/index.js"]
the login action: POST /contestant/login
process 1 of the frontend container: node ./apps/frontend/build/index.js
duration control, no signal:
  36000 bytes at 3000 B/s -> HTTP 200 after 12.021508 s, curl exit 0, body: {"type":"failure","status":400,"data":"-1"}
run 'sigterm':
  process 1: node ./apps/frontend/build/index.js
  upload of 36000 bytes at 3000 B/s started; the stop was sent 2 s later, with a timeout of 40 s
  upload -> HTTP 200 after 12.034119 s, curl exit 0, body: {"type":"failure","status":400,"data":"-1"}
  docker stop exit 0, 9.1 s from the stop to the container's exit
  container: exit code 0, OOMKilled false, started 2026-10-14T21:31:33.723270597Z, finished 2026-10-14T21:32:12.796314503Z
control, entry point /bin/sh -c "node ./apps/frontend/build/index.js" (override: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/tmp/181-14/run2/shell-form.override.yml):
run 'shell-form-control':
  process 1: node ./apps/frontend/build/index.js
  upload of 36000 bytes at 3000 B/s started; the stop was sent 2 s later, with a timeout of 40 s
  upload -> HTTP 200 after 12.013983 s, curl exit 0, body: {"type":"failure","status":400,"data":"-1"}
  docker stop exit 0, 9.1 s from the stop to the container's exit
  container: exit code 0, OOMKilled false, started 2026-10-14T21:32:14.301283671Z, finished 2026-10-14T21:32:26.784932552Z
```

## The shutdown decision

SHUTDOWN_HANDLER=not-needed
A13_PROCESS_EXIT=held

The process exits by itself after draining (exit code 0, 9.1 s after the stop, with the request in flight answered), so no `sveltekit:shutdown` listener that ends the process is added, and phase 182 attaches its own listener for the relay's flush.
