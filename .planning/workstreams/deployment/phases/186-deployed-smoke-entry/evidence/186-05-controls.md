# 186-05 evidence: the three negative controls of the deployed smoke gate

- **Date (UTC):** 2026-11-14 (local date 2026-11-15)
- **Commit (`git rev-parse HEAD`):** `a43a3ac9db308410bcf3752c392e725a65a824df` for every run below
- **Run form:** plan 186-02's: `env -u SUPABASE_SERVICE_ROLE_KEY -u SUPABASE_SECRET_KEY SMOKE_EXPECTED_SHA=<sha> PLAYWRIGHT_JSON_OUTPUT_FILE=<dir>/results.json PLAYWRIGHT_HTML_OUTPUT_DIR=<dir>/html yarn test:e2e:deployed --output <dir>/results > <dir>/smoke.log 2>&1`, no spec argument, in the background, its status read from `$?` on the next line and written to `<dir>/exit-status.txt`.
- **Root `.env`:** never read; neither the deployed config nor its global setup loads it.

Every status below was read directly, never through a pipe. No key value appears in this file.

## Control 1: a wrong expected SHA against staging

```
DEPLOYED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30
SERVED_BUILD=712947a1bd44a735f66ee8f51610f4748d76cd30
CONTROL_SHA_EXPECTED=a43a3ac9db308410bcf3752c392e725a65a824df
```

`DEPLOYED_SHA` is `image_tag` of `infra/envs/staging/aws/terraform.tfvars`. `SERVED_BUILD` is the `build` field of `curl -s https://staging.openvaa.org/api/health` (`{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`), read just before the run: the two are equal, so staging had not been redeployed. `CONTROL_SHA_EXPECTED` is `git rev-parse HEAD`, a valid 40-hex commit id that differs from `DEPLOYED_SHA`.

Target `https://staging.openvaa.org` (`SMOKE_BASE_URL` unset). Run window 2026-11-14T23:16:34Z to 23:16:35Z.

```
CONTROL_SHA_RUN_DIR=tests/e2e-runs/186-05-sha-20261114T231634Z
CONTROL_SHA_EXIT=1
```

The gate's lines and the headline, quoted from `smoke.log`:

```
DEPLOYED SMOKE GATE https://staging.openvaa.org
PASS service-role-key-absent
FAIL sha: observed 712947a1bd44a735f66ee8f51610f4748d76cd30, expected a43a3ac9db308410bcf3752c392e725a65a824df
PASS ref
PASS project-id
Error: DEPLOYED SMOKE GATE FAILED — 1 of 4 checks failed
  FAIL sha: observed 712947a1bd44a735f66ee8f51610f4748d76cd30, expected a43a3ac9db308410bcf3752c392e725a65a824df
See tests/README.md § Deployed smoke run.
```

The error was thrown at `deployed-global-setup.ts:27`, in global setup: no spec ran.

## The unit refusals beside the controls

`node_modules/.bin/vitest run --config tests/vitest.config.ts deployedTarget`, run 2026-11-14T23:16:39Z:

```
SUPA09_UNIT_EXIT=0
SUPA09_UNIT_CASES=76 passed (76), 1 test file
```

Those 76 cases of `tests/tests/utils/deployedTarget.test.ts` refuse a made-up ref, the production ref `begckvkapaopoztbreqc`, the local stack by address and by name (`http://127.0.0.1:54321`, `http://localhost:54321`), foreign and malformed hosts, a document with no env block or an unparsable one, and every environment key that might widen the ref ("no input widens the ref": a foreign ref is still refused when every input names it, and a crowded environment gives the same checks as the expected commit alone). That the run cannot be pointed at a production project rests on these refusals: the expected ref is read only from the committed `infra/envs/staging/supabase/terraform.tfvars`, never from an input.
