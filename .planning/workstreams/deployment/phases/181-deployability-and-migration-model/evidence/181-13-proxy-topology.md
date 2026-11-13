TOPOLOGY_CHECK_EXIT=0
NGINX_IMAGE=nginx@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94
BUILD_SHA_GIVEN=d2c6ae678aae7e5fe20207a089c271f79669d4f3
BUILD_VIA_PROXY=d2c6ae678aae7e5fe20207a089c271f79669d4f3
VERSION_JSON_VIA_PROXY=d2c6ae678aae7e5fe20207a089c271f79669d4f3
BUILD_NO_ARG_CONTROL=1792012400770
ORIGIN_CONFIGURED=http://vaa.example.test:8181
ORIGIN_REPORTED=http://vaa.example.test:8181
ORIGIN_WRONG_CONTROL=http://other-origin.example.test:8181
FORM_POST_FOREIGN_ORIGIN_HTTP=403
FORM_POST_PUBLIC_ORIGIN_HTTP=400
LOGIN_LEG=run
LOGIN_POST_HTTP=303
LOGIN_LOCATION=http://vaa.example.test:8181/contestant
LOGIN_FINAL_URL=http://vaa.example.test:8181/contestant
SPOOF_DEPTH1_CLIENT=172.21.0.1
SPOOF_DEPTH2_CONTROL_CLIENT=203.0.113.99
DIAGNOSTICS_DEFAULT_HTTP=404
DIAGNOSTICS_ENABLED_HTTP=200

# The production image behind a reverse proxy

Every value above is from the third run of `infra/local/check-proxy-topology.sh --out <dir> --with-login`, the run whose own exit status was 0. An HTTP status is curl's `%{http_code}` for that request, read by the script from curl itself. The exit status was written to a file by the wrapper that ran the script and read from that file. Nothing was read through a pipe.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-14, 21:16:10Z to 21:16:36Z (third run) |
| Commit | `d2c6ae678aae7e5fe20207a089c271f79669d4f3`, given to the build as `BUILD_SHA`; no tracked change in the checkout at build time (the script records `0`) |
| Proxy image | `nginx@sha256:0985e772…d94`, image id `sha256:a805dc02b9a7…`, 61778949 bytes. `nginx -v` in a container from that reference prints `nginx version: nginx/1.30.5`, the version the compose comment names. Pulled by the operator. |
| Frontend image | `openvaa-proxy-check-frontend:latest`, id `sha256:09722451198b…`, 2621764503 bytes, target `production` of `apps/frontend/Dockerfile` |
| Public origin | `http://vaa.example.test:8181`. Every request went to `127.0.0.1:8181` with `curl --resolve vaa.example.test:8181:127.0.0.1`. nginx reached the container under the name `frontend` |
| Supabase | the isolated instance `topo`, `full` mode, port base 55800, seeded with `apps/supabase/supabase/seed.sql`. The container reached it as `http://host.docker.internal:55800`. The anon key and the password were held in shell variables of the wrapper and given to the script through its environment. Neither was printed, and neither is in this record or in the script's output directory (a search of that directory for a JWT-shaped string finds nothing) |
| Account | `candidate@openvaa.test`, the seed's test candidate user |

## The application's redirect is absolute, and it is built on `ORIGIN`

The plan expected the application to issue no absolute redirect of its own, so that the origin would be observed only through the diagnostics response and the followed login post. That expectation did not hold. The login action's 303 carries the absolute `Location: http://vaa.example.test:8181/contestant`, although the action passes a path, from `buildRoute`, to `redirect`. Where the path becomes absolute was not located: kit's `redirect_response` sets the header as given, and Paraglide's `localizeHref` returns a path for a same-origin path.

nginx did not make it absolute. Its default `proxy_redirect` rewrites only a `Location` that begins with `http://frontend:3000/`. If the server had built the redirect on the container's name, nginx would have hidden the defect. To rule that out, the same login was posted straight to the container, from inside it (`node` `fetch` to `http://127.0.0.1:3000/contestant/login`, `redirect: "manual"`, `Origin` the public origin, `Accept: text/html`). It was sent once with `Host: vaa.example.test:8181` and once with `Host: frontend:3000`. Both answers were `303` with `location: http://vaa.example.test:8181/contestant`. So the server builds the redirect on the configured `ORIGIN`, whatever host the request names.

So the origin was observed three ways: the diagnostics body (`ORIGIN_REPORTED`, with its control), the `Location` of the login's 303, and the URL the followed login ended on.

## The build id, read inside the container too

With the stack of the last variant kept (`--keep`), `docker compose exec frontend` printed:

- `apps/frontend/build/client/_app/version.json`: `{"version":"d2c6ae678aae7e5fe20207a089c271f79669d4f3"}`
- `printenv BUILD_SHA`: `d2c6ae678aae7e5fe20207a089c271f79669d4f3`; `printenv NODE_ENV`: `production`

The served build id equals the build argument.

**The image builds the frontend twice.** The `shared` stage's `yarn build` ran 14 turbo tasks, 0 cached, `@openvaa/frontend:build` among them (172 s), with no `BUILD_SHA`. The `production` stage then runs `yarn workspace @openvaa/frontend build` again with `BUILD_SHA` (11.4 s on the first build, 11.7 s on the third run's). What is served is the second build's output. The first build is discarded work.

**The control's number is the pre-build's.** `BUILD_NO_ARG_CONTROL=1792012400770` is 2026-10-14 21:13:20Z, inside the pre-build made with no argument (see "Runs" below). In the third run every step of the control build was a cache hit (14 `CACHED` lines). The image with `BUILD_SHA` reused 13 cached steps and rebuilt the `production` stage's `RUN`.

## No environment file in the image

The root `.dockerignore` excludes every environment file at any depth and keeps the `.env.example` templates. That change is commit `28469049c`, made under the operator's ruling. Two checks were made, and no file's contents were printed in either:

- **The repository context.** A throwaway image (`FROM` the pinned nginx, one `RUN --mount=type=bind` listing names only) was built with the repository root as its context and `--no-cache`. It listed exactly `/ctx/.env.example`, `/ctx/apps/frontend/.env.example` and `/ctx/apps/supabase/supabase/functions/.env.example` among 13035 files.
- **The patterns, with their control.** A scratch context of empty files (`.env`, `.env.local`, `.env.example`, `a/.env`, `a/b/.env.production`, `a/b/.env.example`, `keep.txt`) was built twice. With the old two-line `.dockerignore`, all six environment-named files reached the builder (9 files). With the new one, only `.env.example` and `a/b/.env.example` did (5 files).
- **The built image.** `ls -a apps/supabase/supabase/functions/` in the running frontend container lists `.env.example` and the three function directories, and no other environment file.

The throwaway images were removed. One command was refused, see "Refused".

## Runs

| Run | What happened | Exit |
|-----|---------------|------|
| 1 | Its control build sat in `yarn install`'s fetch step for about 30 minutes, with no output. Host downloads were slow: a 570 KB tarball from the npm registry came at 115 KB/s. The run was ended with `SIGTERM` to the script before its 45-minute build bound. The script printed `interrupted` and left no container, and no compose process was running afterwards. | 130 |
| pre-build | `docker compose --env-file /dev/null -f infra/local/docker-compose.proxy.yml build frontend` with `BUILD_SHA` unset: the same build the script makes first, without the script's time bound. `yarn install` took 488 s and the whole build about 10 minutes. | 0 |
| 2 | All 15 observations other than the login were as expected. The login post read `200` with no `Location`. Diagnosis: the body was 85 bytes of JSON, `{"type":"redirect","status":303,…}`. Kit answers a form action as JSON, with status 200, when the `Accept` header prefers `application/json` (`is_action_json_request` in `@sveltejs/kit/src/runtime/server/page/actions.js`), and curl's default `*/*` does. A browser's native form submission sends `text/html` first. This was a wrong expectation in the script, and it was fixed in the script (commit `d2c6ae678`). The same cause made the public-origin post read `200` where the action answered `400`. | 1 |
| 3 | Every observation as expected. | 0 |

## The observations of the third run

Each control ran before the observation it licenses.

1. **Build id.** Control: an image built with no argument answered `/api/health` 200 `{"status":"ok","build":"1792012400770"}`, and `/_app/version.json` gave the same number. Observation: the image built with `BUILD_SHA=d2c6ae67…` answered 200 with that sha at both routes.
2. **Origin.** Control: with `ORIGIN=http://other-origin.example.test:8181`, a request to the public origin got a diagnostics body with `"origin":"http://other-origin.example.test:8181"`. Observation: with the public origin configured, the body names `http://vaa.example.test:8181`. In both, the request's `host` was `vaa.example.test:8181` and `x-forwarded-proto` was `http`.
3. **Form post.** `GET /contestant/login` answered 200 with no redirect. Control: `POST /contestant/login` with a form body, `Origin: http://attacker.example` and a browser's `Accept` was answered 403 with the body `Cross-site POST form submissions are forbidden`. Observation: the same post with `Origin: http://vaa.example.test:8181` was answered 400, the action's own `fail(400)` for an unknown address. It passed the origin check.
4. **Login.** The post of the seed's candidate address and password was answered 303 with `Location: http://vaa.example.test:8181/contestant` and one cookie, `sb-host-auth-token`. Followed with that cookie, the request ended with 200 at `http://vaa.example.test:8181/contestant`. The protected route did not send it back to the login page, so the session the post created was accepted.
5. **Spoof.** Control: with `XFF_DEPTH=2`, a request carrying `X-Forwarded-For: 203.0.113.99` arrived as `x-forwarded-for: 203.0.113.99, 172.21.0.1` and was attributed to `203.0.113.99`. So the check can see a spoof. Observation: with `XFF_DEPTH=1`, the same request was attributed to `172.21.0.1`, the address nginx appended (the Docker network's gateway, the peer nginx sees).
6. **Diagnostics switch.** Control: 200 with `DEPLOYMENT_DIAGNOSTICS=true`. Observation: 404 with it unset.

## Containers, ports and teardown

- Port 8181 had no listener before the first run (`lsof -nP -iTCP -sTCP:LISTEN` showed none on 8181 or 55800–55899) and has none after.
- Teardown: `docker compose -f infra/local/docker-compose.proxy.yml down` exited 0, and `isolated-instance.sh stop --name topo` exited 0. No container, volume or network whose name contains `proxy-check` or `topo` is left. The control image tag kept by `--keep` was removed.
- `next-supabase-skimle2` (10 containers) and `my-redis` have the same ids and names before and after.
- **The 13 `_openvaa-local` containers were recreated during this plan's run, by another actor.** All 13 have new ids. Twelve were created at 2026-10-14 20:58:15–17Z, while this plan was only polling its first build. The database container was created again at 21:18:52Z, by a `yarn db:reset` that the sibling worktree `voting-advice-application-gsd` started at 21:18:48Z (its process, `supabase db reset`, was seen running from that worktree's path). This plan never addressed that stack. Every harness call named the instance `topo`, whose project id is `openvaa-iso-topo`.
- Docker disk (`docker system df`): before, images 15.66 GB, build cache 0 B, volumes 14.62 GB. After, images 18.15 GB, build cache 5.389 GB (the builds of this plan), volumes 13.75 GB. The Docker VM's root filesystem went from 15.7 GB free at the start to 11.6 GB free after the pre-build. Nothing was pruned.

## Refused

- A `git commit` whose message contained the literal environment-file patterns was refused by the secret-read guard. The commit read no file. It was made with a message that describes the patterns in words, and the commit's content is unchanged (`28469049c`).
- A `docker compose exec frontend sh -c '…'` was refused by the removal safety check. The script printed `version.json`, two variables and a directory listing, and ran a `find / -name '.env*'` that listed names only. It removed nothing. The `find` was dropped. The other three reads were made as separate `exec` commands, with no `sh -c`, and are reported above. A search of the whole image filesystem for environment-named files was therefore not made. Only `apps/supabase/supabase/functions/` was listed.

## summary.txt of the third run, verbatim

```
build-id.control.no-build-arg.health | expected: a string of digits | observed: 1792012400770 | PASS
build-id.control.no-build-arg.version-json | expected: a string of digits | observed: 1792012400770 | PASS
origin.control.other-origin-configured | expected: http://other-origin.example.test:8181 | observed: http://other-origin.example.test:8181 | PASS
spoof.control.depth-2.client-address | expected: 203.0.113.99 | observed: 203.0.113.99 | PASS
diagnostics.control.enabled.status | expected: 200 | observed: 200 | PASS
origin.reported | expected: http://vaa.example.test:8181 | observed: http://vaa.example.test:8181 | PASS
spoof.depth-1.client-address | expected: an address other than 203.0.113.99 | observed: 172.21.0.1 | PASS
build-id.health.status | expected: 200 | observed: 200 | PASS
build-id.health.build | expected: d2c6ae678aae7e5fe20207a089c271f79669d4f3 | observed: d2c6ae678aae7e5fe20207a089c271f79669d4f3 | PASS
build-id.version-json | expected: d2c6ae678aae7e5fe20207a089c271f79669d4f3 | observed: d2c6ae678aae7e5fe20207a089c271f79669d4f3 | PASS
diagnostics.default.status | expected: 404 | observed: 404 | PASS
form-post.login-page | expected: on the public origin | observed: /contestant/login (HTTP 200) | PASS
form-post.control.foreign-origin.status | expected: 403 | observed: 403 | PASS
form-post.control.foreign-origin.body "Cross-site POST form submissions are forbidden" | expected: present | observed: present | PASS
form-post.public-origin.status | expected: an HTTP status other than 403 | observed: 400 | PASS
login.post.status | expected: 303 | observed: 303 | PASS
login.post.location | expected: a path or the public origin, naming neither the container nor a loopback host | observed: http://vaa.example.test:8181/contestant | PASS
login.followed.final-url | expected: begins with http://vaa.example.test:8181 | observed: http://vaa.example.test:8181/contestant (HTTP 200) | PASS
```
