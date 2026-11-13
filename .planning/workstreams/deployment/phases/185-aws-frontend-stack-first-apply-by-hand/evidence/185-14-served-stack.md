# 185-14: what the applied stack serves and how it is built (runbook Steps 7 and 8)

Recorded 2026-11-13 (UTC), from 11:02. Read-only: nothing was planned for apply, applied, changed
or destroyed. Run in the operator's administrator session (`AWS_PROFILE=openvaa-admin`, the key
variables unset, region `eu-north-1`); the account check read `471112560111` before every Terraform
and AWS call (`account_read_exit=0`, `account_match_exit=0` each time). Every describe output, page
body, header file and `terraform show -json` stayed in a `umask 077` directory outside the
repository (`$L`), was printed by role, and was removed at the end. No IP address is written here.

The stack read is the one plan 185-13 brought up in two applies (39 creates, then the one-create
follow-up of the CloudFront ingress rule, whose description now reads
`HTTPS from the CloudFront origin-facing prefix list.`). The service runs task definition revision
1, one task of one desired, one deployment.

## Task 1: the certificates, the redirect and a voter page (Step 7, items 1 to 4, 11:02 to 11:04)

```
VIEWER_CERT=ISSUED method=DNS region=us-east-1
ORIGIN_CERT=ISSUED method=DNS region=eu-north-1
HTTP_REDIRECT=301 location=https://staging.openvaa.org/
TLS_VERIFIES=yes
PAGE_PROJECT_ID=00000000-0000-0000-0000-000000000001
SSR_READS_SUPABASE=yes home=5 questions=5
SMOKE_STATEMENT_SEEN=yes statement="Public transport should be free of charge in cities." path=/questions/__first__
TASK_ENV_EQUALS_LIST=yes names=16 parameters=ANALYTICS_POSTHOG_KEY,PUBLIC_SUPABASE_ANON_KEY
```

- **Item 1.** `terraform init -lockfile=readonly` exit 0; the outputs read (`s7_outputs_read_exit=0`).
- **Item 2, the certificates.** `aws acm describe-certificate` exit 0 for both.
  - The viewer's, in `us-east-1`: `staging.openvaa.org`, the only name, one validation
    `DNS:SUCCESS`, issued 2026-11-13T09:43:12Z.
  - The origin's, in `eu-north-1`: `origin.staging.openvaa.org`, the only name, one validation
    `DNS:SUCCESS`, issued 2026-11-13T09:43:05Z.
  - Both issued inside the first apply, as plan 185-13 recorded.
- **Item 3, the redirect and the chain.** `http://staging.openvaa.org/` answered
  `301 location=https://staging.openvaa.org/` (curl exit 0). `https://staging.openvaa.org/`, without
  `-k`: `ssl_verify_result=0`, curl exit 0, so the chain verifies against the system's trust store.
- **Item 4, the voter pages.** `/` and `/questions`, each followed through its redirects, curl exit 0.
  - `s7_home=200 https://staging.openvaa.org/` and `s7_questions=200 https://staging.openvaa.org/questions`.
  - Both carry `data-project-id="00000000-0000-0000-0000-000000000001"` on `<body>`.
  - Each inlines five `data-sveltekit-fetched` responses whose `data-url` is on the hosted project's
    REST host (`<PUBLIC_SUPABASE_URL>/rest/v1/`): `app_settings` twice (customization, settings),
    `elections`, `constituency_groups` and `constituencies`, each filtered on
    `project_id=eq.00000000-0000-0000-0000-000000000001`. The task therefore read the hosted
    project with the anon key it received from the parameter store.
  - **The statements were not in the server's HTML** (`s7_questions_html_statements=0`). The
    `(located)` layout sets its `ready` flag in an `$effect` once the question and nomination data
    have resolved, which happens only in the browser, so the server's render of `/questions` shows
    the loading state. The runbook's item 4 searched the server's HTML for them and could not succeed
    as written; see the deviation in the plan's summary.
  - The page was therefore rendered in a headless browser, the Chromium of the repository's
    Playwright (`@playwright/test`, already installed; nothing was installed). This is the item as
    the runbook now gives it, run in that form: `s7_rendered=200
    https://staging.openvaa.org/questions/__first__`, `s7_render_exit=0`, and
    `s7_statement_seen=Public transport should be free of charge in cities.`, under the counter
    `1/6`. That is the first of the smoke dataset's six statements
    (`packages/dev-seed/src/templates/smoke.ts`), on the page the client navigated `/questions` to.
- **The task's environment.** `aws ecs describe-services` and `describe-task-definition` exit 0,
  read by name only. The container's `environment` and `secrets` names together equal the names of
  `infra/modules/frontend-service/task-environment.json` (`cmp` exit 0, 16 names). The two
  `secrets` are the list's two `parameter` entries, so the task that rendered these pages was
  started with exactly the list's variables.

## Task 2: the form post, the caching pattern and the health check (Step 7, items 5 to 7, 11:06 to 11:07)

```
FORM_POST_PUBLIC_ORIGIN=405
FORM_POST_FOREIGN_ORIGIN=403 cross-site-text=yes
FORM_POST_ACTION_PUBLIC_ORIGIN=400 path=/contestant/login/email
FORM_POST_ACTION_FOREIGN_ORIGIN=403 cross-site-text=yes
PAGE_FIRST=Miss from cloudfront age=absent
PAGE_SECOND=Miss from cloudfront age=absent
PAGE_CACHE_CONTROL=absent
IMMUTABLE_FIRST=Miss from cloudfront
IMMUTABLE_SECOND_HIT=yes
IMMUTABLE_CACHE_CONTROL=public,max-age=31536000,immutable
ERROR_RESPONSES=11 codes=400,403,404,405,414,416,500,501,502,503,504 ErrorCachingMinTTL=0
TARGET_HEALTH_PATH=/api/health
GRACE_PERIOD=60
TARGET_STATE=healthy
```

- **Item 5, the origin check of a form post.** `/contestant/login`, followed through its redirects,
  resolved to `s7_login_path=/contestant/login` (curl exit 0). Each post carried a browser's
  form-submission `Accept` header and the body `email=nobody%40example.test&password=not-a-password`,
  which names no account.
  - With `Origin: https://staging.openvaa.org`: `405` (curl exit 0). SvelteKit makes its origin check
    before it routes a request, so a post the check refused would be 403. The 405 is the routing's
    own answer: since the sign-in screen moved to its own address, `/contestant/login` holds two links
    and no form action.
  - With `Origin: http://attacker.example`: `403`, and the body holds
    `Cross-site POST form submissions are forbidden` once (`s7_cross_site_text=1`).
  - **Beside the runbook's item,** the same two posts to the sign-in screen's own address,
    `/contestant/login/email`, whose default action signs in with the posted address and password:
    with the public origin `400`, the action's own `fail` for credentials that sign nobody in, and no
    cross-site text; with the foreign origin `403` and the cross-site text once. So a post with the
    public origin reaches the action through CloudFront and the load balancer. This was one failed
    password sign-in against the hosted project's Auth for an address that does not exist; nothing
    was written. `infra/local/check-proxy-topology.sh` also posts to `/contestant/login`
    (`LOGIN_ROUTE`), so its leg 3 reads the same 405.
- **Item 6, the edge cache.**
  - The page `https://staging.openvaa.org/`, twice: `Miss from cloudfront age=absent` both times
    (curl exit 0). The origin sent no `cache-control` on it.
  - The asset `/_app/immutable/entry/start._C5OoPLf.js`, taken from the page, twice: the first
    `Miss from cloudfront`, the second `Hit from cloudfront` (curl exit 0 both). Its `cache-control`
    is `public,max-age=31536000,immutable`.
  - `aws cloudfront get-distribution-config` exit 0: 11 custom error responses, for 400, 403, 404,
    405, 414, 416, 500, 501, 502, 503 and 504, each with `ErrorCachingMinTTL` 0
    (`s7_error_responses=11 min_ttls=0`). No error page was provoked to watch it not being cached;
    the TTL is read from the configuration, as the plan's assumption states.
- **Item 7, the health gate.** `aws ecs describe-services`, `elbv2 describe-target-groups` and
  `describe-target-health` exit 0: the service's `healthCheckGracePeriodSeconds` is 60, the target
  group's `HealthCheckPath` is `/api/health`, and its one target is `healthy`.

`s7_logs_removed=yes`: the step's `$L` was removed after item 7.
