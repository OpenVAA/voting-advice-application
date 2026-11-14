# Staging AWS root: runbook

This root holds the staging application's AWS resources: the network, the load balancer and its
certificate, the Fargate service that runs the frontend's image, the CloudFront distribution in front
of it and its certificate, the records of both certificates and of the site in the delegated zone,
the service's scaling, and the alert that mails a failed rollout. Its state is the object
`pipeline/staging/aws/terraform.tfstate` in the state bucket.

It is applied by hand, from this runbook, in the operator's administrator session, until the deploy
workflow exists. From then on that workflow applies it through the deploy role, on the same state
key, and the workflow's first run must be a plan that shows no change: any change it shows is a
difference between what this runbook applied and what the workflow would apply, and is resolved
before the workflow applies anything.

What this root does not hold, and why each survives its destroy:

- **The image registry and the frontend's execution role** are in the `bootstrap` root
  ([`../../../bootstrap/README.md`](../../../bootstrap/README.md), Step 8 for the role). A destroy of
  this root removes only what its own state holds, so every pushed image and the role stay, and a
  re-apply runs the same image under the same role.
- **The delegated zone of `staging.openvaa.org` and the mail identity** are in the
  [`../dns-mail`](../dns-mail) root. The parent zone delegates to that zone's name servers by hand,
  and a new zone would get new ones, so the zone is never part of a root that is destroyed on purpose.
  This root only adds records to it.
- **The two parameters the task reads from the parameter store** are created by the operator outside
  Terraform (Step 2). Terraform never reads their values, so no plan and no state holds them, and a
  destroy, which removes only what is in state, leaves them in place.

The overview of every root, the order of first applies and the rules that hold for every apply are in
[`../../../README.md`](../../../README.md).

## Rules of this root

- **Every command runs with `AWS_PROFILE=openvaa-admin`, after an account check against
  `471112560111`**, because the shell's default credentials belong to another account and are never
  used for this root. The provider's `allowed_account_ids` refuses any other account, but it is the
  backstop, not the check. **An expired session is a stop**: sign in again with
  `aws sso login --profile openvaa-admin` and start the step again, and never look for other
  credentials.
- **This runbook applies this root and no other.** A plan of `bootstrap`, `dns-mail` or a Supabase
  root made from here is read only, and one that shows a destroy or a replacement is never applied,
  because those roots hold what survives this one and some of it, such as the Supabase project, does
  not come back. The one apply of another root that this runbook asks for, bootstrap's Step 8, is the
  operator's, from bootstrap's runbook.
- **A plan is saved, read against its step's stop rule, and only that saved file is applied**, because
  only a plan that has been read may be applied. A new plan is a different plan and is read again.
- **No secret value goes into a file, onto a command line or into a pasted line.** A value is typed at
  a prompt that does not echo it (`read -rs`) and reaches the command through the environment,
  because a file can be committed or synced, a command line is kept in the shell's history and is
  visible in the process list, and a pasted line is public.
- **No plan file, state, raw log or output of `terraform show` is shared, attached or pasted**, nor the
  output of `terraform output` without a name, because they hold the origin secret and the alert
  address in clear text.
- **No network address is recorded, only the role of the host it belongs to** (viewer, edge, load
  balancer, task, spoof), because a client address in a public record points at a person's network.
- **`environment_overrides`, `omit_environment`, `debug_ingress_cidrs` and `scheduled_floor_changes`
  are given on the command line, for one observation, and the next apply without them removes them
  again**, because `terraform.tfvars` is the record of the stack as it runs, and a value written there
  for one observation would become part of that record. The floor raised for a known peak is the one
  exception: it is part of how the stack runs that day, so "Election day" writes its two entries in
  `terraform.tfvars`.
- **The evidence logs are copied out before a destroy**, because the log group goes with the destroy
  and its lines cannot be read afterwards.

## What you paste back

Every command below sends its raw output to a log file in a directory outside the repository, `$L`,
and prints named lines of the form `s<step>_<field>=<value>`: Step 4 prints lines beginning `s4_`,
whatever item prints them. The status of a command is read on the line after it, as
`s<step>_<field>_exit=`, and never through a pipe. A typed answer goes on a line of the form
`answer_<name>=<text>`. Paste those lines and nothing else: nothing from a log and nothing from the
terminal's scroll-back.

- When a status line is not 0 where the step expects 0, paste the lines up to it and stop.
- If whoever asked you to run a step gave you an attempt id, the first line of your reply is
  `answer_attempt=<that id>`.
- Never paste a secret, an e-mail address or a network address.

`$L` and a saved plan file hold secrets in clear text. The last item of each step removes `$L`, and
the plan file with it, and prints a named line. If you stop early or a command fails, run that last
item before you leave the terminal.

## What the operator gives

- **The values of the two parameters**, typed at the prompts of Step 2: the Supabase project's anon key
  and the PostHog project key.
- **The apply of the execution role**, bootstrap's Step 8, in a sitting of its own, once the
  parameters exist (Step 3).
- **The alert address**, exported as `TF_VAR_alert_email` from a file outside the repository that the
  operator's shell profile reads, so that every new shell has it and the address appears in no
  command, transcript or tracked file.
- **The confirmation of the alert's subscription**, from the mail AWS sends to that address (Step 6).
- **The activation of the cost-allocation tags** `Project`, `Environment` and `Root` in Billing (Step
  6).
- **For Step 10, the alert mail**: whether it reached the alert mailbox, and when.
- **For Step 13, a phone that can leave Wi-Fi**, and the inserts from the workstation, in one sitting
  of five minutes.
- **For Step 14, the first administrator's address and password**, typed at prompts, **a second
  mailbox of the operator's own**, and the sign-in link of its mail, followed in a browser.
- **For Steps 15 and 16, the Supabase session secrets**: the access token and the database password,
  given for one shell session as
  [`../supabase/README.md`](../supabase/README.md) describes, because a plan of the Supabase root
  needs them, and the SMTP pair, read from the `dns-mail` root's outputs in the same shell. The same
  session runs Step 15's cleanup over `psql` and, with the anon key, Step 16's conformance probe.
- **For Step 17, the confirmation of the new subscription**, which the re-created topic sends.

## Before you start

- **The tools:** Terraform 1.16.5, the version in `infra/.terraform-version`; the AWS CLI version 2;
  `jq`, `git` and `curl`; Docker with `buildx`, running; Node and the repository's dependencies, with
  Playwright's Chromium installed (`yarn playwright install`), for the one page Step 7 renders in a
  browser. The service runs on arm64 and the image is built natively, so build on an arm64
  workstation.
- **The profile `openvaa-admin`**, an IAM Identity Center profile in your AWS configuration that signs
  in to account `471112560111` with administrator rights. Sign in before the first step and whenever
  the session expires:

  ```bash
  aws sso login --profile openvaa-admin
  ```

- **The alert address**, exported in your shell profile as "What the operator gives" describes. Step 1
  checks that it is set and never prints it.
- **Push access to `origin`**, for the source-only commit of Step 4.
- **The plugin cache directory**, which Terraform uses only when it exists:

  ```bash
  mkdir -p "$HOME/.terraform.d/plugin-cache"
  ```

## The lines that begin each command

A step is often resumed in a new terminal, so no command relies on an earlier sitting. Every step
begins with these lines, from inside the repository, and they are run again in any new terminal.
Each step repeats them with its own number in place of `<n>`.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s<n>_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s<n>_account_match_exit=$?"
T=infra/envs/staging/aws
```

- The `unset` line comes first because a key pair in the environment takes precedence over the
  profile, both for the AWS CLI and for Terraform's provider, and such a pair would belong to the
  shell's default account.
- `LC_ALL=C` keeps every number and sort order independent of your workstation's locale.
  `AWS_PAGER=""` keeps the CLI from opening a pager. Give a time in UTC, in the form
  `date -u +%Y-%m-%dT%H:%MZ` prints.
- Only the account id is read. The caller's ARN is never printed, because it ends in the session name,
  which carries the person's user name.
- Both status lines must read 0. If `account_read_exit` is not 0, the session has expired or was never
  started: run `aws sso login --profile openvaa-admin` and begin the step again. If
  `account_match_exit` is not 0, the shell reached another account: stop. In both cases run the step's
  last item, and paste nothing from `$L/account.err`.

## The task's environment

The task receives exactly the variables of the module's list,
[`../../../modules/frontend-service/task-environment.json`](../../../modules/frontend-service/task-environment.json),
and this table must equal that list; a unit test compares them. A `value` is set by this root, in
`environment_values` of `terraform.tfvars`. A `parameter` is a SecureString the task's execution role
reads from `/openvaa/staging/frontend/<name>`, created by the operator in Step 2. "Starts without it"
says whether the server's start-up check lets a task start when the variable is unset; a variable
another one makes necessary, as the PostHog key is once `ANALYTICS_PROVIDER` is `posthog`, says so
in its description.

| Name                       | Source    | Starts without it | Description                                                                                                                                                                                                                                     |
| -------------------------- | --------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`      | value     | no                | The origin of the Supabase API the application queries, the project's API URL as the Supabase dashboard shows it.                                                                                                                               |
| `PUBLIC_SUPABASE_ANON_KEY` | parameter | no                | The Supabase project's anon key. It is public by design and reaches every browser, but it is kept in the parameter store because it is a signed token, which secret scanners and the repository's reply screen refuse to see in a tracked file. |
| `PUBLIC_PROJECT_ID`        | value     | no                | The id of the project every query the application issues is scoped to; there is no fallback, so it must name a project that exists in the database.                                                                                             |
| `ORIGIN`                   | value     | no                | The public origin of the deployment as a browser sees it, scheme and host with no trailing slash; without it the server takes each request's origin from headers the client sets.                                                               |
| `ADDRESS_HEADER`           | value     | yes               | The request header in which the nearest trusted proxy sets the client address, usually x-forwarded-for behind a load balancer.                                                                                                                  |
| `XFF_DEPTH`                | value     | yes               | The number of trusted proxies in front of the server, counted from the right of the address header; set it to the number of proxies the deployment actually has.                                                                                |
| `KEEP_ALIVE_TIMEOUT`       | value     | yes               | Seconds the server keeps an idle connection open; set it above the load balancer's idle timeout so the load balancer, not the server, closes idle connections.                                                                                  |
| `HEADERS_TIMEOUT`          | value     | yes               | Seconds the server waits for a request's headers; set it above KEEP_ALIVE_TIMEOUT so a reused connection is never cut while its next request is arriving.                                                                                       |
| `SHUTDOWN_TIMEOUT`         | value     | yes               | Seconds the server waits for requests in flight after a stop signal before it exits; set it below the container's stop timeout so the process exits by itself rather than being killed.                                                         |
| `PUBLIC_LOG_LEVEL`         | value     | yes               | The minimum level the structured logger emits, one of debug, info, warn or error; unset falls back to warn.                                                                                                                                     |
| `ANALYTICS_PROVIDER`       | value     | yes               | Where analytics events go, one of none, log or posthog; unset means none, and posthog without a key is refused at start.                                                                                                                        |
| `ANALYTICS_CONSENT_MODE`   | value     | yes               | Whether events wait for the voter's consent, gated (the default) or free; whether consent is needed is for the deployer to determine.                                                                                                           |
| `ANALYTICS_VISIT_ID_MODE`  | value     | yes               | How a visit is identified across events, memory (the default) or none.                                                                                                                                                                          |
| `ANALYTICS_POSTHOG_HOST`   | value     | yes               | The PostHog host events are forwarded to, an https origin; unset means the PostHog EU cloud.                                                                                                                                                    |
| `ANALYTICS_POSTHOG_KEY`    | parameter | yes               | The PostHog project key events are forwarded with; it is a secret and is read only when ANALYTICS_PROVIDER is posthog.                                                                                                                          |
| `DEPLOYMENT_DIAGNOSTICS`   | value     | yes               | Set to true to switch on /api/diagnostics, which reports the resolved origin, client address and forwarding headers; set it only while a proxy setup is being checked, and false otherwise.                                                     |

## Flow overview

```
Step 1  the account, the session, the tools and the alert address
Step 2  the two parameters, created by the operator outside Terraform
Step 3  the execution role: bootstrap's Step 8, then its read-back here
Step 4  the image: a pushed source-only commit, the build, the local health read, the refused
        second push
Step 5  the first plan and the one apply; a second plan with no change; the site through the CDN
Step 6  the operator confirms the alert's subscription and activates the cost-allocation tags
Step 7  what the stack serves: the certificates, the redirect, a voter page, the caching
Step 8  the network, the tags and the regions
Step 9  the forwarded headers at the container, the proxy depth, and both origin locks refusing
Step 10 a rollout that fails on purpose, its rollback and its alert
Step 11 the restore, and the stop signal in the log of the task it stopped
Step 12 the floor raised ahead of time and lowered again
Step 13 the feedback limit, by client, from two networks
Step 14 one invitation mail, followed to a signed-in recipient
Step 15 before the destroy: the evidence logs copied, the observation rows removed, both
        long-lived roots' plans empty
Step 16 the destroy, and the tag search in both regions
Step 17 the re-apply from the same commit
Step 18 the cost, by tag, against the priced inventory
```

Steps 1 to 6 bring the stack up. Steps 7 and 8 read the running stack and change nothing; Steps 9 to
12 each change it for an observation and change it back. Steps 13 and 14 follow two paths from the
stack's pages to the hosted project, Steps 15 to 17 destroy the root and apply it again, and Step 18
reads the cost of the stack the re-apply brought up. "Election day", after Step 18, is not a step of
this order: it is how the floor is raised for a known peak.

## Up to the first apply

### Step 1: The account and the session

Nothing in this step changes anything.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s1_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s1_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. The tools. Terraform's version must equal the pinned one, and Docker must be running:

   ```bash
   terraform version -json > "$L/s1-terraform.json"
   echo "s1_terraform_exit=$?"
   jq -r '"s1_terraform_version=\(.terraform_version)"' \
     "$L/s1-terraform.json"
   echo "s1_terraform_pinned=$(cat infra/.terraform-version)"
   for c in aws jq git curl docker; do
     command -v "$c" > /dev/null; echo "s1_has_${c}_exit=$?"
   done
   docker buildx version > "$L/s1-buildx.txt" 2>&1
   echo "s1_buildx_exit=$?"
   docker info > "$L/s1-docker.txt" 2>&1
   echo "s1_docker_running_exit=$?"
   echo "s1_machine=$(uname -m)"
   ```

2. The alert address and the plugin cache. The address is tested for being set and never printed:

   ```bash
   test -n "${TF_VAR_alert_email:-}"; echo "s1_alert_email_set_exit=$?"
   test -d "$TF_PLUGIN_CACHE_DIR"; echo "s1_plugin_cache_exit=$?"
   ```

   If `s1_alert_email_set_exit` is not 0, add the export to the file your shell profile reads, open a
   new terminal and run this step again.

3. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s1_logs_removed=yes"
   ```

Return: every `s1_` line. Expected: every status 0, `s1_terraform_version` equal to
`s1_terraform_pinned`, and `s1_machine=arm64`.

### Step 2: The two parameters

The operator runs this step in their own terminal and types each value at its prompt. The parameters
are created outside Terraform, under `/openvaa/staging/frontend/`, as SecureStrings with the
parameter store's default key, `alias/aws/ssm`, which AWS creates on the first SecureString that uses
it. They carry the tags `Project=openvaa` and `Environment=staging` and no `Root` tag: the destroy
check of Step 16 lists what carries `Root=aws`, and these two outlive the destroy on purpose.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s2_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s2_account_match_exit=$?"
T=infra/envs/staging/aws
P=/openvaa/staging/frontend
```

Each value is read without echoing it. The shell's `printf` builtin writes it, with no trailing
newline, to the CLI's standard input, and `--value file:///dev/stdin` reads it from there. So the
value reaches no command line and no file. The status line is the CLI's own, because the CLI is the
last command of the pipe. The CLI refuses a whole request read as `--cli-input-json` from a pipe
(`Invalid JSON received`), so only the value travels that way.

1. The Supabase project's anon key, as the Supabase dashboard shows it under the project's API keys:

   ```bash
   printf 'anon key: '; read -rs PARAMETER_VALUE; echo
   printf '%s' "$PARAMETER_VALUE" \
     | aws ssm put-parameter \
       --name "$P/PUBLIC_SUPABASE_ANON_KEY" \
       --type SecureString --value file:///dev/stdin \
       --tags Key=Project,Value=openvaa \
         Key=Environment,Value=staging \
       > "$L/s2-anon.json" 2> "$L/s2-anon.err"
   echo "s2_anon_put_exit=$?"
   unset PARAMETER_VALUE
   ```

2. The PostHog project key. If there is no PostHog project yet, type a stand-in such as `stand-in`:
   the task receives the parameter but reads it only once `ANALYTICS_PROVIDER` is `posthog`, and ECS
   starts no task whose parameter is missing. Answer `answer_posthog_kind=real` or
   `answer_posthog_kind=stand-in`.

   ```bash
   printf 'PostHog key: '; read -rs PARAMETER_VALUE; echo
   printf '%s' "$PARAMETER_VALUE" \
     | aws ssm put-parameter \
       --name "$P/ANALYTICS_POSTHOG_KEY" \
       --type SecureString --value file:///dev/stdin \
       --tags Key=Project,Value=openvaa \
         Key=Environment,Value=staging \
       > "$L/s2-posthog.json" 2> "$L/s2-posthog.err"
   echo "s2_posthog_put_exit=$?"
   unset PARAMETER_VALUE
   ```

   A parameter that already exists is refused with `ParameterAlreadyExists` and keeps its value. To
   replace a value, run the same command with `--overwrite` in place of the two `--tags` lines. AWS
   refuses tags on an overwrite, and the parameter keeps the tags it has. Print the error's code alone,
   never its message:

   ```bash
   grep -ho -E 'ParameterAlreadyExists|AccessDenied[A-Za-z]*' \
     "$L/s2-anon.err" "$L/s2-posthog.err" \
     | sed 's/^/s2_put_error=/'
   ```

3. Read both back: name, type and key, then the tag keys, never a value:

   ```bash
   aws ssm describe-parameters \
     --parameter-filters "Key=Path,Option=OneLevel,Values=$P" \
     > "$L/s2-describe.json" 2> "$L/s2-describe.err"
   echo "s2_describe_exit=$?"
   jq -r '.Parameters[] | "s2_parameter=\(.Name) \(.Type) \(.KeyId)"' \
     "$L/s2-describe.json"
   for x in anon:PUBLIC_SUPABASE_ANON_KEY \
     posthog:ANALYTICS_POSTHOG_KEY; do
     l=${x%%:*} n=${x#*:}
     aws ssm list-tags-for-resource --resource-type Parameter \
       --resource-id "$P/$n" > "$L/s2-tags-$l.json" \
       2> "$L/s2-tags-$l.err"
     echo "s2_tags_${l}_exit=$?"
     jq -r --arg l "$l" \
       '"s2_tag_names_\($l)=\([.TagList[].Key] | sort | join(","))"' \
       "$L/s2-tags-$l.json"
   done
   aws kms describe-key --key-id alias/aws/ssm \
     > "$L/s2-key.json" 2> "$L/s2-key.err"
   echo "s2_ssm_key_exit=$?"
   ```

   Expected: two `s2_parameter=` lines, `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` and
   `/openvaa/staging/frontend/PUBLIC_SUPABASE_ANON_KEY`, each `SecureString alias/aws/ssm`; both
   `s2_tag_names_` lines `Environment,Project`; and `s2_ssm_key_exit=0`.

4. Last item, also when you stop early or a command failed:

   ```bash
   unset PARAMETER_VALUE
   test -n "$L" && rm -rf "$L" && echo "s2_logs_removed=yes"
   ```

Return: every `s2_` line and `answer_posthog_kind=`. Never paste either value.

### Step 3: The execution role

The role the ECS agent uses to pull the image, write the task's logs and read the two parameters is
created by the `bootstrap` root, so that no workflow that applies this root ever writes IAM.

1. Run Step 8 of [`../../../bootstrap/README.md`](../../../bootstrap/README.md) in a sitting of its
   own, applying only a plan that meets its stop rule, and paste its `s8_` lines. Its
   `s8_role_arn=` must equal `execution_role_arn` in this root's `terraform.tfvars`.

Then read the role back:

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s3_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s3_account_match_exit=$?"
T=infra/envs/staging/aws
ROLE=openvaa-staging-frontend-execution
```

2. The role's path, the principal its trust policy admits, and its ARN against this root's variable
   file:

   ```bash
   aws iam get-role --role-name "$ROLE" \
     > "$L/s3-role.json" 2> "$L/s3-role.err"
   echo "s3_get_role_exit=$?"
   jq -r '.Role | "s3_role_path=\(.Path)",
     "s3_role_trust=\([.AssumeRolePolicyDocument.Statement[]
       | .Principal.Service] | flatten | sort | join(","))"' \
     "$L/s3-role.json"
   WANT=$(sed -n 's/^execution_role_arn *= *"\(.*\)"/\1/p' \
     "$T/terraform.tfvars")
   test "$(jq -r .Role.Arn "$L/s3-role.json")" = "$WANT"
   echo "s3_role_arn_matches_tfvars_exit=$?"
   ```

3. Its attached policies and its inline policies, which must be none:

   ```bash
   aws iam list-attached-role-policies --role-name "$ROLE" \
     > "$L/s3-attached.json" 2> "$L/s3-attached.err"
   echo "s3_attached_exit=$?"
   jq -r '"s3_attached=\([.AttachedPolicies[].PolicyName]
     | sort | join(","))"' "$L/s3-attached.json"
   aws iam list-role-policies --role-name "$ROLE" \
     > "$L/s3-inline.json" 2> "$L/s3-inline.err"
   echo "s3_inline_exit=$?"
   jq -r '"s3_inline_count=\(.PolicyNames | length)"' \
     "$L/s3-inline.json"
   ```

4. The policy simulator: the role may read a parameter under its own path and not one under another
   path of the same environment:

   ```bash
   ARN=$(jq -r .Role.Arn "$L/s3-role.json")
   A=arn:aws:ssm:eu-north-1:471112560111:parameter
   Q='EvaluationResults[].EvalDecision'
   aws iam simulate-principal-policy --policy-source-arn "$ARN" \
     --action-names ssm:GetParameters \
     --resource-arns "$A/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY" \
     --query "$Q" --output text \
     > "$L/s3-own.txt" 2> "$L/s3-own.err"
   echo "s3_simulate_own_exit=$?"
   sed 's/^/s3_own_path_decision=/' "$L/s3-own.txt"
   aws iam simulate-principal-policy --policy-source-arn "$ARN" \
     --action-names ssm:GetParameters \
     --resource-arns "$A/openvaa/staging/other/X" \
     --query "$Q" --output text \
     > "$L/s3-other.txt" 2> "$L/s3-other.err"
   echo "s3_simulate_other_exit=$?"
   sed 's/^/s3_other_path_decision=/' "$L/s3-other.txt"
   ```

5. The account side of the rule against inline policies: no IAM user carries one, and no role or user
   under `/openvaa/` does:

   ```bash
   infra/scripts/account-inventory.sh \
     --assert-no-inline-user-policies > "$L/s3-users.txt" 2>&1
   echo "s3_no_inline_user_policies_exit=$?"
   infra/scripts/account-inventory.sh \
     --assert-no-inline-under /openvaa/ > "$L/s3-under.txt" 2>&1
   echo "s3_no_inline_under_openvaa_exit=$?"
   ```

6. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s3_logs_removed=yes"
   ```

Return: the `s8_` lines of item 1 and every `s3_` line. Expected: `s3_role_path=/openvaa/`,
`s3_role_trust=ecs-tasks.amazonaws.com`, `s3_role_arn_matches_tfvars_exit=0`,
`s3_attached=AmazonECSTaskExecutionRolePolicy,openvaa-staging-frontend-parameters`,
`s3_inline_count=0`, `s3_own_path_decision=allowed`, `s3_other_path_decision=implicitDeny`, and
every status 0.

### Step 4: The image

The image's tag is the full id of a commit anyone can fetch from `origin`, and the image's build id
is the same string. The commit is a source-only one: the tree of `HEAD` without `.planning`, built
through a temporary index so that the working tree is not touched, with `origin/main` as its parent,
and pushed to the branch `deploy-evidence/185-image`, which no workflow listens to.
`infra/scripts/build-push-image.sh` then builds it from a detached worktree of that commit and pushes
it; its header lists its refusals and its output lines. The step ends by seeing the registry refuse a
second image under the same tag.

Run the step in one sitting: later items use the variables earlier items set.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s4_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s4_account_match_exit=$?"
T=infra/envs/staging/aws
U=$(sed -n 's/^registry_url *= *"\(.*\)"/\1/p' "$T/terraform.tfvars")
B=deploy-evidence/185-image
```

1. The working tree is clean, untracked files included:

   ```bash
   git status --porcelain --untracked-files=all > "$L/s4-status.txt"
   echo "s4_status_exit=$?"
   echo "s4_dirty_lines=$(wc -l < "$L/s4-status.txt" | tr -d ' ')"
   ```

   `s4_dirty_lines` must be 0. Otherwise commit or remove the changes first; nothing is built from a
   dirty tree.

2. The source-only commit:

   ```bash
   git fetch --quiet origin main > "$L/s4-fetch.log" 2>&1
   echo "s4_fetch_exit=$?"
   export GIT_INDEX_FILE="$L/s4.index"
   git read-tree HEAD; echo "s4_read_tree_exit=$?"
   git rm -r --cached --quiet --ignore-unmatch .planning
   echo "s4_rm_planning_exit=$?"
   TREE=$(git write-tree); echo "s4_write_tree_exit=$?"
   unset GIT_INDEX_FILE
   SHA=$(git commit-tree "$TREE" -p origin/main \
     -m "Source tree of $(git rev-parse HEAD) without .planning")
   echo "s4_commit_tree_exit=$?"
   echo "s4_source_commit=$SHA"
   ```

3. Its tree holds no planning path:

   ```bash
   git ls-tree -r --name-only "$SHA" > "$L/s4-tree.txt"
   echo "s4_ls_tree_exit=$?"
   echo "s4_planning_paths=$(awk -F/ '$1 == ".planning"' \
     "$L/s4-tree.txt" | wc -l | tr -d ' ')"
   ```

   `s4_planning_paths` must be 0. Otherwise stop: nothing is pushed.

4. Push it and see `origin` list it. The braces in `${SHA}:refs` are needed: zsh reads the `:r` of
   `$SHA:refs` as a modifier and drops it, and the push then names no ref git knows. On the first
   build the branch does not exist yet:

   ```bash
   git push --quiet origin "${SHA}:refs/heads/$B" \
     > "$L/s4-push.log" 2>&1
   echo "s4_push_exit=$?"
   ```

   On a later build the branch exists, and the push is refused because the new commit does not
   descend from its tip. Read the tip and push with a lease on it, so that the push replaces that tip
   and nothing else:

   ```bash
   git ls-remote origin "refs/heads/$B" > "$L/s4-tip.txt"
   echo "s4_tip_exit=$?"
   OLD=$(cut -f1 "$L/s4-tip.txt")
   git push --quiet --force-with-lease="$B:$OLD" origin \
     "${SHA}:refs/heads/$B" > "$L/s4-push.log" 2>&1
   echo "s4_push_exit=$?"
   ```

   Then:

   ```bash
   git ls-remote origin > "$L/s4-remote.txt"
   echo "s4_ls_remote_exit=$?"
   echo "s4_sha_on_origin=$(awk -v s="$SHA" '$1 == s' \
     "$L/s4-remote.txt" | wc -l | tr -d ' ')"
   ```

   `s4_sha_on_origin` must be at least 1.

5. Build and push from a detached worktree of the commit. The build takes several minutes:

   ```bash
   W="$L/worktree"
   git worktree add --detach "$W" "$SHA" > "$L/s4-worktree.log" 2>&1
   echo "s4_worktree_exit=$?"
   (cd "$W" && infra/scripts/build-push-image.sh \
     --repository-url "$U") > "$L/s4-build.txt" 2> "$L/s4-build.err"
   echo "s4_build_exit=$?"
   grep -E '^(image_tag|image_digest|refused|failed|tag_exists)=' \
     "$L/s4-build.txt" | sed 's/^/s4_/'
   ```

   Expected: `s4_build_exit=0`, `s4_image_tag=` equal to `s4_source_commit`, and one
   `s4_image_digest=` line. A `refused=` or `failed=` line names the reason; stop there.

6. The image as the registry and the local store hold it: its digest, its manifest's media type, which
   must be a single image manifest and not an index or a manifest list, and its architecture:

   ```bash
   aws ecr describe-images --repository-name "${U#*/}" \
     --image-ids imageTag="$SHA" \
     > "$L/s4-image.json" 2> "$L/s4-image.err"
   echo "s4_describe_image_exit=$?"
   jq -r '.imageDetails[0] | "s4_registry_digest=\(.imageDigest)",
     "s4_registry_media_type=\(.imageManifestMediaType)"' \
     "$L/s4-image.json"
   docker image inspect --format '{{.Architecture}}' "$U:$SHA" \
     > "$L/s4-arch.txt" 2>&1
   echo "s4_inspect_exit=$?"
   sed 's/^/s4_image_arch=/' "$L/s4-arch.txt"
   ```

   Expected: `s4_registry_digest=` equal to `s4_image_digest=`, and `s4_image_arch=arm64`.

7. Start the image locally with the four variables the start-up check requires, stand-ins all, and
   read `/api/health`. The Supabase URL points at a closed port, which the health answer never
   calls:

   ```bash
   docker run --rm -d --name openvaa-health-check \
     -p 127.0.0.1:3186:3000 \
     -e PUBLIC_SUPABASE_URL=http://127.0.0.1:9 \
     -e PUBLIC_SUPABASE_ANON_KEY=stand-in \
     -e PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001 \
     -e ORIGIN=http://127.0.0.1:3186 \
     "$U:$SHA" > "$L/s4-run.txt" 2>&1
   echo "s4_run_exit=$?"
   for i in $(seq 1 30); do
     curl -sS -o "$L/s4-health.json" -w '%{http_code}' \
       http://127.0.0.1:3186/api/health \
       > "$L/s4-health.code" 2> /dev/null && break
     sleep 1
   done
   echo "s4_health_http=$(cat "$L/s4-health.code")"
   jq -r '"s4_health_build=\(.build)"' "$L/s4-health.json"
   test "$(jq -r .build "$L/s4-health.json")" = "$SHA"
   echo "s4_health_build_matches_exit=$?"
   docker stop openvaa-health-check > /dev/null 2>&1
   echo "s4_stop_exit=$?"
   ```

   Expected: `s4_health_http=200`, `s4_health_build=` equal to `s4_source_commit`, and
   `s4_health_build_matches_exit=0`.

8. The refused second push. A pushed copy of the same image would not show the refusal, because the
   registry treats an identical manifest under its own tag as nothing to do; a different image under
   the same tag does. Build a one-line image from the pushed one, tag it with the same tag, and push
   it. The login hands the password from the CLI straight to Docker on standard input:

   ```bash
   D="$L/second"; mkdir "$D"
   printf 'FROM %s:%s\nLABEL org.openvaa.check="second-push"\n' \
     "$U" "$SHA" > "$D/Dockerfile"
   docker build --provenance=false --sbom=false -t "$U:$SHA" "$D" \
     > "$L/s4-second-build.log" 2>&1
   echo "s4_second_build_exit=$?"
   H=${U%%/*}
   aws ecr get-login-password | docker login --username AWS \
     --password-stdin "$H" > "$L/s4-login.log" 2>&1
   echo "s4_login_exit=$?"
   docker push "$U:$SHA" > "$L/s4-second-push.log" 2>&1
   echo "s4_second_push_exit=$?"
   grep -i -m1 -E 'tag invalid|immutable' "$L/s4-second-push.log" \
     | sed "s|$H|<registry>|g; s/^/s4_second_push_refusal=/"
   docker logout "$H" > /dev/null 2>&1; echo "s4_logout_exit=$?"
   ```

   Expected: `s4_second_push_exit=` not 0, and a `s4_second_push_refusal=` line that says the tag
   already exists and the repository's tags are immutable. The log lists every layer first as
   `Layer already exists`, which is not the refusal, so the search is for the refusal's own words.
   The line names the registry as `<registry>`, never by its host.

9. The tag still names the first image, and the script, run again, sees the tag and builds nothing:

   ```bash
   aws ecr describe-images --repository-name "${U#*/}" \
     --image-ids imageTag="$SHA" \
     > "$L/s4-image-after.json" 2> "$L/s4-image-after.err"
   echo "s4_describe_again_exit=$?"
   test "$(jq -r '.imageDetails[0].imageDigest' \
     "$L/s4-image-after.json")" = "$(jq -r \
     '.imageDetails[0].imageDigest' "$L/s4-image.json")"
   echo "s4_digest_unchanged_exit=$?"
   (cd "$W" && infra/scripts/build-push-image.sh \
     --repository-url "$U") > "$L/s4-again.txt" 2> "$L/s4-again.err"
   echo "s4_script_again_exit=$?"
   grep -E '^tag_exists=' "$L/s4-again.txt" | sed 's/^/s4_again_/'
   ```

   Expected: `s4_digest_unchanged_exit=0`, `s4_script_again_exit=3`, and
   `s4_again_tag_exists=yes image_digest=` with the digest of item 5.

10. Pin the tag in this root's variable file, so that the plan of Step 5 runs this image, and commit
    that change. If the file already holds an `image_tag` line from an earlier build, edit that line
    instead of adding one.

    ```bash
    printf '\n# The commit the pushed image was built from.\n' \
      >> "$T/terraform.tfvars"
    printf 'image_tag = "%s"\n' "$SHA" >> "$T/terraform.tfvars"
    terraform fmt -check "$T" > "$L/s4-fmt.txt" 2>&1
    echo "s4_fmt_exit=$?"
    git add "$T/terraform.tfvars"
    git commit --quiet -m "infra: run the staging image of $SHA" \
      > "$L/s4-commit.log" 2>&1
    echo "s4_commit_exit=$?"
    ```

11. Last item, also when you stop early or a command failed. It removes the derived image's local tag,
    the worktree and `$L`; a line for something not yet made reads not 0, which is expected then.

    ```bash
    docker image rm "$U:$SHA" > /dev/null 2>&1
    echo "s4_local_image_removed_exit=$?"
    git worktree remove --force "$W" > /dev/null 2>&1
    echo "s4_worktree_removed_exit=$?"
    test -n "$L" && rm -rf "$L" && echo "s4_logs_removed=yes"
    ```

Return: every `s4_` line, in order.

### Step 5: The first plan and the one apply

There is one plan and one apply of the whole root, with `image_tag` set, no `-target` and no switch
that brings the stack up in stages, because a stack that comes up in pieces is not the stack the
workflow will later plan against. The apply waits for both certificates to be validated, for the
distribution to be deployed and for the service to reach a steady state, which together take a
quarter of an hour or more, so it runs in the background and its status is read from a file.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s5_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s5_account_match_exit=$?"
T=infra/envs/staging/aws
TAG=$(sed -n 's/^image_tag *= *"\([0-9a-f]*\)".*/\1/p' \
  "$T/terraform.tfvars")
```

1. What the plan needs from the shell and the variable file:

   ```bash
   test -n "${TF_VAR_alert_email:-}"; echo "s5_alert_email_set_exit=$?"
   echo "s5_image_tag_length=${#TAG}"
   ```

   Expected: `s5_alert_email_set_exit=0` and `s5_image_tag_length=40`.

2. Initialise against the state bucket. The lock file is read, never changed:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s5-init.log" 2>&1
   echo "s5_init_exit=$?"
   ```

3. Plan, save the plan in `$L`, and print its summary line, the count of planned actions by kind, and
   the count of planned addresses outside the module. The actions are read from the saved plan as
   JSON, so no attribute value is printed:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" > "$L/s5-plan.log" 2>&1
   echo "s5_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s5-plan.log" \
     | sed 's/^/s5_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s5-plan.json" 2> "$L/s5-show.err"
   echo "s5_show_exit=$?"
   jq -r '[.resource_changes[] | .change.actions | join("-")]
     | group_by(.) | .[] | "s5_planned_\(.[0])=\(length)"' \
     "$L/s5-plan.json"
   jq -r '[.resource_changes[]
     | select(.address | startswith("module.frontend.") | not)]
     | "s5_outside_module=\(length)"' "$L/s5-plan.json"
   ```

4. Read the lines of item 3 against the stop rule.

   > **Apply only when `s5_plan_exit=0`, `s5_plan_line` reads `Plan: <n> to add, 0 to change, 0 to
destroy.`, every `s5_planned_` line is `s5_planned_create=` (or `s5_planned_read=`, a data
   > source read at apply time), and `s5_outside_module=0`.** Any `update`, `delete` or replacement
   > means the state is not empty or holds something else, and any address outside the module is
   > something this root does not declare. Then do not apply: run item 8, paste the lines and stop.

5. Apply the saved plan in the background, wait for its status, and remove the plan file whatever the
   outcome:

   ```bash
   ( terraform -chdir="$T" apply -input=false -no-color \
       "$L/tfplan" > "$L/s5-apply.log" 2>&1
     echo "s5_apply_exit=$?" > "$L/s5-apply.status" ) &
   until test -s "$L/s5-apply.status"; do sleep 30; done
   cat "$L/s5-apply.status"
   grep -m1 -E '^Apply complete!' "$L/s5-apply.log" \
     | sed 's/^/s5_apply_line=/'
   rm -f "$L/tfplan"; echo "s5_plan_file_removed=yes"
   ```

   If the apply failed, print the titles of its errors, run item 8 and stop. Do not plan or apply
   again in this step: a new plan is read against the stop rule from the start.

   ```bash
   grep -E '^Error: ' "$L/s5-apply.log" | sed 's/^/s5_error=/'
   ```

6. Plan again. It must exit 0, which means no change. Status 2 means a change, and the resource
   headings say where, without their attributes:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -detailed-exitcode > "$L/s5-second.log" 2>&1
   echo "s5_second_plan_exit=$?"
   grep -E '^  # ' "$L/s5-second.log" | sed 's/^/s5_second_change=/'
   ```

7. The state object in the bucket, and the site through the CDN. The answer must come from the
   image's commit and through CloudFront, whose `x-cache` header says so:

   ```bash
   aws s3api head-object --bucket openvaa-tfstate-471112560111 \
     --key pipeline/staging/aws/terraform.tfstate \
     > "$L/s5-state.json" 2> "$L/s5-state.err"
   echo "s5_state_head_exit=$?"
   jq -r '"s5_state_sse=\(.ServerSideEncryption)",
     "s5_state_versioned=\(if .VersionId then "yes" else "no" end)"' \
     "$L/s5-state.json"
   curl -sS --max-time 20 -D "$L/s5-headers.txt" \
     -o "$L/s5-health.json" -w 's5_health_http=%{http_code}\n' \
     https://staging.openvaa.org/api/health 2> "$L/s5-curl.err"
   echo "s5_curl_exit=$?"
   jq -r '"s5_health_build=\(.build)"' "$L/s5-health.json"
   test "$(jq -r .build "$L/s5-health.json")" = "$TAG"
   echo "s5_health_build_matches_exit=$?"
   awk 'tolower($1) == "x-cache:" { sub(/\r$/, "");
     sub(/^[^:]*: */, ""); print "s5_health_x_cache=" $0 }' \
     "$L/s5-headers.txt"
   ```

   Expected: `s5_state_sse=AES256`, `s5_state_versioned=yes`, `s5_health_http=200`,
   `s5_health_build_matches_exit=0`, and `s5_health_x_cache=` naming CloudFront, a `Miss` because the
   health answer is never cached. A `s5_curl_exit=6` means the name did not resolve: a resolver that
   asked before the records existed may hold the negative answer for a while, so wait a few minutes
   and run this item again.

8. Last item, also when you stop early or a command failed:

   ```bash
   rm -f "$L/tfplan"
   test -n "$L" && rm -rf "$L" && echo "s5_logs_removed=yes"
   ```

Return: every `s5_` line, in order. Never paste the plan's or the apply's log.

### Step 6: The operator's confirmations

The first two items are the operator's and are done in a browser.

1. **The alert's subscription.** AWS mails a subscription confirmation to the alert address once the
   apply has created the subscription. Follow its confirmation link. Answer
   `answer_subscription_confirmed=yes` and the time (UTC), or `no` if no mail has arrived within an
   hour. A subscription stays pending until it is confirmed, and every re-apply after a destroy
   creates a new one, which is confirmed again.
2. **The cost-allocation tags.** In the Billing and Cost Management console, under Cost allocation
   tags, select the user-defined tags `Project`, `Environment` and `Root` and activate them. A tag key
   is offered there only once a resource carries it. Answer `answer_cost_tags_activated=yes` and the
   time (UTC).

Then read both back:

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s6_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s6_account_match_exit=$?"
T=infra/envs/staging/aws
```

3. The subscription's protocol and state, never its endpoint, and the three tags' status. Cost
   Explorer's API is served from `us-east-1`:

   ```bash
   TOPIC=$(terraform -chdir="$T" output -raw \
     deployment_alert_topic_arn 2> "$L/s6-output.err")
   echo "s6_output_exit=$?"
   aws sns list-subscriptions-by-topic --topic-arn "$TOPIC" \
     > "$L/s6-subscriptions.json" 2> "$L/s6-subscriptions.err"
   echo "s6_subscriptions_exit=$?"
   jq -r '.Subscriptions[] | "s6_subscription=\(.Protocol) \(
     if .SubscriptionArn == "PendingConfirmation"
     then "pending" else "confirmed" end)"' \
     "$L/s6-subscriptions.json"
   aws ce list-cost-allocation-tags --region us-east-1 \
     --tag-keys Project Environment Root \
     > "$L/s6-tags.json" 2> "$L/s6-tags.err"
   echo "s6_cost_tags_exit=$?"
   jq -r '.CostAllocationTags[]
     | "s6_cost_tag=\(.TagKey) \(.Status)"' "$L/s6-tags.json"
   ```

   Expected: one line `s6_subscription=email confirmed`, and three `s6_cost_tag=` lines, each
   `Active`.

4. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s6_logs_removed=yes"
   ```

Return: `answer_subscription_confirmed=`, `answer_cost_tags_activated=`, their times, and every `s6_`
line. Never paste the alert address.

## The running stack

Steps 7 and 8 read the stack the first apply brought up and change nothing. Steps 9 to 12 each make one
observation that needs the stack changed, with `-var` for one apply, and end with the apply that
changes it back and a plan that shows no change. They run in this order, because each change of the
task's environment is a new revision and a rollout, and Step 10 needs a completed rollout to roll back
to.

Each apply of Steps 9 to 12 is made from a saved plan that has been read against the step's stop rule.
The plan lines print each planned change as `<actions> <address>`; the address of a temporary ingress
rule carries the workstation's address as its key, and is printed as `[<address>]`.

### Step 7: What the stack serves

Nothing in this step changes anything. It reads the two certificates, the redirect to HTTPS, a voter
page rendered from the hosted project's data, the origin check of a form post, the edge cache's
pattern and the load balancer's health check, all through the public name.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s7_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s7_account_match_exit=$?"
T=infra/envs/staging/aws
U=https://staging.openvaa.org
```

1. The outputs the step reads, and a helper that prints the value of one response header from a file
   of headers:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s7-init.log" 2>&1
   echo "s7_init_exit=$?"
   out() { terraform -chdir="$T" output -raw "$1" 2>> "$L/out.err"; }
   VIEWER=$(out viewer_certificate_arn)
   ORIGIN_CERT=$(out origin_certificate_arn)
   DIST=$(out distribution_id)
   C=$(out cluster_name)
   S=$(out service_name)
   SB=$(sed -n 's/^ *PUBLIC_SUPABASE_URL *= *"\(.*\)"/\1/p' \
     "$T/terraform.tfvars")
   hdr() { awk -v n="$2:" 'tolower($1) == n { sub(/\r$/, "");
     sub(/^[^:]*: */, ""); print; exit }' "$1"; }
   test -n "$DIST" && test -n "$SB"; echo "s7_outputs_read_exit=$?"
   ```

2. The two certificates, the viewer's in `us-east-1` and the origin's in this root's region:

   ```bash
   aws acm describe-certificate --region us-east-1 \
     --certificate-arn "$VIEWER" \
     > "$L/s7-viewer.json" 2> "$L/s7-viewer.err"
   echo "s7_viewer_cert_read_exit=$?"
   aws acm describe-certificate --certificate-arn "$ORIGIN_CERT" \
     > "$L/s7-origin.json" 2> "$L/s7-origin.err"
   echo "s7_origin_cert_read_exit=$?"
   for c in viewer origin; do
     jq -r --arg c "$c" '.Certificate
       | "s7_\($c)_cert=\(.Status)"
         + " method=\(.DomainValidationOptions[0].ValidationMethod)"
         + " region=\(.CertificateArn | split(":")[3])"' \
       "$L/s7-$c.json"
   done
   ```

   Expected: `s7_viewer_cert=ISSUED method=DNS region=us-east-1` and
   `s7_origin_cert=ISSUED method=DNS region=eu-north-1`.

3. Plain HTTP is redirected, and the HTTPS chain verifies. `curl` verifies the chain against the
   system's trust store unless it is told not to, and exits 60 when the chain does not verify:

   ```bash
   curl -sS --max-time 20 -o /dev/null \
     -w 's7_http_redirect=%{http_code} location=%{redirect_url}\n' \
     http://staging.openvaa.org/ 2> "$L/s7-http.err"
   echo "s7_http_curl_exit=$?"
   curl -sS --max-time 20 -o /dev/null \
     -w 's7_tls_verify_result=%{ssl_verify_result}\n' \
     "$U/" 2> "$L/s7-tls.err"
   echo "s7_tls_curl_exit=$?"
   ```

   Expected: `s7_http_redirect=301 location=https://staging.openvaa.org/`,
   `s7_tls_verify_result=0` and `s7_tls_curl_exit=0`.

4. The front page and the questions page, each followed through its redirects. A page rendered on the
   server carries the project id on its `<body>`, and inlines each response its server-side load
   fetched as a `data-sveltekit-fetched` script whose `data-url` is the address fetched; an inlined
   fetch of the Supabase REST host shows that the task read the hosted project with the key from the
   parameter store. The statements are not in the server's HTML: the located layout renders the
   questions only once its data has resolved in the browser, and the server's render shows its
   loading state. So the questions page is also rendered in a headless browser, the Chromium of the
   repository's Playwright (`yarn playwright install`), which follows the page to the first
   question. The six statements are those of the smoke dataset:

   ```bash
   curl -sS --max-time 30 -L -o "$L/s7-home.html" \
     -w '%{http_code} %{url_effective}' "$U/" \
     > "$L/s7-home.w" 2> "$L/s7-home.err"
   echo "s7_home_curl_exit=$?"
   curl -sS --max-time 30 -L -o "$L/s7-questions.html" \
     -w '%{http_code} %{url_effective}' "$U/questions" \
     > "$L/s7-questions.w" 2> "$L/s7-questions.err"
   echo "s7_questions_curl_exit=$?"
   for f in home questions; do
     echo "s7_${f}=$(cat "$L/s7-$f.w")"
     echo "s7_${f}_project_id=$(grep -o -m1 \
       'data-project-id="[^"]*"' "$L/s7-$f.html" | cut -d'"' -f2)"
     echo "s7_${f}_supabase_fetches=$(grep -o -F \
       "data-sveltekit-fetched data-url=\"$SB/rest/v1/" \
       "$L/s7-$f.html" | wc -l | tr -d ' ')"
   done
   printf '%s\n' \
     'Public transport should be free of charge in cities.' \
     'The state should raise taxes on high incomes.' \
     'Nuclear power should be expanded.' \
     'Municipalities should get more decision-making power.' \
     'Defence spending should be increased.' \
     'Immigration for work should be made easier.' \
     > "$L/s7-statements.txt"
   echo "s7_questions_html_statements=$(grep -c -F \
     -f "$L/s7-statements.txt" "$L/s7-questions.html")"
   node --input-type=module -e '
     import { createRequire } from "node:module";
     import { writeFileSync } from "node:fs";
     const req = createRequire(process.cwd() + "/package.json");
     const { chromium } = req("@playwright/test");
     const [url, out] = process.argv.slice(1);
     const browser = await chromium.launch();
     const page = await browser.newPage();
     const answer = await page.goto(url, { timeout: 60000 });
     await page.getByText("1/6").waitFor({ timeout: 30000 });
     writeFileSync(out, await page.locator("body").innerText());
     console.log(`s7_rendered=${answer.status()} ${page.url()}`);
     await browser.close();
   ' "$U/questions" "$L/s7-rendered.txt" 2> "$L/s7-render.err"
   echo "s7_render_exit=$?"
   grep -o -F -f "$L/s7-statements.txt" "$L/s7-rendered.txt" \
     | sort -u | sed 's/^/s7_statement_seen=/'
   ```

   Expected: `s7_home=` and `s7_questions=` each `200` and an address on `https://staging.openvaa.org`;
   both `_project_id=00000000-0000-0000-0000-000000000001`; at least one `_supabase_fetches=` above 0;
   `s7_questions_html_statements=0`; `s7_rendered=200 https://staging.openvaa.org/questions/__first__`,
   `s7_render_exit=0`, and at least one `s7_statement_seen=` line, such as
   `s7_statement_seen=Public transport should be free of charge in cities.`, the first question's.
   The wait for `1/6`, the first question's counter, is what tells the render that the six questions
   have arrived.

5. The origin check of a form post, as `infra/local/check-proxy-topology.sh` makes it locally: a post
   to the contestant login with the public origin in its `Origin` header is not refused, and the same
   post from another origin is answered 403. The `Accept` header is a browser's native form
   submission's, because SvelteKit answers a form post that prefers JSON with status 200 whatever the
   action did. The form names no account:

   ```bash
   curl -sS --max-time 20 -L -o /dev/null -w '%{url_effective}' \
     "$U/contestant/login" > "$L/s7-login.url" 2> "$L/s7-login.err"
   echo "s7_login_curl_exit=$?"
   LP=$(sed "s|^$U||; s|?.*||" "$L/s7-login.url")
   echo "s7_login_path=$LP"
   A='Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
   F='email=nobody%40example.test&password=not-a-password'
   curl -sS --max-time 20 -o /dev/null \
     -w 's7_form_post_own_origin=%{http_code}\n' \
     -H "$A" -H "Origin: $U" --data "$F" "$U$LP" \
     2> "$L/s7-post-own.err"
   echo "s7_form_post_own_origin_curl_exit=$?"
   curl -sS --max-time 20 -o "$L/s7-post-foreign.txt" \
     -w 's7_form_post_foreign_origin=%{http_code}\n' \
     -H "$A" -H 'Origin: http://attacker.example' \
     --data "$F" "$U$LP" 2> "$L/s7-post-foreign.err"
   echo "s7_form_post_foreign_origin_curl_exit=$?"
   echo "s7_cross_site_text=$(grep -c -F \
     'Cross-site POST form submissions are forbidden' \
     "$L/s7-post-foreign.txt")"
   ```

   Expected: `s7_login_path=` a path of the Contestant App, `s7_form_post_own_origin=` any status
   other than 403, `s7_form_post_foreign_origin=403` and `s7_cross_site_text=1`.

6. The edge cache. A page is never served from the edge: both requests for it miss, and neither
   answer carries `age`, which the edge adds to an answer it held. A file under `/_app/immutable/`,
   taken from the page, is held: the second of two requests for it is a hit. The distribution's error
   responses are read back too, each held for 0 seconds:

   ```bash
   P=$(cut -d' ' -f2 "$L/s7-home.w")
   for i in 1 2; do
     curl -sS --max-time 20 -o "$L/s7-page.html" \
       -D "$L/s7-page-$i.txt" "$P" 2> "$L/s7-page-$i.err"
     echo "s7_page_${i}_curl_exit=$?"
     AGE=$(hdr "$L/s7-page-$i.txt" age)
     echo "s7_page_${i}=$(hdr "$L/s7-page-$i.txt" x-cache)" \
       "age=${AGE:-absent}"
   done
   echo "s7_page_cache_control=$(hdr "$L/s7-page-1.txt" \
     cache-control)"
   ASSET=$(grep -o -m1 '/_app/immutable/[A-Za-z0-9._/-]*\.js' \
     "$L/s7-page.html" | head -1)
   echo "s7_asset=$ASSET"
   for i in 1 2; do
     curl -sS --max-time 20 -o /dev/null \
       -D "$L/s7-asset-$i.txt" "$U$ASSET" 2> "$L/s7-asset-$i.err"
     echo "s7_asset_${i}_curl_exit=$?"
     echo "s7_asset_${i}=$(hdr "$L/s7-asset-$i.txt" x-cache)"
   done
   echo "s7_asset_cache_control=$(hdr "$L/s7-asset-1.txt" \
     cache-control)"
   aws cloudfront get-distribution-config --id "$DIST" \
     > "$L/s7-distribution.json" 2> "$L/s7-distribution.err"
   echo "s7_distribution_config_exit=$?"
   jq -r '.DistributionConfig.CustomErrorResponses
     | "s7_error_responses=\(.Quantity) min_ttls=\([.Items[]
       | .ErrorCachingMinTTL | tostring] | unique | join(","))"' \
     "$L/s7-distribution.json"
   ```

   Expected: `s7_page_1=` and `s7_page_2=` each `Miss from cloudfront age=absent` or
   `RefreshHit from cloudfront age=absent`; `s7_asset=` a path under `/_app/immutable/`;
   `s7_asset_2=Hit from cloudfront`; `s7_asset_cache_control=` naming `immutable`; and
   `s7_error_responses=11 min_ttls=0`.

7. The load balancer's health check and the service's grace period, and the state of the target:

   ```bash
   aws ecs describe-services --cluster "$C" --services "$S" \
     > "$L/s7-service.json" 2> "$L/s7-service.err"
   echo "s7_service_read_exit=$?"
   TG=$(jq -r '.services[0].loadBalancers[0].targetGroupArn' \
     "$L/s7-service.json")
   jq -r '.services[0]
     | "s7_grace_period=\(.healthCheckGracePeriodSeconds)"' \
     "$L/s7-service.json"
   aws elbv2 describe-target-groups --target-group-arns "$TG" \
     > "$L/s7-target-group.json" 2> "$L/s7-target-group.err"
   echo "s7_target_group_read_exit=$?"
   jq -r '.TargetGroups[0]
     | "s7_health_check_path=\(.HealthCheckPath)"' \
     "$L/s7-target-group.json"
   aws elbv2 describe-target-health --target-group-arn "$TG" \
     > "$L/s7-target-health.json" 2> "$L/s7-target-health.err"
   echo "s7_target_health_read_exit=$?"
   jq -r '.TargetHealthDescriptions[]
     | "s7_target_state=\(.TargetHealth.State)"' \
     "$L/s7-target-health.json"
   ```

   Expected: `s7_grace_period=60`, `s7_health_check_path=/api/health` and one
   `s7_target_state=healthy`.

8. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s7_logs_removed=yes"
   ```

Return: every `s7_` line, in order, and every status 0.

### Step 8: The network, the tags and the regions

Nothing in this step changes anything. The task's public address and the load balancer's address are
read into variables and used, and never printed.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s8_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s8_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. The outputs the step reads:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s8-init.log" 2>&1
   echo "s8_init_exit=$?"
   out() { terraform -chdir="$T" output -raw "$1" 2>> "$L/out.err"; }
   VPC=$(out vpc_id)
   LB_SG=$(out load_balancer_security_group_id)
   TASK_SG=$(out task_security_group_id)
   LB_DNS=$(out load_balancer_dns_name)
   C=$(out cluster_name)
   S=$(out service_name)
   G=$(out log_group_name)
   test -n "$VPC" && test -n "$G"; echo "s8_outputs_read_exit=$?"
   command -v dig > /dev/null; echo "s8_has_dig_exit=$?"
   yn() { if test -n "$1"; then echo "$2"; else echo "$3"; fi; }
   ```

2. The ingress rules of both groups, by the role of their source, never by address; the NAT
   gateways of the network, which must be none; and its default route:

   ```bash
   N=com.amazonaws.global.cloudfront.origin-facing
   PL=$(aws ec2 describe-managed-prefix-lists \
     --filters "Name=prefix-list-name,Values=$N" \
     --query 'PrefixLists[0].PrefixListId' --output text \
     2> "$L/s8-prefix-list.err")
   echo "s8_prefix_list_read_exit=$?"
   ingress() {
     aws ec2 describe-security-group-rules \
       --filters "Name=group-id,Values=$2" \
       > "$L/s8-$1-sg.json" 2> "$L/s8-$1-sg.err"
     echo "s8_$1_sg_read_exit=$?"
     jq -r --arg p "s8_$1_sg_ingress" --arg lb "$LB_SG" \
       --arg pl "$PL" '[.SecurityGroupRules[]
       | select(.IsEgress | not)]
       | "\($p)=\(length)", (.[] | "\($p)_rule=from=" + (
         if .ReferencedGroupInfo.GroupId == $lb
         then "load-balancer-sg"
         elif .PrefixListId == $pl then "cloudfront-prefix-list"
         elif .CidrIpv4 then "single-address"
         else "other" end) + " port=\(.FromPort)")' \
       "$L/s8-$1-sg.json"
   }
   ingress task "$TASK_SG"
   ingress lb "$LB_SG"
   aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC" \
     > "$L/s8-nat.json" 2> "$L/s8-nat.err"
   echo "s8_nat_read_exit=$?"
   jq -r '"s8_nat_gateways=\([.NatGateways[]
     | select(.State != "deleted")] | length)"' "$L/s8-nat.json"
   aws ec2 describe-route-tables \
     --filters "Name=vpc-id,Values=$VPC" \
     > "$L/s8-routes.json" 2> "$L/s8-routes.err"
   echo "s8_routes_read_exit=$?"
   jq -r '[.RouteTables[].Routes[]
     | select(.DestinationCidrBlock == "0.0.0.0/0")]
     | "s8_default_routes=\(length)",
       (.[] | "s8_default_route=" + (if (.GatewayId // "")
         | startswith("igw-") then "internet-gateway"
         else "other" end))' "$L/s8-routes.json"
   ```

   Expected: `s8_task_sg_ingress=1` with `s8_task_sg_ingress_rule=from=load-balancer-sg port=3000`;
   `s8_lb_sg_ingress=1` with `s8_lb_sg_ingress_rule=from=cloudfront-prefix-list port=443`;
   `s8_nat_gateways=0`; and `s8_default_routes=1` with `s8_default_route=internet-gateway`.

3. The running task, its public address, and two direct requests from the workstation: one to the
   task's address on 3000 and one to the load balancer's address on 443. Neither group admits the
   workstation, so neither request gets an answer, and `curl` gives up after 10 seconds with status 28
   and HTTP status `000`:

   ```bash
   aws ecs list-tasks --cluster "$C" --service-name "$S" \
     --desired-status RUNNING \
     > "$L/s8-tasks.json" 2> "$L/s8-tasks.err"
   echo "s8_list_tasks_exit=$?"
   TASK=$(jq -r '.taskArns[0]' "$L/s8-tasks.json")
   aws ecs describe-tasks --cluster "$C" --tasks "$TASK" \
     --include TAGS > "$L/s8-task.json" 2> "$L/s8-task.err"
   echo "s8_describe_task_exit=$?"
   ENI=$(jq -r '.tasks[0].attachments[].details[]
     | select(.name == "networkInterfaceId") | .value' \
     "$L/s8-task.json")
   aws ec2 describe-network-interfaces \
     --network-interface-ids "$ENI" \
     > "$L/s8-eni.json" 2> "$L/s8-eni.err"
   echo "s8_eni_read_exit=$?"
   TIP=$(jq -r '.NetworkInterfaces[0].Association.PublicIp
     // empty' "$L/s8-eni.json")
   echo "s8_task_public_address=$(yn "$TIP" present absent)"
   LB_IP=$(dig +short "$LB_DNS" A | head -1)
   echo "s8_lb_address=$(yn "$LB_IP" resolved none)"
   O=origin.staging.openvaa.org
   curl -sS --max-time 10 -o /dev/null -w '%{http_code}' \
     "http://$TIP:3000/api/health" \
     > "$L/s8-direct-task.txt" 2> "$L/s8-direct-task.err"
   echo "s8_direct_to_task_curl_exit=$?"
   echo "s8_direct_to_task_http=$(cat "$L/s8-direct-task.txt")"
   curl -sS --max-time 10 -o /dev/null -w '%{http_code}' \
     --resolve "$O:443:$LB_IP" "https://$O/api/health" \
     > "$L/s8-direct-lb.txt" 2> "$L/s8-direct-lb.err"
   echo "s8_direct_to_lb_curl_exit=$?"
   echo "s8_direct_to_lb_http=$(cat "$L/s8-direct-lb.txt")"
   ```

   Expected: `s8_task_public_address=present`, `s8_lb_address=resolved`, both `_curl_exit=28` and
   both `_http=000`. The `.err` files name the addresses and are never pasted.

4. The tags of every resource in the state. A resource that can carry tags has `tags_all`, the
   provider's default tags merged with its own; each must carry the four default tags. The state is
   read as JSON into `$L` and only addresses, counts and resource types are printed:

   ```bash
   terraform -chdir="$T" show -json \
     > "$L/s8-state.json" 2> "$L/s8-show.err"
   echo "s8_show_exit=$?"
   jq -r 'def mods: ., (.child_modules[]? | mods);
     [.values.root_module | mods | .resources[]?
       | select(.mode == "managed")] as $r
     | [$r[] | select(.values | has("tags_all"))] as $t
     | [$t[] | select(.values.tags_all as $g
         | [$g.Project, $g.Environment, $g.Root, $g.ManagedBy]
         != ["openvaa", "staging", "aws", "terraform"])] as $u
     | "s8_managed=\($r | length)", "s8_taggable=\($t | length)",
       "s8_untagged=\($u | length)",
       ($u[] | "s8_untagged_address=\(.address)"),
       "s8_untaggable_types=\([$r[]
         | select(.values | has("tags_all") | not) | .type]
         | unique | join(","))"' "$L/s8-state.json"
   ```

   Expected: `s8_untagged=0` and no `s8_untagged_address=` line. `s8_untaggable_types=` names the
   types that carry no tags at all, such as the records, the validations and the policy attachments.

5. The running task's tags, which it gets from the service:

   ```bash
   jq -r '.tasks[0] | "s8_task_tag_root=\([.tags[]?
     | select(.key == "Root") | .value] | join(","))",
     "s8_task_tag_keys=\([.tags[]?.key] | sort | join(","))"' \
     "$L/s8-task.json"
   ```

   Expected: `s8_task_tag_root=aws`, and `s8_task_tag_keys=` holding `Environment`, `ManagedBy`,
   `Project` and `Root` beside the tags ECS manages itself.

6. The region of every ARN in the state:

   ```bash
   jq -r 'def mods: ., (.child_modules[]? | mods);
     [.values.root_module | mods | .resources[]?
       | select(.mode == "managed")
       | select((.values.arn | type) == "string")]
     | "s8_arns=\(length)",
       (.[] | (.values.arn | split(":")[3]) as $g
         | select($g != "eu-north-1")
         | "s8_arn_outside_home=\(.address) "
           + (if $g == "" then "global" else $g end))' \
     "$L/s8-state.json"
   ```

   Expected: two `s8_arn_outside_home=` lines, `module.frontend.aws_acm_certificate.viewer us-east-1`
   and `module.frontend.aws_cloudfront_distribution.this global`, and no other.

7. The log group's retention, and the running task's stream in it. The log driver names each stream
   `frontend/frontend/<task id>`:

   ```bash
   aws logs describe-log-groups --log-group-name-prefix "$G" \
     > "$L/s8-log-group.json" 2> "$L/s8-log-group.err"
   echo "s8_log_group_read_exit=$?"
   jq -r --arg g "$G" '.logGroups[] | select(.logGroupName == $g)
     | "s8_log_retention_days=\(.retentionInDays)"' \
     "$L/s8-log-group.json"
   aws logs describe-log-streams --log-group-name "$G" \
     --log-stream-name-prefix "frontend/frontend/${TASK##*/}" \
     > "$L/s8-streams.json" 2> "$L/s8-streams.err"
   echo "s8_log_streams_read_exit=$?"
   jq -r '"s8_task_log_streams=\(.logStreams | length)"' \
     "$L/s8-streams.json"
   ```

   Expected: `s8_log_retention_days=90` and `s8_task_log_streams=1`.

8. The state object, and its lock. Two plans are started five seconds apart; the second must fail on
   the lock the first holds, and the first must complete:

   ```bash
   aws s3api head-object --bucket openvaa-tfstate-471112560111 \
     --key pipeline/staging/aws/terraform.tfstate \
     > "$L/s8-state-object.json" 2> "$L/s8-state-object.err"
   echo "s8_state_head_exit=$?"
   jq -r '"s8_state_sse=\(.ServerSideEncryption)",
     "s8_state_versioned=\(if .VersionId then "yes" else "no" end)"' \
     "$L/s8-state-object.json"
   ( terraform -chdir="$T" plan -input=false -no-color \
       -lock-timeout=0s > "$L/s8-lock-first.log" 2>&1
     echo "s8_lock_first_plan_exit=$?" > "$L/s8-lock-first.status" ) &
   sleep 5
   terraform -chdir="$T" plan -input=false -no-color \
     -lock-timeout=0s > "$L/s8-lock-second.log" 2>&1
   echo "s8_lock_second_plan_exit=$?"
   echo "s8_lock_second_refusals=$(grep -c \
     'Error acquiring the state lock' "$L/s8-lock-second.log")"
   until test -s "$L/s8-lock-first.status"; do sleep 5; done
   cat "$L/s8-lock-first.status"
   ```

   Expected: `s8_state_sse=AES256`, `s8_state_versioned=yes`, `s8_lock_second_plan_exit=1`,
   `s8_lock_second_refusals=1` and `s8_lock_first_plan_exit=0`. If both plans read 0, the second ran
   before the first had taken the lock or after it had let it go, which shows nothing: run this item
   again.

9. Last item, also when you stop early or a command failed:

   ```bash
   unset TIP LB_IP
   test -n "$L" && rm -rf "$L" && echo "s8_logs_removed=yes"
   ```

Return: every `s8_` line, in order.

### Step 9: The forwarded headers, the proxy depth and the origin locks

This step switches on `/api/diagnostics` and opens the load balancer to the workstation's address
alone, for one apply each way. With diagnostics on, the route reports the forwarding headers that reach
the container, and the client address the server resolved from them; the record shows by role, never
by value, how many proxies append to `x-forwarded-for`, which is what `XFF_DEPTH` must equal. The
`/32` lets the workstation reach the load balancer directly, which is the only way to see its listener
refuse a request without the origin secret. The step ends with both switched off again.

The workstation's address is read from `https://checkip.amazonaws.com` into a variable and is never
printed. Every request of this step to the public name is made over IPv4 (`curl -4`), because the
distribution also answers over IPv6, and a viewer address of the other family would not match.

Run the step in one sitting: later items use the variables earlier items set.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s9_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s9_account_match_exit=$?"
T=infra/envs/staging/aws
U=https://staging.openvaa.org
O=origin.staging.openvaa.org
```

1. The outputs, the depth this root sets, and the workstation's address:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s9-init.log" 2>&1
   echo "s9_init_exit=$?"
   out() { terraform -chdir="$T" output -raw "$1" 2>> "$L/out.err"; }
   LB_DNS=$(out load_balancer_dns_name)
   LB_SG=$(out load_balancer_security_group_id)
   test -n "$LB_SG"; echo "s9_outputs_read_exit=$?"
   D=$(sed -n 's/^ *XFF_DEPTH *= *"\([0-9]*\)".*/\1/p' \
     "$T/terraform.tfvars")
   echo "s9_tfvars_xff_depth=$D"
   command -v dig > /dev/null; echo "s9_has_dig_exit=$?"
   WS=$(curl -4 -sS --max-time 10 https://checkip.amazonaws.com \
     2> "$L/s9-checkip.err" | tr -d '[:space:]')
   export WS
   case "$WS" in
     "" | *[!0-9.]*) echo "s9_workstation_address_read=no" ;;
     *) echo "s9_workstation_address_read=yes" ;;
   esac
   changes() {
     jq -r --arg p "$1" '.resource_changes[]
       | select(.change.actions != ["no-op"])
       | select(.change.actions != ["read"])
       | "\($p)=\(.change.actions | join("-")) " + (.address
         | sub("\\[\"[0-9.]+/32-[0-9]+\"\\]"; "[<address>]"))' "$2"
   }
   ```

   Expected: `s9_tfvars_xff_depth=2` and `s9_workstation_address_read=yes`. The function `changes`
   prints each planned change of a saved plan, as Steps 9 to 12 read them.

2. The plan with diagnostics on and the `/32`, read against the stop rule, then applied. The apply
   waits for the new task to be serving:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" \
     -var 'environment_overrides={DEPLOYMENT_DIAGNOSTICS="true"}' \
     -var "debug_ingress_cidrs=[\"$WS/32\"]" \
     > "$L/s9-plan.log" 2>&1
   echo "s9_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s9-plan.log" \
     | sed 's/^/s9_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s9-plan.json" 2> "$L/s9-show.err"
   echo "s9_show_exit=$?"
   changes s9_change "$L/s9-plan.json"
   ```

   > **Apply only when `s9_plan_exit=0`, `s9_plan_line` reads
   > `Plan: 3 to add, 1 to change, 1 to destroy.`, and the `s9_change=` lines are exactly these
   > four:** `delete-create` of `module.frontend.aws_ecs_task_definition.app`, `update` of
   > `module.frontend.aws_ecs_service.app`, and `create` of
   > `module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_debug[<address>]` twice, for
   > 443 and 80. Otherwise do not apply: run item 7, paste the lines and stop.

   ```bash
   ( terraform -chdir="$T" apply -input=false -no-color \
       "$L/tfplan" > "$L/s9-on-apply.log" 2>&1
     echo "s9_on_apply_exit=$?" > "$L/s9-on-apply.status" ) &
   until test -s "$L/s9-on-apply.status"; do sleep 30; done
   cat "$L/s9-on-apply.status"
   rm -f "$L/tfplan"; echo "s9_plan_file_removed=yes"
   ```

3. The header record. `/api/diagnostics` is called through the CDN, once plainly and once with a
   client-sent `X-Forwarded-For: 203.0.113.99`, an address of a documentation range. Each body is saved
   in `$L` and read by role: each entry of `x-forwarded-for` is printed as `spoof`, `viewer` (the
   workstation) or `edge`; `viewer_depth` is the viewer entry's position counted from the right, which
   is the depth that resolves it:

   ```bash
   curl -4 -sS --max-time 20 -o "$L/s9-plain.json" \
     -w 's9_plain_http=%{http_code}\n' "$U/api/diagnostics" \
     2> "$L/s9-plain.err"
   echo "s9_plain_curl_exit=$?"
   curl -4 -sS --max-time 20 -o "$L/s9-spoofed.json" \
     -H 'X-Forwarded-For: 203.0.113.99' \
     -w 's9_spoofed_http=%{http_code}\n' "$U/api/diagnostics" \
     2> "$L/s9-spoofed.err"
   echo "s9_spoofed_curl_exit=$?"
   for f in plain spoofed; do
     jq -r --arg f "$f" '
       (.headers["x-forwarded-for"] // "" | split(",")
         | map(gsub("^ +| +$"; ""))) as $e
       | ($e | index(env.WS)) as $v
       | .headers as $h
       | "s9_\($f)_xff_entries=\($e | length)",
         "s9_\($f)_entry_roles=\($e | map(if . == "203.0.113.99"
           then "spoof" elif . == env.WS then "viewer"
           else "edge" end) | join(","))",
         "s9_\($f)_viewer_depth=\(if $v == null then "none"
           else ($e | length) - $v end)",
         "s9_\($f)_client_address_is_viewer="
           + (if .clientAddress == env.WS then "yes" else "no" end),
         "s9_\($f)_client_address_error=\(.clientAddressError)",
         "s9_\($f)_viewer_address_header_is_viewer=" + (if
           ($h["cloudfront-viewer-address"] // "")
           | startswith(env.WS + ":") then "yes" else "no" end),
         "s9_\($f)_amz_cf_id="
           + (if $h["x-amz-cf-id"] then "present" else "absent" end),
         "s9_\($f)_x_forwarded_proto=\($h["x-forwarded-proto"]
           // "absent")",
         "s9_\($f)_via=" + (if $h.via then "present" else "absent" end)
       ' "$L/s9-$f.json"
   done
   ```

   Expected: both `_http=200`; `s9_plain_entry_roles=viewer,edge` and
   `s9_spoofed_entry_roles=spoof,viewer,edge`, the client-sent entry first; both `_viewer_depth=2`;
   both `_client_address_is_viewer=yes`; both `_client_address_error=null`; and
   `_x_forwarded_proto=https`. The lines on `cloudfront-viewer-address`, `x-amz-cf-id` and `via` are
   recorded as they read.

4. The verdict on the depth:

   ```bash
   jq -rn --arg d "$D" --slurpfile p "$L/s9-plain.json" \
     --slurpfile s "$L/s9-spoofed.json" '
     if $p[0].clientAddress == env.WS
       and $s[0].clientAddress == env.WS
     then "s9_depth_verdict=\($d)-confirmed"
     else "s9_depth_verdict=record-differs" end'
   ```

   `s9_depth_verdict=2-confirmed` means the depth this root sets resolves the workstation with and
   without a spoofed entry. **`s9_depth_verdict=record-differs` means the record wins**: set
   `XFF_DEPTH` in `terraform.tfvars` to `s9_plain_viewer_depth`, with a comment naming the date of the
   record, commit that change, and go on with item 5, whose plan then carries the new depth. Then run
   this step again from item 2, whose verdict must read `<new depth>-confirmed`, and record the change
   of depth with the observation.

5. Both origin locks, with the load balancer reached directly through the `/32`. The listener answers
   403 to a request without the origin header and to one with a wrong value, and forwards one with the
   value CloudFront sends. That value is read from the sensitive output into a variable and handed to
   `curl` as a configuration on a file descriptor, so it appears on no command line. Port 80 of the
   load balancer only redirects to HTTPS:

   ```bash
   HN=$(terraform -chdir="$T" output -raw origin_verify_header_name)
   HV=$(terraform -chdir="$T" output -raw origin_verify_header_value)
   LB_IP=$(dig +short "$LB_DNS" A | head -1)
   test -n "$HV" && test -n "$LB_IP"; echo "s9_lock_inputs_exit=$?"
   curl -sS --max-time 10 --resolve "$O:443:$LB_IP" -o /dev/null \
     -w 's9_lock_no_header=%{http_code}\n' "https://$O/api/health" \
     2> "$L/s9-lock.err"
   curl -sS --max-time 10 --resolve "$O:443:$LB_IP" -o /dev/null \
     -w 's9_lock_wrong_header=%{http_code}\n' \
     -H "$HN: not-the-secret" "https://$O/api/health" \
     2>> "$L/s9-lock.err"
   curl -sS --max-time 10 --resolve "$O:443:$LB_IP" -o /dev/null \
     -w 's9_lock_right_header=%{http_code}\n' \
     -K <(printf 'header = "%s: %s"\n' "$HN" "$HV") \
     "https://$O/api/health" 2>> "$L/s9-lock.err"
   unset HV
   curl -sS --max-time 10 --resolve "$O:80:$LB_IP" -o /dev/null \
     -w 's9_lb_http=%{http_code} location=%{redirect_url}\n' \
     "http://$O/" 2>> "$L/s9-lock.err"
   aws ec2 describe-security-group-rules \
     --filters "Name=group-id,Values=$LB_SG" \
     > "$L/s9-lb-sg.json" 2> "$L/s9-lb-sg.err"
   echo "s9_lb_sg_read_exit=$?"
   jq -r '"s9_lb_sg_ingress_during=\([.SecurityGroupRules[]
     | select(.IsEgress | not)] | length)"' "$L/s9-lb-sg.json"
   ```

   Expected: `s9_lock_no_header=403`, `s9_lock_wrong_header=403`, `s9_lock_right_header=200`,
   `s9_lb_http=301 location=https://origin.staging.openvaa.org:443/` and
   `s9_lb_sg_ingress_during=3`: the prefix list and the `/32` on 443 and 80.

6. The plan with neither variable, read against the stop rule, then applied, and the stack read back
   in its plain shape:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" > "$L/s9-off-plan.log" 2>&1
   echo "s9_off_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s9-off-plan.log" \
     | sed 's/^/s9_off_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s9-off-plan.json" 2> "$L/s9-off-show.err"
   echo "s9_off_show_exit=$?"
   changes s9_off_change "$L/s9-off-plan.json"
   ```

   > **Apply only when `s9_off_plan_exit=0`, `s9_off_plan_line` reads
   > `Plan: 1 to add, 1 to change, 3 to destroy.`, and the `s9_off_change=` lines are the task
   > definition's `delete-create`, the service's `update` and the two debug rules' `delete`.** Otherwise do not apply: run item 7, paste
   > the lines and stop. The stack then still has diagnostics on and the `/32` open, which the operator
   > must know.

   ```bash
   ( terraform -chdir="$T" apply -input=false -no-color \
       "$L/tfplan" > "$L/s9-off-apply.log" 2>&1
     echo "s9_off_apply_exit=$?" > "$L/s9-off-apply.status" ) &
   until test -s "$L/s9-off-apply.status"; do sleep 30; done
   cat "$L/s9-off-apply.status"
   rm -f "$L/tfplan"; echo "s9_plan_file_removed=yes"
   curl -4 -sS --max-time 20 -o /dev/null \
     -w 's9_diagnostics_after=%{http_code}\n' \
     "$U/api/diagnostics" 2> "$L/s9-after.err"
   curl -sS --max-time 10 --resolve "$O:443:$LB_IP" -o /dev/null \
     -w 's9_direct_after_http=%{http_code}\n' \
     "https://$O/api/health" 2>> "$L/s9-after.err"
   echo "s9_direct_after_curl_exit=$?"
   aws ec2 describe-security-group-rules \
     --filters "Name=group-id,Values=$LB_SG" \
     > "$L/s9-lb-sg-after.json" 2> "$L/s9-lb-sg-after.err"
   echo "s9_lb_sg_after_read_exit=$?"
   jq -r '"s9_lb_sg_ingress_after=\([.SecurityGroupRules[]
     | select(.IsEgress | not)] | length)"' \
     "$L/s9-lb-sg-after.json"
   terraform -chdir="$T" plan -input=false -no-color \
     -detailed-exitcode > "$L/s9-plan-after.log" 2>&1
   echo "s9_plan_after_exit=$?"
   ```

   Expected: `s9_off_apply_exit=0`, `s9_diagnostics_after=404`, `s9_direct_after_http=000` with
   `s9_direct_after_curl_exit=28`, `s9_lb_sg_ingress_after=1`, and `s9_plan_after_exit=0`.

7. Last item, also when you stop early or a command failed:

   ```bash
   unset WS HV LB_IP
   rm -f "$L/tfplan"
   test -n "$L" && rm -rf "$L" && echo "s9_logs_removed=yes"
   ```

Return: every `s9_` line, in order. The bodies in `$L` hold the workstation's address and are never
pasted.

### Step 10: A rollout that fails, its rollback and its alert

A revision of the running image without `ORIGIN` starts tasks that refuse to start: the server's
start-up check throws `Required environment variables are not set: ORIGIN` before it listens, and the
task exits. The service's circuit breaker counts the tasks that fail to start and rolls the service
back to its last completed deployment by itself, while the old task keeps serving. The rollback
publishes `SERVICE_DEPLOYMENT_FAILED`, which the alert rule mails to the operator. The fault is never
made by changing the health check, which would fail the serving task too.

`infra/scripts/request-loop.sh` requests the health route through the public name once a second from
before the fault's apply until the rollback is complete, and counts the answers that were not 2xx.

Before the step, the service's last deployment must be completed, or the circuit breaker has nothing
to roll back to; item 1 reads it. Run the step in one sitting: it takes up to 40 minutes.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s10_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s10_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. The outputs, the service before the fault, and its running task:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s10-init.log" 2>&1
   echo "s10_init_exit=$?"
   out() { terraform -chdir="$T" output -raw "$1" 2>> "$L/out.err"; }
   C=$(out cluster_name)
   S=$(out service_name)
   G=$(out log_group_name)
   test -n "$G"; echo "s10_outputs_read_exit=$?"
   changes() {
     jq -r --arg p "$1" '.resource_changes[]
       | select(.change.actions != ["no-op"])
       | select(.change.actions != ["read"])
       | "\($p)=\(.change.actions | join("-")) \(.address)"' "$2"
   }
   aws ecs describe-services --cluster "$C" --services "$S" \
     > "$L/s10-before.json" 2> "$L/s10-before.err"
   echo "s10_service_read_exit=$?"
   jq -r '.services[0] | (.deployments[]
     | "s10_deployment_before=\(.status) \(.rolloutState)"),
     "s10_running_before=\(.runningCount)"' "$L/s10-before.json"
   OLD_TD=$(jq -r '.services[0].taskDefinition' "$L/s10-before.json")
   TG=$(jq -r '.services[0].loadBalancers[0].targetGroupArn' \
     "$L/s10-before.json")
   echo "s10_old_revision=${OLD_TD##*:}"
   aws ecs list-tasks --cluster "$C" --service-name "$S" \
     --desired-status RUNNING \
     > "$L/s10-tasks.json" 2> "$L/s10-tasks.err"
   echo "s10_list_tasks_exit=$?"
   OLD=$(jq -r '.taskArns[0]' "$L/s10-tasks.json")
   aws ecs describe-tasks --cluster "$C" --tasks "$OLD" \
     > "$L/s10-old.json" 2> "$L/s10-old.err"
   echo "s10_old_task_read_exit=$?"
   OLD_IP=$(jq -r '.tasks[0].attachments[].details[]
     | select(.name == "privateIPv4Address") | .value' \
     "$L/s10-old.json")
   START=$(jq -n 'now | floor')
   ```

   Expected: exactly one line `s10_deployment_before=PRIMARY COMPLETED` and `s10_running_before=1`.
   Otherwise stop here and run item 10.

2. Start the request loop in the background:

   ```bash
   ( infra/scripts/request-loop.sh \
       --url https://staging.openvaa.org/api/health \
       --until "$L/stop" --out "$L/loop.csv" \
       > "$L/s10-loop.txt" 2> "$L/s10-loop.err"
     echo "s10_loop_exit=$?" > "$L/s10-loop.status" ) &
   sleep 5; echo "s10_loop_lines=$(wc -l < "$L/loop.csv" | tr -d ' ')"
   ```

   `s10_loop_lines` must be above 0.

3. The plan with `ORIGIN` left out, read against the stop rule:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" -var 'omit_environment=["ORIGIN"]' \
     > "$L/s10-plan.log" 2>&1
   echo "s10_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s10-plan.log" \
     | sed 's/^/s10_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s10-plan.json" 2> "$L/s10-show.err"
   echo "s10_show_exit=$?"
   changes s10_change "$L/s10-plan.json"
   ```

   > **Apply only when `s10_plan_exit=0`, `s10_plan_line` reads
   > `Plan: 1 to add, 1 to change, 1 to destroy.`, and the `s10_change=` lines are the task
   > definition's `delete-create` and the service's `update` alone.** Otherwise do not apply: `touch "$L/stop"`, run item 10, paste the
   > lines and stop.

4. The apply, in the background, and the deployments read every 30 seconds for up to 30 minutes. The
   apply waits for a steady state, which a failing rollout never reaches, so its status is read later
   and recorded whatever it is. Each read writes one line of `<time>,<deployments>,<old target>`,
   each deployment as `<status>:<rollout state>:<revision>:<failed tasks>`, and the old task's target
   state:

   ```bash
   ( terraform -chdir="$T" apply -input=false -no-color \
       "$L/tfplan" > "$L/s10-apply.log" 2>&1
     echo "s10_fault_apply_exit=$?" > "$L/s10-apply.status" ) &
   echo "s10_fault_apply_started_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   : > "$L/s10-poll.csv"; : > "$L/s10-failed.txt"
   for i in $(seq 1 60); do
     sleep 30
     aws ecs describe-services --cluster "$C" --services "$S" \
       > "$L/s10-poll.json" 2>> "$L/s10-poll.err"
     aws elbv2 describe-target-health --target-group-arn "$TG" \
       > "$L/s10-health.json" 2>> "$L/s10-poll.err"
     jq -r --arg ip "$OLD_IP" --slurpfile h "$L/s10-health.json" '
       .services[0] | [(now | todate),
         (.deployments | map("\(.status):\(.rolloutState):"
           + "\(.taskDefinition | split(":") | last)"
           + ":\(.failedTasks)") | join(" ")),
         ([$h[0].TargetHealthDescriptions[]
           | select(.Target.Id == $ip) | .TargetHealth.State]
           | join(""))] | join(",")' \
       "$L/s10-poll.json" >> "$L/s10-poll.csv"
     jq -r '.services[0].deployments[]
       | select(.rolloutState == "FAILED")
       | "\(.taskDefinition)\t\(.rolloutStateReason)"' \
       "$L/s10-poll.json" >> "$L/s10-failed.txt"
     jq -e --arg old "$OLD_TD" '.services[0].deployments
       | length == 1 and .[0].taskDefinition == $old
         and .[0].rolloutState == "COMPLETED"' \
       "$L/s10-poll.json" > /dev/null \
       && test -s "$L/s10-failed.txt" && break
   done
   echo "s10_poll_reads=$i"
   sed 's/^/s10_poll=/' "$L/s10-poll.csv"
   cut -f2 "$L/s10-failed.txt" | sort -u \
     | sed 's/^/s10_rollout_state_reason=/'
   NEW_TD=$(cut -f1 "$L/s10-failed.txt" | sort -u | head -1)
   echo "s10_failed_revision=${NEW_TD##*:}"
   jq -r --arg old "$OLD_TD" '.services[0].deployments
     | "s10_rollback=" + (if length == 1
       and .[0].taskDefinition == $old
       and .[0].rolloutState == "COMPLETED" then "yes" else "no" end)' \
     "$L/s10-poll.json"
   echo "s10_old_target_not_healthy_reads=$(awk -F, \
     '$3 != "healthy" { n++ } END { print n + 0 }' "$L/s10-poll.csv")"
   jq -r '.services[0].events[:20][]
     | select(.message | test("circuit breaker|roll"; "i"))
     | "s10_event=\(.createdAt) \(.message)"' "$L/s10-poll.json"
   ```

   Expected: `s10_rollback=yes`, a `s10_rollout_state_reason=` naming the circuit breaker, a
   `s10_failed_revision=` one above `s10_old_revision`, and `s10_old_target_not_healthy_reads=0`.
   **With `s10_rollback=no` after 60 reads, the circuit breaker did not trip within 30 minutes: do not
   change the fault and do not apply anything. Run items 6, 8 and 10, paste the lines and stop for a
   decision**, because the stack now runs a failing deployment beside the old task.

5. The failed tasks: their stop reasons, their exit codes, and the start-up line in each one's own
   stream. A server log record is printed over several lines, and the log driver stores each line as
   an event of its own, so the search matches the message line alone. The lines printed here are the
   copy of the log lines: paste them at once, because the log group goes with a destroy.

   The stopped tasks are listed for the whole cluster: filtered by `--service-name`, `list-tasks`
   with `--desired-status STOPPED` exits 0 and lists none of them. A failed task is one of the failed
   revision that stopped with `EssentialContainerExited`; the task the rollback stops while it is
   still pending is of the same revision but never ran, and is counted apart:

   ```bash
   aws ecs list-tasks --cluster "$C" --desired-status STOPPED \
     > "$L/s10-stopped.json" 2> "$L/s10-stopped.err"
   echo "s10_list_stopped_exit=$?"
   jq -r '.taskArns[]' "$L/s10-stopped.json" > "$L/s10-stopped.txt"
   xargs aws ecs describe-tasks --cluster "$C" --tasks \
     < "$L/s10-stopped.txt" \
     > "$L/s10-stopped-tasks.json" 2> "$L/s10-stopped-tasks.err"
   echo "s10_describe_stopped_exit=$?"
   jq -r --arg td "$NEW_TD" '[.tasks[]
     | select(.taskDefinitionArn == $td)]
     | "s10_new_revision_stopped_tasks=\(length)",
       ([.[] | select(.stopCode == "EssentialContainerExited")]
       | "s10_failed_tasks=\(length)",
         (map(.stoppedReason) | unique[]
           | "s10_failed_task_reason=\(.)"),
         (map(.containers[0].exitCode | tostring) | unique[]
           | "s10_failed_task_exit=\(.)"))' \
     "$L/s10-stopped-tasks.json"
   jq -r --arg td "$NEW_TD" '.tasks[]
     | select(.taskDefinitionArn == $td
       and .stopCode == "EssentialContainerExited")
     | .taskArn | split("/") | last' "$L/s10-stopped-tasks.json" \
     | sort -u > "$L/s10-failed-ids.txt"
   aws logs filter-log-events --log-group-name "$G" \
     --start-time "$((START * 1000))" \
     --filter-pattern '"Required environment variables are not set: ORIGIN"' \
     > "$L/s10-startup.json" 2> "$L/s10-startup.err"
   echo "s10_startup_read_exit=$?"
   jq -r '.events[] | "s10_startup_line=\(.logStreamName
     | split("/") | last) \(.timestamp / 1000 | floor | todate) "
     + (.message | gsub("^\\s+|\\s+$"; ""))' "$L/s10-startup.json"
   jq -r '.events[].logStreamName | split("/") | last' \
     "$L/s10-startup.json" | sort -u > "$L/s10-line-ids.txt"
   echo "s10_failed_task_streams_with_line=$(comm -12 \
     "$L/s10-failed-ids.txt" "$L/s10-line-ids.txt" \
     | wc -l | tr -d ' ')"
   ```

   Expected: `s10_failed_tasks=` at least 3, a `s10_failed_task_exit=` other than 0, at least one
   `s10_startup_line=` whose text ends `Required environment variables are not set: ORIGIN`, and
   `s10_failed_task_streams_with_line=` equal to `s10_failed_tasks`. `s10_new_revision_stopped_tasks=`
   may be one above `s10_failed_tasks`, for the pending task the rollback stopped.

6. The apply's status, whatever it is, and the titles of its errors:

   ```bash
   until test -s "$L/s10-apply.status"; do sleep 30; done
   cat "$L/s10-apply.status"
   grep -E '^Error: ' "$L/s10-apply.log" | sed 's/^/s10_apply_error=/'
   rm -f "$L/tfplan"; echo "s10_plan_file_removed=yes"
   ```

   A status other than 0 is expected and recorded: the service did not reach a steady state on the
   new revision.

7. The alert: how often the rule fired and invoked its target, and how many notifications the topic
   delivered, from the fault's apply until now. The metrics arrive a few minutes late, so read them
   no earlier than five minutes after the rollback, and a 0 read sooner is read again:

   ```bash
   FROM=$(jq -nr --argjson t "$START" '$t | todate')
   TO=$(jq -nr 'now | todate')
   metric() {
     aws cloudwatch get-metric-statistics --namespace "$1" \
       --metric-name "$2" --dimensions "Name=$3,Value=$4" \
       --start-time "$FROM" --end-time "$TO" --period 300 \
       --statistics Sum > "$L/s10-$2.json" 2> "$L/s10-$2.err"
     echo "s10_$2_read_exit=$?"
     jq -r --arg m "$2" '"s10_\($m)=\([.Datapoints[].Sum]
       | add // 0 | floor)"' "$L/s10-$2.json"
   }
   R=openvaa-staging-frontend-deployment-failed
   metric AWS/Events TriggeredRules RuleName "$R"
   metric AWS/Events Invocations RuleName "$R"
   metric AWS/SNS NumberOfNotificationsDelivered TopicName \
     openvaa-staging-frontend-deployments
   ```

   Expected: `s10_TriggeredRules=`, `s10_Invocations=` and `s10_NumberOfNotificationsDelivered=` each
   at least 1.

8. Stop the loop and read its count:

   ```bash
   touch "$L/stop"
   until test -s "$L/s10-loop.status"; do sleep 5; done
   cat "$L/s10-loop.status"
   sed 's/^/s10_loop_/' "$L/s10-loop.txt"
   ```

   Expected: `s10_loop_exit=0` and `s10_loop_requests=<n> non_2xx=0`.

9. **The operator's:** the alert mail. In the alert mailbox, find the mail from AWS Notifications sent
   after `s10_fault_apply_started_utc`, and check that its body names `SERVICE_DEPLOYMENT_FAILED` and
   the service `openvaa-staging-frontend`. Answer `answer_alert_mail=arrived` and
   `answer_alert_mail_utc=<the time it was sent, UTC>`, or `answer_alert_mail=absent` if none has come
   within half an hour of the rollback. Never paste the mail or its address.

10. Last item, also when you stop early or a command failed. It stops the loop if it still runs:

    ```bash
    touch "$L/stop" 2> /dev/null; sleep 2
    rm -f "$L/tfplan"
    test -n "$L" && rm -rf "$L" && echo "s10_logs_removed=yes"
    ```

Return: every `s10_` line, in order, and the two `answer_alert_mail` lines. The service now runs the
old revision while the state names the failed one; Step 11 is the next step and puts them together.

### Step 11: The restore and the stop signal

A plain apply puts `ORIGIN` back. Its rollout starts a new task, waits for it to serve, then
deregisters the old task, waits out the deregistration delay and signals it with `SIGTERM`. The server
drains what it holds and writes one record, `The server is exiting after its stop.`, with the signal's
name, before it exits. The task stays listed with its stop reason and exit code for about an hour.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s11_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s11_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. The outputs and the task that is serving now, which the restore will stop:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s11-init.log" 2>&1
   echo "s11_init_exit=$?"
   out() { terraform -chdir="$T" output -raw "$1" 2>> "$L/out.err"; }
   C=$(out cluster_name)
   S=$(out service_name)
   G=$(out log_group_name)
   test -n "$G"; echo "s11_outputs_read_exit=$?"
   changes() {
     jq -r --arg p "$1" '.resource_changes[]
       | select(.change.actions != ["no-op"])
       | select(.change.actions != ["read"])
       | "\($p)=\(.change.actions | join("-")) \(.address)"' "$2"
   }
   aws ecs list-tasks --cluster "$C" --service-name "$S" \
     --desired-status RUNNING \
     > "$L/s11-tasks.json" 2> "$L/s11-tasks.err"
   echo "s11_list_tasks_exit=$?"
   jq -r '"s11_running_before=\(.taskArns | length)"' \
     "$L/s11-tasks.json"
   OLD=$(jq -r '.taskArns[0]' "$L/s11-tasks.json")
   ```

   Expected: `s11_running_before=1`.

2. Start the request loop in the background:

   ```bash
   ( infra/scripts/request-loop.sh \
       --url https://staging.openvaa.org/api/health \
       --until "$L/stop" --out "$L/loop.csv" \
       > "$L/s11-loop.txt" 2> "$L/s11-loop.err"
     echo "s11_loop_exit=$?" > "$L/s11-loop.status" ) &
   sleep 5; echo "s11_loop_lines=$(wc -l < "$L/loop.csv" | tr -d ' ')"
   ```

3. The plain plan, read against the stop rule:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" > "$L/s11-plan.log" 2>&1
   echo "s11_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s11-plan.log" \
     | sed 's/^/s11_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s11-plan.json" 2> "$L/s11-show.err"
   echo "s11_show_exit=$?"
   changes s11_change "$L/s11-plan.json"
   ```

   > **Apply only when `s11_plan_exit=0`, `s11_plan_line` reads
   > `Plan: 1 to add, 1 to change, 1 to destroy.`, and the `s11_change=` lines are the task
   > definition's `delete-create` and the service's `update` alone.** Otherwise do not apply: run item 8, paste the lines and stop.

4. The apply, which must exit 0:

   ```bash
   ( terraform -chdir="$T" apply -input=false -no-color \
       "$L/tfplan" > "$L/s11-apply.log" 2>&1
     echo "s11_restore_apply_exit=$?" > "$L/s11-apply.status" ) &
   until test -s "$L/s11-apply.status"; do sleep 30; done
   cat "$L/s11-apply.status"
   grep -E '^Error: ' "$L/s11-apply.log" | sed 's/^/s11_apply_error=/'
   rm -f "$L/tfplan"; echo "s11_plan_file_removed=yes"
   ```

5. The task the restore stopped: its status, its stop reason and its container's exit code, and the
   stop record in its own stream. The record is stored as one event per line, so the message line and
   the signal line are searched for separately, each in that stream alone. The lines printed here are
   the copy of the log lines: paste them at once:

   ```bash
   aws ecs describe-tasks --cluster "$C" --tasks "$OLD" \
     > "$L/s11-old.json" 2> "$L/s11-old.err"
   echo "s11_old_task_read_exit=$?"
   jq -r '.tasks[0] | "s11_stopped_task_status=\(.lastStatus)",
     "s11_stopped_task_reason=\(.stoppedReason)",
     "s11_stopped_task_exit=\(.containers[0].exitCode)"' \
     "$L/s11-old.json"
   OS="frontend/frontend/${OLD##*/}"
   aws logs filter-log-events --log-group-name "$G" \
     --log-stream-names "$OS" \
     --filter-pattern '"The server is exiting after its stop."' \
     > "$L/s11-stop-message.json" 2> "$L/s11-stop-message.err"
   echo "s11_stop_message_read_exit=$?"
   aws logs filter-log-events --log-group-name "$G" \
     --log-stream-names "$OS" \
     --filter-pattern "\"signal: 'SIGTERM'\"" \
     > "$L/s11-stop-signal.json" 2> "$L/s11-stop-signal.err"
   echo "s11_stop_signal_read_exit=$?"
   for f in message signal; do
     jq -r --arg f "$f" '"s11_stop_\($f)_events=\(.events | length)",
       (.events[] | "s11_stop_\($f)_line=\(.logStreamName
         | split("/") | last) \(.timestamp / 1000 | floor | todate) "
         + (.message | gsub("^\\s+|\\s+$"; "")))' \
       "$L/s11-stop-$f.json"
   done
   ```

   Expected: `s11_stopped_task_status=STOPPED`, `s11_stopped_task_exit=0`,
   `s11_stop_message_events=1` with a line ending `msg: 'The server is exiting after its stop.',`, and
   `s11_stop_signal_events=1` with a line ending `signal: 'SIGTERM',`, both in the stream of the
   stopped task and in the same second.

6. Stop the loop and read its count:

   ```bash
   touch "$L/stop"
   until test -s "$L/s11-loop.status"; do sleep 5; done
   cat "$L/s11-loop.status"
   sed 's/^/s11_loop_/' "$L/s11-loop.txt"
   ```

   Expected: `s11_loop_exit=0` and `s11_loop_requests=<n> non_2xx=0`.

7. Plan again. It must exit 0, which means no change:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -detailed-exitcode > "$L/s11-second.log" 2>&1
   echo "s11_plan_after_exit=$?"
   grep -E '^  # ' "$L/s11-second.log" | sed 's/^/s11_second_change=/'
   ```

8. Last item, also when you stop early or a command failed:

   ```bash
   touch "$L/stop" 2> /dev/null; sleep 2
   rm -f "$L/tfplan"
   test -n "$L" && rm -rf "$L" && echo "s11_logs_removed=yes"
   ```

Return: every `s11_` line, in order.

### Step 12: The floor raised ahead of time and lowered again

Two scheduled actions, given on the command line for one apply: the first raises the scalable
target's floor to 2 six minutes ahead, the second lowers it to 1 ten minutes later, both with the
ceiling 2. The raise makes the service start a second task. The lowering only lowers the floor; the
count comes down when target tracking scales in. At idle CPU its low alarm is already in `ALARM`, so
it scales in within a minute of the lowering (see "Observations"), and the step waits up to 30
minutes after the lowering only in case the stack is not idle. The scale-in stops a task, which
writes the stop record a second time.
The root gives the actions no time zone, so their times are read in UTC.

No apply is made between the two actions: inside that window the scalable target's floor is the
raised one, a plan shows it as a change, and an apply would put it back. This step is the rehearsal of
"Election day".

Run the step in one sitting: it takes about 20 minutes at idle, and up to 50. Keep the workstation
awake for item 4: a sleep, a closed lid included, leaves gaps in the minute reads, and those reads
are then not a record of the count; take the pair off with item 7 and run the step again with new
times. On battery, `caffeinate -i` does not stop a lid-closed sleep. Run item 6 as soon as item 4
ends: a stopped task ages out of `describe-tasks` within about an hour, though its stream stays.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s12_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s12_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. The outputs, and the tasks that run now:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s12-init.log" 2>&1
   echo "s12_init_exit=$?"
   out() { terraform -chdir="$T" output -raw "$1" 2>> "$L/out.err"; }
   C=$(out cluster_name)
   S=$(out service_name)
   G=$(out log_group_name)
   test -n "$G"; echo "s12_outputs_read_exit=$?"
   RID="service/$C/$S"
   changes() {
     jq -r --arg p "$1" '.resource_changes[]
       | select(.change.actions != ["no-op"])
       | select(.change.actions != ["read"])
       | "\($p)=\(.change.actions | join("-")) \(.address)"' "$2"
   }
   running() {
     aws ecs list-tasks --cluster "$C" --service-name "$S" \
       --desired-status RUNNING --query 'taskArns[]' \
       --output text 2>> "$L/s12-running.err" | tr '\t' '\n'
   }
   running > "$L/s12-seen.txt"
   echo "s12_running_before=$(grep -c . "$L/s12-seen.txt")"
   ```

   Expected: `s12_running_before=1`.

2. The two times, six and sixteen minutes ahead on the minute, and the plan with the pair:

   ```bash
   NOW=$(jq -n 'now | floor')
   E1=$((NOW - NOW % 60 + 360)); E2=$((E1 + 600))
   T1=$(jq -nr --argjson t "$E1" '$t | strftime("%Y-%m-%dT%H:%M:%S")')
   T2=$(jq -nr --argjson t "$E2" '$t | strftime("%Y-%m-%dT%H:%M:%S")')
   echo "s12_raise_utc=${T1}Z"; echo "s12_lower_utc=${T2}Z"
   R1="{name=\"raise\",schedule=\"at($T1)\",min_capacity=2,max_capacity=2}"
   R2="{name=\"lower\",schedule=\"at($T2)\",min_capacity=1,max_capacity=2}"
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" -var "scheduled_floor_changes=[$R1,$R2]" \
     > "$L/s12-plan.log" 2>&1
   echo "s12_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s12-plan.log" \
     | sed 's/^/s12_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s12-plan.json" 2> "$L/s12-show.err"
   echo "s12_show_exit=$?"
   changes s12_change "$L/s12-plan.json"
   ```

3. Read the plan against the stop rule, and check that the raise is still at least two minutes ahead:

   > **Apply only when `s12_plan_exit=0`, `s12_plan_line` reads
   > `Plan: 2 to add, 0 to change, 0 to destroy.`, the `s12_change=` lines are `create` of
   > `module.frontend.aws_appautoscaling_scheduled_action.floor["raise"]` and of `…floor["lower"]`
   > alone, and `s12_margin_exit=0`.** With any other plan, do not apply: run item 8, paste the lines
   > and stop. With only the margin short, run item 8 and start the step again, for new times.

   ```bash
   test $((E1 - $(jq -n 'now | floor'))) -ge 120
   echo "s12_margin_exit=$?"
   terraform -chdir="$T" apply -input=false -no-color \
     "$L/tfplan" > "$L/s12-apply.log" 2>&1
   echo "s12_pair_apply_exit=$?"
   rm -f "$L/tfplan"; echo "s12_plan_file_removed=yes"
   aws application-autoscaling describe-scheduled-actions \
     --service-namespace ecs --resource-id "$RID" \
     > "$L/s12-actions.json" 2> "$L/s12-actions.err"
   echo "s12_actions_read_exit=$?"
   jq -r '"s12_scheduled_actions=\(.ScheduledActions | length)"' \
     "$L/s12-actions.json"
   ```

   Expected: `s12_pair_apply_exit=0` and `s12_scheduled_actions=2`.

4. The count, read every minute until it has reached 2 and, after the lowering, come back to 1, or
   until 30 minutes after the lowering. Each read writes a line of
   `<time>,<running>,<desired>,<floor>,<ceiling>`, and every task seen running is kept:

   ```bash
   : > "$L/s12-counts.csv"
   caffeinate -i & CAF=$!
   while [ "$(jq -n 'now | floor')" -le $((E2 + 1800)) ]; do
     aws ecs describe-services --cluster "$C" --services "$S" \
       > "$L/s12-service.json" 2>> "$L/s12-poll.err"
     aws application-autoscaling describe-scalable-targets \
       --service-namespace ecs --resource-ids "$RID" \
       > "$L/s12-target.json" 2>> "$L/s12-poll.err"
     jq -rn --slurpfile s "$L/s12-service.json" \
       --slurpfile t "$L/s12-target.json" '
       [(now | todate), ($s[0].services[0].runningCount // -1),
         ($s[0].services[0].desiredCount // -1),
         ($t[0].ScalableTargets[0].MinCapacity // -1),
         ($t[0].ScalableTargets[0].MaxCapacity // -1)]
       | map(tostring) | join(",")' >> "$L/s12-counts.csv"
     running >> "$L/s12-seen.txt"
     if [ "$(jq -n 'now | floor')" -gt "$E2" ] \
       && grep -q '^[^,]*,2,' "$L/s12-counts.csv" \
       && tail -1 "$L/s12-counts.csv" | grep -q ',1,1,1,2$'; then
       break
     fi
     sleep 60
   done
   kill "$CAF"
   sed 's/^/s12_count=/' "$L/s12-counts.csv"
   jq -rRs --arg t "${T2}Z" '
     [split("\n")[] | select(length > 0) | split(",")
       | map(tonumber? // .)
       | {u: .[0], r: .[1], d: .[2], min: .[3], max: .[4]}] as $c
     | ($c | map(select(.r == 2)) | .[0].u) as $two
     | ($c | map(select(.u >= $t and .r == 1 and .d == 1))
       | .[0].u) as $one
     | "s12_max_running=\($c | map(.r) | max)",
       "s12_desired_below_floor_reads=\($c
         | map(select(.d < .min)) | length)",
       "s12_count_two_utc=\($two // "none")",
       "s12_count_one_utc=\($one // "none")",
       "s12_scale_in_minutes=" + (if $one then ((($one | fromdate)
         - ($t | fromdate)) / 60 | floor | tostring) else "none" end)' \
     "$L/s12-counts.csv"
   ```

   Expected: `s12_max_running=2`, `s12_desired_below_floor_reads=0`, a `s12_count_two_utc=` after
   `s12_raise_utc`, and a `s12_count_one_utc=` after `s12_lower_utc`. `s12_scale_in_minutes` is a
   measurement, recorded as it reads. The running count lags the desired one for the minute or two a
   task takes to start, so the floor is judged on the desired count.

5. The scaling activities, as Application Auto Scaling describes them:

   ```bash
   aws application-autoscaling describe-scaling-activities \
     --service-namespace ecs --resource-id "$RID" --max-items 10 \
     > "$L/s12-activities.json" 2> "$L/s12-activities.err"
   echo "s12_activities_read_exit=$?"
   jq -r '.ScalingActivities[]
     | "s12_activity=\(.StartTime) \(.StatusCode) \(.Description)"' \
     "$L/s12-activities.json"
   ```

6. The task the scale-in stopped, and the stop record in its own stream, searched for as in Step 11.
   The lines printed here are the copy of the log lines: paste them at once:

   ```bash
   running | sort -u > "$L/s12-now.txt"
   sort -u "$L/s12-seen.txt" | sed '/^$/d' \
     | comm -23 - "$L/s12-now.txt" > "$L/s12-gone.txt"
   echo "s12_tasks_stopped=$(grep -c . "$L/s12-gone.txt")"
   GONE=$(head -1 "$L/s12-gone.txt")
   aws ecs describe-tasks --cluster "$C" --tasks "$GONE" \
     > "$L/s12-gone.json" 2> "$L/s12-gone.err"
   echo "s12_gone_task_read_exit=$?"
   jq -r '.tasks[0] | "s12_stopped_task_reason=\(.stoppedReason)",
     "s12_stopped_task_exit=\(.containers[0].exitCode)"' \
     "$L/s12-gone.json"
   GS="frontend/frontend/${GONE##*/}"
   aws logs filter-log-events --log-group-name "$G" \
     --log-stream-names "$GS" \
     --filter-pattern '"The server is exiting after its stop."' \
     > "$L/s12-stop-message.json" 2> "$L/s12-stop-message.err"
   echo "s12_stop_message_read_exit=$?"
   aws logs filter-log-events --log-group-name "$G" \
     --log-stream-names "$GS" \
     --filter-pattern "\"signal: 'SIGTERM'\"" \
     > "$L/s12-stop-signal.json" 2> "$L/s12-stop-signal.err"
   echo "s12_stop_signal_read_exit=$?"
   for f in message signal; do
     jq -r --arg f "$f" '"s12_stop_\($f)_events=\(.events | length)",
       (.events[] | "s12_stop_\($f)_line=\(.logStreamName
         | split("/") | last) \(.timestamp / 1000 | floor | todate) "
         + (.message | gsub("^\\s+|\\s+$"; "")))' \
       "$L/s12-stop-$f.json"
   done
   ```

   Expected: `s12_tasks_stopped=1`, a `s12_stopped_task_reason=` naming a scaling activity,
   `s12_stopped_task_exit=0`, and one event of each kind, the signal line ending `signal: 'SIGTERM',`.

7. The pair removed: the plan without the variable, read against the stop rule, applied, and the
   stack read back:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" > "$L/s12-off-plan.log" 2>&1
   echo "s12_off_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s12-off-plan.log" \
     | sed 's/^/s12_off_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s12-off-plan.json" 2> "$L/s12-off-show.err"
   echo "s12_off_show_exit=$?"
   changes s12_off_change "$L/s12-off-plan.json"
   ```

   > **Apply only when `s12_off_plan_exit=0`, `s12_off_plan_line` reads
   > `Plan: 0 to add, 0 to change, 2 to destroy.`, and the `s12_off_change=` lines are `delete` of
   > the two scheduled actions alone.** A change of the scalable target means the lowering has not run yet: wait for it and plan
   > again. Otherwise do not apply: run item 8, paste the lines and stop.

   ```bash
   terraform -chdir="$T" apply -input=false -no-color \
     "$L/tfplan" > "$L/s12-off-apply.log" 2>&1
   echo "s12_pair_remove_apply_exit=$?"
   rm -f "$L/tfplan"; echo "s12_plan_file_removed=yes"
   aws application-autoscaling describe-scheduled-actions \
     --service-namespace ecs --resource-id "$RID" \
     > "$L/s12-actions-after.json" 2> "$L/s12-actions-after.err"
   echo "s12_actions_after_read_exit=$?"
   jq -r '"s12_scheduled_actions_after=\(.ScheduledActions
     | length)"' "$L/s12-actions-after.json"
   aws application-autoscaling describe-scalable-targets \
     --service-namespace ecs --resource-ids "$RID" \
     > "$L/s12-target-after.json" 2> "$L/s12-target-after.err"
   echo "s12_target_after_read_exit=$?"
   jq -r '.ScalableTargets[0]
     | "s12_target_bounds_after=\(.MinCapacity),\(.MaxCapacity)"' \
     "$L/s12-target-after.json"
   terraform -chdir="$T" plan -input=false -no-color \
     -detailed-exitcode > "$L/s12-plan-after.log" 2>&1
   echo "s12_plan_after_exit=$?"
   ```

   Expected: `s12_pair_remove_apply_exit=0`, `s12_scheduled_actions_after=0`,
   `s12_target_bounds_after=1,2` and `s12_plan_after_exit=0`.

8. Last item, also when you stop early or a command failed:

   ```bash
   rm -f "$L/tfplan"
   test -n "$L" && rm -rf "$L" && echo "s12_logs_removed=yes"
   ```

Return: every `s12_` line, in order.

## The hosted project, through the stack

Steps 13 and 14 observe two paths that run from the stack's pages to the hosted Supabase project, and
need the operator: a second network, and a mailbox. They write a few rows and one user to the
persistent project, the only change this runbook makes there, and Step 15 removes them before the
destroy. They are best run in one sitting of the operator's, Step 13 first.

### Step 13: The feedback limit, by client

The voter app's feedback form writes straight from the browser to the Supabase REST API, with the
anon key every page carries, as an insert into `public.feedback`. No route of this stack is on that
path, so the limit is the database's own: a trigger admits five inserts per client in a window of five
minutes and refuses the sixth with SQLSTATE `P0001`, which the REST API answers with status 400. On
hosted Supabase the client is the address Cloudflare, in front of the project, gives the connecting
client, so two clients on different networks have a bucket each.

Items 1 and 2 are run from the workstation. Items 3 to 5 are the operator's, with a phone that can
leave Wi-Fi, and start no earlier than five minutes after item 2, so that the workstation's window has
ended. Every insert carries the description `limit-check <time>`, by which Step 15 removes it. The
workstation's inserts are made over IPv4 (`curl -4`), so that all of them come from one address.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s13_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s13_account_match_exit=$?"
T=infra/envs/staging/aws
U=https://staging.openvaa.org
```

1. The page, the anon key it carries, and the insert the browser makes. The key is read from the page
   into a variable, never printed, and handed to `curl` as a configuration on a file descriptor:

   ```bash
   SB=$(sed -n 's/^ *PUBLIC_SUPABASE_URL *= *"\(.*\)"/\1/p' \
     "$T/terraform.tfvars")
   P=$(sed -n 's/^ *PUBLIC_PROJECT_ID *= *"\(.*\)"/\1/p' \
     "$T/terraform.tfvars")
   curl -sS --max-time 20 -L -o "$L/s13-page.html" \
     -w 's13_page_http=%{http_code}\n' "$U/" 2> "$L/s13-page.err"
   echo "s13_page_curl_exit=$?"
   K=$(sed -nE 's/.*PUBLIC_SUPABASE_ANON_KEY"?:"([^"]+)".*/\1/p' \
     "$L/s13-page.html" | head -1)
   test -n "$K"; echo "s13_anon_key_found_exit=$?"
   keys() {
     printf 'header = "apikey: %s"\n' "$K"
     printf 'header = "Authorization: Bearer %s"\n' "$K"
   }
   fb() {
     jq -n --arg p "$P" --arg u "$U/" \
       --arg d "limit-check $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '{project_id: $p, description: $d, url: $u,
         date: (now | todate)}' \
       | curl -4 -sS --max-time 20 -o "$L/s13-answer.json" \
         -w '%{http_code}' -K <(keys) \
         -H 'Content-Type: application/json' -H "Origin: $U" \
         --data-binary @- "$SB/rest/v1/feedback" \
         2>> "$L/s13-curl.err"
   }
   ```

   Expected: `s13_page_http=200` and both statuses 0.

2. One insert:

   ```bash
   CODE=$(fb); echo "s13_probe_insert_curl_exit=$?"
   echo "s13_probe_insert_http=$CODE"
   echo "s13_probe_insert_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   ```

   Expected: `s13_probe_insert_http=201`. Item 3 starts no earlier than five minutes after
   `s13_probe_insert_utc`.

3. **The operator's:** inserts from the workstation until the first refusal, at most seven, each
   status printed:

   ```bash
   echo "s13_block_started_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   for i in 1 2 3 4 5 6 7; do
     CODE=$(fb); X=$?
     echo "s13_insert_${i}_http=$CODE"
     echo "s13_insert_${i}_curl_exit=$X"
     test "$CODE" = 201 || break
   done
   jq -r '"s13_refusal_code=\(.code)"' "$L/s13-answer.json"
   ```

   Expected: `s13_insert_1_http=` to `s13_insert_5_http=` each `201`, `s13_insert_6_http=400` and
   `s13_refusal_code=P0001`. If the first insert is already refused, a window opened by an earlier
   insert from this network has not ended: wait five minutes and run this item again.

4. **The operator's:** within five minutes of `s13_block_started_utc`, on the phone with Wi-Fi off, so
   that it reaches the internet through the mobile network, open `https://staging.openvaa.org`, open
   the feedback form from the menu, write `limit-check phone` and the time as the text, and send it.
   The form thanks you when the feedback was stored and says it failed when it was refused. Answer
   `answer_phone_feedback=accepted` or `answer_phone_feedback=refused`, and
   `answer_phone_feedback_utc=<time>`.

5. **The operator's:** one more insert from the workstation, still within the five minutes:

   ```bash
   CODE=$(fb); echo "s13_after_phone_curl_exit=$?"
   echo "s13_after_phone_http=$CODE"
   jq -r '"s13_after_phone_code=\(.code)"' "$L/s13-answer.json"
   echo "s13_after_phone_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   ```

   Expected: `s13_after_phone_http=400` and `s13_after_phone_code=P0001`, with
   `s13_after_phone_utc` less than five minutes after `s13_block_started_utc`: the phone's insert was
   admitted while the workstation's bucket was full, so the two clients were counted apart.

6. Last item, also when you stop early or a command failed:

   ```bash
   unset K
   test -n "$L" && rm -rf "$L" && echo "s13_logs_removed=yes"
   ```

Return: every `s13_` line and the two `answer_phone_feedback` lines.

### Step 14: One invitation mail, followed to a signed-in recipient

The operator's step, except item 1. The first administrator signs in at the staging URL through the
Admin App's login form, which shows the sign-in working through both proxies and how its answer,
which sets the auth cookies, is cached. The administrator then creates one email invitation for a
smoke candidate, addressed to a second mailbox of the operator's own, with `p_confirm_entity` false,
so that whether the candidate is confirmed, and so what voters see, does not change. Creating an
invitation sends nothing. The operator asks for a sign-in link on the Contestant App's sign-in screen
at the staging URL; the mail carries a link whose origin is the hosted project's `SITE_URL`,
`https://staging.openvaa.org`, and following it signs the recipient in and claims the invitation.

The second mailbox must be able to receive the project's mail: while the mail identity is in the
sandbox, it must be verified first, as [`../dns-mail/README.md`](../dns-mail/README.md) Step 9
describes. No address, password, token, or link query goes into a pasted line.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s14_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s14_account_match_exit=$?"
T=infra/envs/staging/aws
U=https://staging.openvaa.org
```

1. The project's registration modes for candidates, and one smoke candidate's id, both read
   anonymously, as any visitor can:

   ```bash
   SB=$(sed -n 's/^ *PUBLIC_SUPABASE_URL *= *"\(.*\)"/\1/p' \
     "$T/terraform.tfvars")
   P=$(sed -n 's/^ *PUBLIC_PROJECT_ID *= *"\(.*\)"/\1/p' \
     "$T/terraform.tfvars")
   curl -sS --max-time 20 -L -o "$L/s14-page.html" "$U/" \
     2> "$L/s14-page.err"
   echo "s14_page_curl_exit=$?"
   K=$(sed -nE 's/.*PUBLIC_SUPABASE_ANON_KEY"?:"([^"]+)".*/\1/p' \
     "$L/s14-page.html" | head -1)
   test -n "$K"; echo "s14_anon_key_found_exit=$?"
   keys() {
     printf 'header = "apikey: %s"\n' "$K"
     printf 'header = "Authorization: Bearer %s"\n' "$K"
   }
   jq -n --arg p "$P" '{p_project_id: $p}' \
     | curl -sS --max-time 20 -o "$L/s14-config.json" \
       -w 's14_config_http=%{http_code}\n' -K <(keys) \
       -H 'Content-Type: application/json' --data-binary @- \
       "$SB/rest/v1/rpc/contestant_app_public_config" \
       2> "$L/s14-config.err"
   jq -r '.contestantApp.registrationModes.candidate // []
     | "s14_candidate_modes=\(join(","))"' "$L/s14-config.json"
   Q="select=id&project_id=eq.$P&external_id=like.smoke_*"
   curl -sS --max-time 20 -o "$L/s14-candidate.json" \
     -w 's14_candidate_http=%{http_code}\n' -K <(keys) \
     "$SB/rest/v1/candidates?$Q&order=external_id&limit=1" \
     2> "$L/s14-candidate.err"
   CAND=$(jq -r '.[0].id // empty' "$L/s14-candidate.json")
   echo "s14_candidate=$CAND"
   ```

   Expected: `s14_candidate_modes=` listing `email`, and `s14_candidate=` an id. Without `email` the
   project honours no email invitation for a candidate: stop here.

2. **The operator's:** the first administrator's sign-in through the Admin App's login form at the
   staging URL. The address and the password are read at prompts, the password without echoing it,
   and reach `curl` from the environment through `jq`, on standard input. Only the status, the
   redirect's path, two headers and the names of the cookies the answer sets are printed. The form
   body is written with `jq -j`, which ends it without a newline: `--data-binary` sends its input
   unchanged, so a trailing newline would become part of the last field, the password, and the
   sign-in would be refused with 400:

   ```bash
   printf 'administrator address: '; read -r ADMIN_EMAIL
   export ADMIN_EMAIL
   printf 'administrator password: '; read -rs ADMIN_PASSWORD
   echo; export ADMIN_PASSWORD
   hdr() { awk -v n="$2:" 'tolower($1) == n { sub(/\r$/, "");
     sub(/^[^:]*: */, ""); print; exit }' "$1"; }
   curl -sS --max-time 20 -L -o /dev/null -w '%{url_effective}' \
     "$U/admin/login" > "$L/s14-login.url" 2> "$L/s14-login.err"
   echo "s14_login_page_curl_exit=$?"
   LP=$(sed "s|^$U||; s|?.*||" "$L/s14-login.url")
   echo "s14_login_path=$LP"
   A='Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
   jq -jn '"email=\(env.ADMIN_EMAIL | @uri)"
     + "&password=\(env.ADMIN_PASSWORD | @uri)"' \
     | curl -sS --max-time 20 -o /dev/null -D "$L/s14-signin.txt" \
       -w 's14_admin_signin_http=%{http_code}\n' \
       -H "$A" -H "Origin: $U" --data-binary @- "$U$LP" \
       2> "$L/s14-signin.err"
   echo "s14_admin_signin_curl_exit=$?"
   echo "s14_signin_location=$(hdr "$L/s14-signin.txt" location \
     | sed 's/?.*//')"
   echo "s14_signin_cache_control=$(hdr "$L/s14-signin.txt" \
     cache-control)"
   echo "s14_signin_x_cache=$(hdr "$L/s14-signin.txt" x-cache)"
   echo "s14_signin_cookie_names=$(sed -n \
     's/^[Ss]et-[Cc]ookie: *\([^=]*\)=.*/\1/p' "$L/s14-signin.txt" \
     | sort -u | paste -sd, -)"
   ```

   Expected: `s14_admin_signin_http=303`, `s14_signin_location=` the Admin App on the public origin,
   as a path or as `https://staging.openvaa.org/admin`, `s14_signin_cookie_names=` naming the auth
   cookies, and `s14_signin_x_cache=Miss from cloudfront`. `s14_signin_cache_control=` is recorded as
   it reads. A 400 with `Error from cloudfront` and no cookies is the action's refusal of the
   credentials: check that the body was written with `jq -j`.

3. **The operator's:** the administrator's access token, by the password sign-in of
   [`../supabase/README.md`](../supabase/README.md) Step 21. The answer, which holds the token, stays
   in `$L`:

   ```bash
   jq -n '{email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD}' \
     | curl -sS --max-time 20 -o "$L/s14-token.json" \
       -w 's14_token_http=%{http_code}\n' -K <(keys) \
       -H 'Content-Type: application/json' --data-binary @- \
       "$SB/auth/v1/token?grant_type=password" 2> "$L/s14-token.err"
   unset ADMIN_PASSWORD
   TOKEN=$(jq -r '.access_token // empty' "$L/s14-token.json")
   test -n "$TOKEN"; echo "s14_token_read_exit=$?"
   ```

   Expected: `s14_token_http=200` and `s14_token_read_exit=0`.

4. **The operator's:** the invitation, created with the administrator's own session through
   `create_invitations`: one entity-scope `editor` item for the candidate of item 1, to the second
   mailbox, read at a prompt, and `p_confirm_entity` false. Its id is printed, and its address never:

   ```bash
   printf 'second mailbox: '; read -r INVITEE_EMAIL
   export INVITEE_EMAIL
   auth() {
     printf 'header = "apikey: %s"\n' "$K"
     printf 'header = "Authorization: Bearer %s"\n' "$TOKEN"
   }
   jq -n --arg p "$P" --arg c "$CAND" '{p_project_id: $p,
     p_confirm_entity: false, p_invitations: [{scope: "entity",
       role: "editor", target_type: "candidate", target_id: $c,
       email: env.INVITEE_EMAIL}]}' \
     | curl -sS --max-time 20 -o "$L/s14-invite.json" \
       -w 's14_invite_http=%{http_code}\n' -K <(auth) \
       -H 'Content-Type: application/json' --data-binary @- \
       "$SB/rest/v1/rpc/create_invitations" 2> "$L/s14-invite.err"
   jq -r 'if type == "array" then (.[0]
     | "s14_invitation_id=\(.id)",
       "s14_entity_confirmed=\(.entity_confirmed)",
       "s14_invitation_code="
         + (if .code then "present" else "none" end))
     else "s14_invite_error_code=\(.code)" end' "$L/s14-invite.json"
   unset TOKEN INVITEE_EMAIL
   ```

   Expected: `s14_invite_http=200`, `s14_invitation_id=` an id, which Step 15 needs, and
   `s14_invitation_code=none`, because an email invitation has no code. `s14_entity_confirmed=` is
   recorded as it reads; the call did not change it.

5. **The operator's**, in a browser:
   1. Open `https://staging.openvaa.org/contestant/login/email`, the Contestant App's sign-in screen,
      and ask for a sign-in link by email for the second mailbox.
   2. In the second mailbox, find the mail and look at its link without opening it: its origin must be
      `https://staging.openvaa.org` and its path `/<locale>/api/auth/callback`. Copy neither the link
      nor its query.
   3. Follow the link. A signed-in screen follows: the screen that asks a user with no password to set
      one, or the Contestant App's home.

   Answer `answer_mail_arrived=yes|no` with `answer_mail_utc=<time>`,
   `answer_link_origin=<scheme and host>`, `answer_link_path=<the path, without the query>`,
   `answer_signed_in=yes|no` and `answer_landing_screen=set-password|home|other`.

6. Last item, also when you stop early or a command failed:

   ```bash
   unset ADMIN_EMAIL ADMIN_PASSWORD INVITEE_EMAIL TOKEN K
   test -n "$L" && rm -rf "$L" && echo "s14_logs_removed=yes"
   ```

Return: every `s14_` line and the `answer_` lines of item 5. Keep `s14_invitation_id=` for Step 15.

## The destroy, the re-apply and the cost

Steps 15 and 16 destroy this root once, on purpose, and show that nothing it made is left in either
region while everything outside it is where it was. Step 17 applies it again from the same commit,
and Step 18 reads its cost over full days of that second stack.

### Step 15: Before the destroy

Three things come before the destroy: a last copy of the evidence log lines, because the log group
goes with the destroy; the removal of what Steps 13 and 14 wrote to the persistent project, the
feedback rows marked `limit-check`, the invitation and its recipient's user; and a plan of each of
the two long-lived roots beside this one, `dns-mail` and `supabase`, which must show no change. Those
plans are read only and are never applied. **Step 16 runs only when every item here reads as
expected.**

Items 1 to 3 are run from the workstation with the lines below. Items 4 and 5 are the operator's, in
a terminal of their own.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s15_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s15_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. The last copy of the log lines: every start-up refusal, every stop message and every stop signal
   the log group holds. Each is matched by its own line, because the log driver stores each line of a
   record as an event of its own. The `s15_log_line=` lines are the copy: paste every one:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s15-init.log" 2>&1
   echo "s15_init_exit=$?"
   G=$(terraform -chdir="$T" output -raw log_group_name)
   copy() {
     aws logs filter-log-events --log-group-name "$G" \
       --filter-pattern "$2" > "$L/s15-$1.json" 2> "$L/s15-$1.err"
     echo "s15_$1_read_exit=$?"
     jq -r --arg k "$1" '"s15_\($k)_events=\(.events | length)",
       (.events[] | "s15_log_line=\($k) \(.logStreamName
         | split("/") | last) \(.timestamp / 1000 | floor | todate) "
         + (.message | gsub("^\\s+|\\s+$"; "")))' "$L/s15-$1.json"
   }
   copy startup '"Required environment variables are not set"'
   copy stop '"The server is exiting after its stop."'
   copy signal "\"signal: 'SIGTERM'\""
   ```

   Expected: `s15_startup_events=` at least the failed tasks of Step 10, `s15_stop_events=` at least
   2, from Steps 11 and 12, and `s15_signal_events=` equal to `s15_stop_events`.

2. The plan of `dns-mail`, which holds the zone this root writes records into:

   ```bash
   D=infra/envs/staging/dns-mail
   terraform -chdir="$D" init -input=false -no-color \
     -lockfile=readonly > "$L/s15-dns-mail-init.log" 2>&1
   echo "s15_dns_mail_init_exit=$?"
   terraform -chdir="$D" plan -input=false -no-color \
     -detailed-exitcode > "$L/s15-dns-mail.log" 2>&1
   echo "s15_dns_mail_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s15-dns-mail.log" \
     | sed 's/^/s15_dns_mail_plan_line=/'
   ```

   Expected: `s15_dns_mail_plan_exit=0`. This plan is never applied.

3. The resources tagged `Root=aws`, counted in both regions and by type, for comparison with Step 16:

   ```bash
   tagged() {
     n=$1_tagged_$(printf %s "$2" | tr - _)
     aws resourcegroupstaggingapi get-resources --region "$2" \
       --tag-filters Key=Root,Values=aws \
       > "$L/$n.json" 2> "$L/$n.err"
     echo "${n}_read_exit=$?"
     jq -r --arg n "$n" '.ResourceTagMappingList
       | "\($n)=\(length)", (map(.ResourceARN | split(":")
         | "\(.[2]):\(.[5] | split("/")[0])") | group_by(.)[]
         | "\($n)_type=\(.[0]) \(length)")' "$L/$n.json"
   }
   tagged s15 eu-north-1
   tagged s15 us-east-1
   ```

   Expected: both counts above 0, and `us-east-1` holding at least the viewer certificate.

4. **The operator's:** the cleanup of the persistent project, as `postgres`. In a terminal of your own,
   run "The lines that begin each sitting of this part" of
   [`../supabase/README.md`](../supabase/README.md) with `R=staging`, giving `SUPABASE_ACCESS_TOKEN`,
   `SUPABASE_DB_PASSWORD`, `TF_VAR_database_password` and the SMTP pair as that section shows, and
   then items 1 to 3 of its Step 15, the connection `psql` uses. Those lines make their own `$L`. The
   user is deleted by its address, and only when it holds no grant beyond an entity's; its grant goes
   with it:

   ```bash
   printf 'invitation id: '; read -r INVITATION_ID
   printf 'second mailbox: '; read -r INVITEE_EMAIL
   export INVITATION_ID INVITEE_EMAIL
   psql -X -q -At -v ON_ERROR_STOP=1 \
     > "$L/s15-cleanup.out" 2> "$L/s15-cleanup.err" <<'SQL'
   \getenv invitee INVITEE_EMAIL
   \getenv inv INVITATION_ID
   begin;
   with d as (
     delete from auth.users u
     where lower(u.email) = lower(:'invitee')
       and not exists (
         select 1 from public.grants g
         where g.user_id = u.id and g.scope <> 'entity')
     returning 1)
   select 's15_invitee_users_deleted=' || count(*) from d;
   with d as (
     delete from public.invitations where id = :'inv' returning 1)
   select 's15_invitation_rows_deleted=' || count(*) from d;
   with d as (
     delete from public.feedback
     where project_id = '00000000-0000-0000-0000-000000000001'
       and description like 'limit-check %'
     returning 1)
   select 's15_limit_check_rows_deleted=' || count(*) from d;
   commit;
   select 's15_invitee_users_after=' || count(*) from auth.users
     where lower(email) = lower(:'invitee');
   select 's15_invitation_rows_after=' || count(*)
     from public.invitations where id = :'inv';
   select 's15_limit_check_rows_after=' || count(*)
     from public.feedback where description like 'limit-check %';
   SQL
   echo "s15_cleanup_exit=$?"
   cat "$L/s15-cleanup.out"
   unset INVITEE_EMAIL
   ```

   Expected: `s15_cleanup_exit=0`, `s15_invitee_users_deleted=1`, `s15_invitation_rows_deleted=1`,
   `s15_limit_check_rows_deleted=` the inserts Step 13 admitted, and the three `_after=` counts 0. A
   `s15_invitee_users_deleted=0` with `s15_invitee_users_after=1` means the address holds a grant
   beyond an entity's, so it is not the invitee's: stop and check the address.

5. **The operator's:** the plan of the `supabase` root, in the same terminal:

   ```bash
   S=infra/envs/staging/supabase
   terraform -chdir="$S" init -input=false -no-color \
     -lockfile=readonly > "$L/s15-supabase-init.log" 2>&1
   echo "s15_supabase_init_exit=$?"
   terraform -chdir="$S" plan -input=false -no-color \
     -detailed-exitcode > "$L/s15-supabase.log" 2>&1
   echo "s15_supabase_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s15-supabase.log" \
     | sed 's/^/s15_supabase_plan_line=/'
   test -n "$L" && rm -rf "$L" && echo "s15_operator_logs_removed=yes"
   ```

   Expected: `s15_supabase_plan_exit=0`. This plan is never applied. With any other status, the
   destroy does not run.

6. Last item on the workstation, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s15_logs_removed=yes"
   ```

Return: every `s15_` line. The destroy runs only when the three `_after=` counts are 0 and both
`_plan_exit=` lines are 0.

### Step 16: The destroy

The root is destroyed once, by applying a saved destroy plan whose count equals the managed resources
the state holds, which is what `terraform destroy` does after its prompt. Then the Resource Groups
Tagging API is asked, in both regions, for anything tagged `Root=aws`. It is regional, and the viewer
certificate is in `us-east-1`, so one region alone would miss it. A task definition revision that
Terraform replaced or destroyed is deregistered, not deleted: it stays in the account as `INACTIVE`
with its tags. So the family's `INACTIVE` revisions are listed and deleted first. A stopped task keeps
its tags for about an hour after it stops, so the search is read again until both regions list
nothing. Last, what lives outside this root is read, and must all still be there.

Run the step only after Step 15's lines read as expected, and in one sitting: it takes up to two
hours, most of it waiting for stopped tasks to age out.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s16_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s16_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. What the destroy plan needs, and the image's digest before it:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s16-init.log" 2>&1
   echo "s16_init_exit=$?"
   test -n "${TF_VAR_alert_email:-}"; echo "s16_alert_email_set_exit=$?"
   TAG=$(sed -n 's/^image_tag *= *"\([0-9a-f]*\)".*/\1/p' \
     "$T/terraform.tfvars")
   RU=$(sed -n 's/^registry_url *= *"\(.*\)"/\1/p' "$T/terraform.tfvars")
   aws ecr describe-images --repository-name "${RU#*/}" \
     --image-ids imageTag="$TAG" \
     > "$L/s16-image-before.json" 2> "$L/s16-image-before.err"
   echo "s16_image_before_exit=$?"
   ```

2. The managed resources in the state, counted without the data sources, and the destroy plan,
   saved. Its summary line must name exactly that count:

   ```bash
   terraform -chdir="$T" state list \
     > "$L/s16-state.txt" 2> "$L/s16-state.err"
   echo "s16_state_list_exit=$?"
   M=$(awk '!/^data\./ && !/\.data\./' "$L/s16-state.txt" \
     | wc -l | tr -d ' ')
   echo "s16_state_managed_count=$M"
   terraform -chdir="$T" plan -destroy -input=false -no-color \
     -out="$L/tfdestroy" > "$L/s16-plan.log" 2>&1
   echo "s16_destroy_plan_exit=$?"
   LINE=$(grep -m1 -E '^(Plan:|No changes)' "$L/s16-plan.log")
   echo "s16_destroy_plan_line=$LINE"
   N=$(printf '%s\n' "$LINE" | sed -n \
     's/^Plan: 0 to add, 0 to change, \([0-9]*\) to destroy\.$/\1/p')
   echo "s16_destroy_plan_count=${N:-none}"
   test "$N" = "$M"; echo "s16_destroy_plan_matches_state_exit=$?"
   ```

   > **Apply only when `s16_destroy_plan_exit=0`, `s16_destroy_plan_line` reads
   > `Plan: 0 to add, 0 to change, N to destroy.`, and `s16_destroy_plan_matches_state_exit=0`.** A
   > count other than the state's means the plan would leave something behind or reach beyond this
   > root. Then do not apply: run item 8, paste the lines and stop.

3. Apply the saved destroy plan in the background, and read its status:

   ```bash
   ( terraform -chdir="$T" apply -input=false -no-color \
       "$L/tfdestroy" > "$L/s16-destroy.log" 2>&1
     echo "s16_destroy_exit=$?" > "$L/s16-destroy.status" ) &
   until test -s "$L/s16-destroy.status"; do sleep 30; done
   cat "$L/s16-destroy.status"
   grep -m1 -E 'complete! Resources:' "$L/s16-destroy.log" \
     | sed 's/^/s16_destroy_line=/'
   grep -E '^Error: ' "$L/s16-destroy.log" | sed 's/^/s16_error=/'
   rm -f "$L/tfdestroy"; echo "s16_plan_file_removed=yes"
   ```

   Expected: `s16_destroy_exit=0`. If the destroy failed, run item 8 and stop: do not destroy again in
   this step.

4. The first search in both regions, which classifies what is left, then the family's task
   definitions, listed by state and the `INACTIVE` ones deleted:

   ```bash
   tagged() {
     n=$1_tagged_$(printf %s "$2" | tr - _)
     aws resourcegroupstaggingapi get-resources --region "$2" \
       --tag-filters Key=Root,Values=aws \
       > "$L/$n.json" 2> "$L/$n.err"
     echo "${n}_read_exit=$?"
     jq -r --arg n "$n" '.ResourceTagMappingList
       | "\($n)=\(length)", (map(.ResourceARN | split(":")
         | "\(.[2]):\(.[5] | split("/")[0])") | group_by(.)[]
         | "\($n)_type=\(.[0]) \(length)")' "$L/$n.json"
   }
   tagged s16_first eu-north-1
   tagged s16_first us-east-1
   F=openvaa-staging-frontend
   for st in ACTIVE INACTIVE; do
     aws ecs list-task-definitions --family-prefix "$F" \
       --status "$st" --query 'taskDefinitionArns[]' --output text \
       2> "$L/s16-list-$st.err" | tr '\t' '\n' | sed '/^$/d' \
       > "$L/s16-$st.txt"
     echo "s16_task_definitions_$st=$(grep -c . "$L/s16-$st.txt")"
   done
   if test -s "$L/s16-INACTIVE.txt"; then
     xargs -n 10 aws ecs delete-task-definitions \
       --task-definitions < "$L/s16-INACTIVE.txt" \
       > "$L/s16-delete.json" 2> "$L/s16-delete.err"
     echo "s16_delete_task_definitions_exit=$?"
     jq -rs '"s16_deleted_task_definitions=\(map(.taskDefinitions
       | length) | add)", "s16_delete_failures=\(map(.failures
       | length) | add)"' "$L/s16-delete.json"
   fi
   ```

   Expected: `s16_task_definitions_ACTIVE=0`, `s16_delete_task_definitions_exit=0`,
   `s16_deleted_task_definitions=` equal to `s16_task_definitions_INACTIVE`, and
   `s16_delete_failures=0`. The `s16_first_tagged_..._type=` lines say what the first search found,
   by service and resource type.

5. The search again, every 10 minutes for up to 100 minutes, until both regions list nothing:

   ```bash
   for i in $(seq 1 11); do
     tagged s16_sweep eu-north-1 > "$L/s16-sweep-eu.txt"
     tagged s16_sweep us-east-1 > "$L/s16-sweep-us.txt"
     grep -qx 's16_sweep_tagged_eu_north_1=0' "$L/s16-sweep-eu.txt" \
       && grep -qx 's16_sweep_tagged_us_east_1=0' \
         "$L/s16-sweep-us.txt" && break
     sleep 600
   done
   echo "s16_sweep_reads=$i"
   cat "$L/s16-sweep-eu.txt" "$L/s16-sweep-us.txt"
   ```

   Expected: `s16_sweep_tagged_eu_north_1=0` and `s16_sweep_tagged_us_east_1=0`, both read, with no
   `_type=` line. Anything still listed after the last read is named by its type line: paste it and
   stop.

6. What survives, each read: the image under its tag with an unchanged digest, the two parameters by
   name, the delegated zone, the execution role, and the plan of `dns-mail`, which must still show no
   change:

   ```bash
   aws ecr describe-images --repository-name "${RU#*/}" \
     --image-ids imageTag="$TAG" \
     > "$L/s16-image-after.json" 2> "$L/s16-image-after.err"
   echo "s16_image_after_exit=$?"
   test "$(jq -r '.imageDetails[0].imageDigest' \
     "$L/s16-image-after.json")" = "$(jq -r \
     '.imageDetails[0].imageDigest' "$L/s16-image-before.json")"
   echo "s16_image_digest_unchanged_exit=$?"
   aws ssm describe-parameters --parameter-filters \
     "Key=Path,Option=OneLevel,Values=/openvaa/staging/frontend" \
     > "$L/s16-parameters.json" 2> "$L/s16-parameters.err"
   echo "s16_parameters_read_exit=$?"
   jq -r '"s16_parameters=\(.Parameters | length)"' \
     "$L/s16-parameters.json"
   aws route53 list-hosted-zones-by-name \
     --dns-name staging.openvaa.org --max-items 1 \
     > "$L/s16-zone.json" 2> "$L/s16-zone.err"
   echo "s16_zone_read_exit=$?"
   jq -r '"s16_zone=" + (if .HostedZones[0].Name
     == "staging.openvaa.org." then "present" else "absent" end)' \
     "$L/s16-zone.json"
   aws iam get-role --role-name openvaa-staging-frontend-execution \
     > "$L/s16-role.json" 2> "$L/s16-role.err"
   echo "s16_execution_role_exit=$?"
   D=infra/envs/staging/dns-mail
   terraform -chdir="$D" init -input=false -no-color \
     -lockfile=readonly > "$L/s16-dns-mail-init.log" 2>&1
   echo "s16_dns_mail_init_exit=$?"
   terraform -chdir="$D" plan -input=false -no-color \
     -detailed-exitcode > "$L/s16-dns-mail.log" 2>&1
   echo "s16_dns_mail_plan_after_exit=$?"
   ```

   Expected: `s16_image_digest_unchanged_exit=0`, `s16_parameters=2`, `s16_zone=present`,
   `s16_execution_role_exit=0` and `s16_dns_mail_plan_after_exit=0`.

7. **The operator's:** the `supabase` root's plan and the conformance probe, which show that the
   destroy left the hosted project, its data and its settings alone. In a terminal of your own, run
   "The lines that begin each sitting of this part" of [`../supabase/README.md`](../supabase/README.md)
   with `R=staging`, giving `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ANON_KEY`,
   `TF_VAR_database_password` and the SMTP pair, and items 1 to 3 of its Step 15. Then:

   ```bash
   S=infra/envs/staging/supabase
   terraform -chdir="$S" init -input=false -no-color \
     -lockfile=readonly > "$L/s16-supabase-init.log" 2>&1
   echo "s16_supabase_init_exit=$?"
   terraform -chdir="$S" plan -input=false -no-color \
     -detailed-exitcode > "$L/s16-supabase.log" 2>&1
   echo "s16_supabase_plan_after_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s16-supabase.log" \
     | sed 's/^/s16_supabase_plan_after_line=/'
   ```

   Then run item 1 of that runbook's Step 23, the conformance probe, as written, and its last item.
   Expected: `s16_supabase_plan_after_exit=0`, and `s23_probe_exit=0` with no `FAIL` and no
   `COULD NOT RUN` among the `s23_probe=` lines. The plan is never applied.

8. Last item on the workstation, also when you stop early or a command failed:

   ```bash
   rm -f "$L/tfdestroy"
   test -n "$L" && rm -rf "$L" && echo "s16_logs_removed=yes"
   ```

Return: every `s16_` line and the operator's `s16_` and `s23_` lines.

### Step 17: The re-apply

The root is applied again from the same image and the same tag, with one plan and one apply, as Step
5 did: the image is still in the registry under its tag, `image_tag` in this root's variable file is
unchanged, and the files of the root are as committed. The stack must come back serving the same
build. The re-created topic gets a new subscription, which stays pending until the operator confirms
it again.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s17_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s17_account_match_exit=$?"
T=infra/envs/staging/aws
U=https://staging.openvaa.org
TAG=$(sed -n 's/^image_tag *= *"\([0-9a-f]*\)".*/\1/p' \
  "$T/terraform.tfvars")
```

1. The same tag, the image under it, a clean tree for the root and its module, and the alert address:

   ```bash
   echo "s17_image_tag_length=${#TAG}"
   echo "s17_head=$(git rev-parse HEAD)"
   git status --porcelain -- infra/envs/staging/aws \
     infra/modules/frontend-service > "$L/s17-status.txt"
   echo "s17_dirty_lines=$(wc -l < "$L/s17-status.txt" | tr -d ' ')"
   RU=$(sed -n 's/^registry_url *= *"\(.*\)"/\1/p' "$T/terraform.tfvars")
   aws ecr describe-images --repository-name "${RU#*/}" \
     --image-ids imageTag="$TAG" \
     > "$L/s17-image.json" 2> "$L/s17-image.err"
   echo "s17_image_exit=$?"
   test -n "${TF_VAR_alert_email:-}"; echo "s17_alert_email_set_exit=$?"
   ```

   Expected: `s17_image_tag_length=40`, `s17_dirty_lines=0`, `s17_image_exit=0` and
   `s17_alert_email_set_exit=0`.

2. Initialise, plan, and print the plan's summary line, the count of planned actions by kind and the
   count of planned addresses outside the module, as Step 5 does:

   ```bash
   terraform -chdir="$T" init -input=false -no-color \
     -lockfile=readonly > "$L/s17-init.log" 2>&1
   echo "s17_init_exit=$?"
   terraform -chdir="$T" plan -input=false -no-color \
     -out="$L/tfplan" > "$L/s17-plan.log" 2>&1
   echo "s17_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s17-plan.log" \
     | sed 's/^/s17_plan_line=/'
   terraform -chdir="$T" show -json "$L/tfplan" \
     > "$L/s17-plan.json" 2> "$L/s17-show.err"
   echo "s17_show_exit=$?"
   jq -r '[.resource_changes[] | .change.actions | join("-")]
     | group_by(.) | .[] | "s17_planned_\(.[0])=\(length)"' \
     "$L/s17-plan.json"
   jq -r '[.resource_changes[]
     | select(.address | startswith("module.frontend.") | not)]
     | "s17_outside_module=\(length)"' "$L/s17-plan.json"
   ```

   > **Apply only when `s17_plan_exit=0`, `s17_plan_line` reads
   > `Plan: <n> to add, 0 to change, 0 to destroy.`, every `s17_planned_` line is
   > `s17_planned_create=` or `s17_planned_read=`, and `s17_outside_module=0`.** Otherwise do not
   > apply: run item 7, paste the lines and stop.

3. Apply the saved plan in the background, and note when it completed. That time is where the cost
   window of Step 18 begins:

   ```bash
   ( terraform -chdir="$T" apply -input=false -no-color \
       "$L/tfplan" > "$L/s17-apply.log" 2>&1
     echo "s17_apply_exit=$?" > "$L/s17-apply.status" ) &
   until test -s "$L/s17-apply.status"; do sleep 30; done
   cat "$L/s17-apply.status"
   echo "s17_apply_completed_utc=$(date -u +%Y-%m-%dT%H:%MZ)"
   grep -m1 -E '^Apply complete!' "$L/s17-apply.log" \
     | sed 's/^/s17_apply_line=/'
   grep -E '^Error: ' "$L/s17-apply.log" | sed 's/^/s17_error=/'
   rm -f "$L/tfplan"; echo "s17_plan_file_removed=yes"
   ```

4. Plan again. It must exit 0, which means no change:

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -detailed-exitcode > "$L/s17-second.log" 2>&1
   echo "s17_second_plan_exit=$?"
   grep -E '^  # ' "$L/s17-second.log" | sed 's/^/s17_second_change=/'
   ```

5. The site through the CDN: the health answer from the same build, and the questions page with the
   project id and a statement of the smoke dataset, as Step 7 item 4 reads them. A `curl` status of 6
   means the name did not resolve yet, as in Step 5: wait a few minutes and run this item again:

   ```bash
   curl -sS --max-time 20 -o "$L/s17-health.json" \
     -w 's17_health_http=%{http_code}\n' "$U/api/health" \
     2> "$L/s17-health.err"
   echo "s17_health_curl_exit=$?"
   test "$(jq -r .build "$L/s17-health.json")" = "$TAG"
   echo "s17_health_build_matches_exit=$?"
   curl -sS --max-time 30 -L -o "$L/s17-questions.html" \
     -w 's17_questions_http=%{http_code}\n' "$U/questions" \
     2> "$L/s17-questions.err"
   echo "s17_questions_curl_exit=$?"
   echo "s17_questions_project_id=$(grep -o -m1 \
     'data-project-id="[^"]*"' "$L/s17-questions.html" \
     | cut -d'"' -f2)"
   echo "s17_defence_statement_seen=$(grep -c -F \
     'Defence spending should be increased.' "$L/s17-questions.html")"
   ```

   Expected: `s17_health_http=200`, `s17_health_build_matches_exit=0`, `s17_questions_http=200`,
   `s17_questions_project_id=00000000-0000-0000-0000-000000000001` and
   `s17_defence_statement_seen=` above 0.

6. The re-created log group's retention, and the new subscription's state. **The operator's:** AWS
   mails a new confirmation to the alert address; follow its link, answer
   `answer_subscription_confirmed=yes` with `answer_subscription_confirmed_utc=<time>`, and then run
   the reads below again:

   ```bash
   G=$(terraform -chdir="$T" output -raw log_group_name)
   aws logs describe-log-groups --log-group-name-prefix "$G" \
     > "$L/s17-log-group.json" 2> "$L/s17-log-group.err"
   echo "s17_log_group_read_exit=$?"
   jq -r --arg g "$G" '.logGroups[] | select(.logGroupName == $g)
     | "s17_log_retention_days=\(.retentionInDays)"' \
     "$L/s17-log-group.json"
   TOPIC=$(terraform -chdir="$T" output -raw \
     deployment_alert_topic_arn 2> "$L/s17-output.err")
   aws sns list-subscriptions-by-topic --topic-arn "$TOPIC" \
     > "$L/s17-subscriptions.json" 2> "$L/s17-subscriptions.err"
   echo "s17_subscriptions_exit=$?"
   jq -r '.Subscriptions[] | "s17_subscription=\(.Protocol) " + (
     if .SubscriptionArn == "PendingConfirmation"
     then "pending" else "confirmed" end)' \
     "$L/s17-subscriptions.json"
   ```

   Expected: `s17_log_retention_days=90`; `s17_subscription=email pending` before the confirmation and
   `s17_subscription=email confirmed` after it.

7. Last item, also when you stop early or a command failed:

   ```bash
   rm -f "$L/tfplan"
   test -n "$L" && rm -rf "$L" && echo "s17_logs_removed=yes"
   ```

Return: every `s17_` line, in order, and the two `answer_subscription_confirmed` lines.
`s17_apply_completed_utc=` is the start of the stack whose cost Step 18 measures.

### Step 18: The cost

The stack's cost is measured from Cost Explorer, filtered by the cost-allocation tag `Root` = `aws`,
which the three roots' tags tell apart: they share `Project` and `Environment`. It is read over a
window of full UTC days that begins on the day after Step 17's apply, so that no day of it holds the
destroyed interval of Step 16 or a day the stack ran only part of. The days before the window are
listed apart and never counted. Cost Explorer's data lags about a day, so the window ends two days
before the read: a window of seven days can be read on the re-apply's date plus nine days, and not
before. A shorter window is not a measurement, and its figure is not written as one.

Beside the measurement, the step prices the stack's inventory from the AWS price list: what the
stack's resources cost at list price for a month, with the usage it assumes stated. Both figures are
recorded with their dates.

Cost Explorer's API and the price list's are both served from `us-east-1`.

```bash
cd "$(git rev-parse --show-toplevel)"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
  AWS_REGION=eu-north-1 \
  TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-aws.XXXXXX")
ACCOUNT=$(aws sts get-caller-identity --query Account \
  --output text 2> "$L/account.err")
echo "s18_account_read_exit=$?"
test "$ACCOUNT" = 471112560111; echo "s18_account_match_exit=$?"
T=infra/envs/staging/aws
```

1. The cost-allocation tags, which must be active:

   ```bash
   aws ce list-cost-allocation-tags --region us-east-1 \
     --tag-keys Project Environment Root \
     > "$L/s18-tags.json" 2> "$L/s18-tags.err"
   echo "s18_cost_tags_exit=$?"
   jq -r '.CostAllocationTags[]
     | "s18_cost_tag=\(.TagKey) \(.Status)"' "$L/s18-tags.json"
   ```

   Expected: three `s18_cost_tag=` lines, each `Active`.

2. The window. Type the date of `s17_apply_completed_utc` and the date of Step 5's apply, both as
   `YYYY-MM-DD`:

   ```bash
   printf 're-apply date (UTC, YYYY-MM-DD): '; read -r RD
   printf 'first apply date (UTC, YYYY-MM-DD): '; read -r FD
   day() { jq -nr --arg d "$1" --argjson n "$2" \
     '($d + "T00:00:00Z" | fromdate) + $n * 86400
       | strftime("%Y-%m-%d")'; }
   W=$(day "$RD" 1)
   X=$(jq -nr '(now | floor) - 86400 | strftime("%Y-%m-%d")')
   DAYS=$(jq -nr --arg a "$W" --arg b "$X" \
     '(($b + "T00:00:00Z" | fromdate)
       - ($a + "T00:00:00Z" | fromdate)) / 86400 | floor')
   echo "s18_read_utc=$(date -u +%Y-%m-%dT%H:%MZ)"
   echo "s18_window_start=$W"
   echo "s18_window_end_exclusive=$X"
   echo "s18_window_days=$DAYS"
   echo "s18_seven_days_readable_from=$(day "$RD" 9)"
   ```

   **Go on only when `s18_window_days` is at least 7.** Otherwise run item 7 and run the step again on
   or after `s18_seven_days_readable_from`.

3. The daily cost by the tag over the window, its sum, its daily mean, and the mean times 30.4 as the
   month:

   ```bash
   TF='{"Tags":{"Key":"Root","Values":["aws"],"MatchOptions":["EQUALS"]}}'
   aws ce get-cost-and-usage --region us-east-1 \
     --time-period "Start=$W,End=$X" --granularity DAILY \
     --metrics UnblendedCost --filter "$TF" \
     > "$L/s18-daily.json" 2> "$L/s18-daily.err"
   echo "s18_daily_exit=$?"
   jq -r 'def r: . * 100 | round / 100;
     [.ResultsByTime[] | {d: .TimePeriod.Start,
       a: (.Total.UnblendedCost.Amount | tonumber)}] as $c
     | ($c[] | "s18_day=\(.d) \(.a | r)"),
       "s18_window_sum_usd=\($c | map(.a) | add | r)",
       "s18_daily_mean_usd=\($c | map(.a) | add / length | r)",
       "s18_month_usd=\($c | map(.a) | add / length * 30.4 | r)"' \
     "$L/s18-daily.json"
   ```

   Expected: one `s18_day=` line per day of the window, and `s18_month_usd=`, the measured monthly
   cost.

4. The days before the window, from the first apply up to the window's first day, listed and never
   summed: they hold the first stack, the destroyed interval and the re-apply's own day:

   ```bash
   aws ce get-cost-and-usage --region us-east-1 \
     --time-period "Start=$FD,End=$W" --granularity DAILY \
     --metrics UnblendedCost --filter "$TF" \
     > "$L/s18-before.json" 2> "$L/s18-before.err"
   echo "s18_before_exit=$?"
   jq -r '.ResultsByTime[] | "s18_before_day=\(.TimePeriod.Start) "
     + (.Total.UnblendedCost.Amount | tonumber * 100 | round / 100
       | tostring)' "$L/s18-before.json"
   ```

5. The same window by service and usage type: once filtered by the tag, and once for the whole account
   with only the public IPv4 lines printed, because an address's charge may carry no tag:

   ```bash
   aws ce get-cost-and-usage --region us-east-1 \
     --time-period "Start=$W,End=$X" --granularity DAILY \
     --metrics UnblendedCost --filter "$TF" \
     --group-by Type=DIMENSION,Key=SERVICE \
       Type=DIMENSION,Key=USAGE_TYPE \
     > "$L/s18-tagged-usage.json" 2> "$L/s18-tagged-usage.err"
   echo "s18_tagged_usage_exit=$?"
   aws ce get-cost-and-usage --region us-east-1 \
     --time-period "Start=$W,End=$X" --granularity DAILY \
     --metrics UnblendedCost \
     --group-by Type=DIMENSION,Key=USAGE_TYPE \
     > "$L/s18-all-usage.json" 2> "$L/s18-all-usage.err"
   echo "s18_all_usage_exit=$?"
   jq -r '[.ResultsByTime[].Groups[]
     | {k: (.Keys | join(" / ")),
       a: (.Metrics.UnblendedCost.Amount | tonumber)}]
     | group_by(.k)[] | "s18_tagged_usage=\(.[0].k) "
       + (map(.a) | add * 10000 | round / 10000 | tostring)' \
     "$L/s18-tagged-usage.json"
   jq -r '[.ResultsByTime[].Groups[]
     | select(.Keys[0] | test("PublicIPv4"))
     | {k: .Keys[0], a: (.Metrics.UnblendedCost.Amount | tonumber)}]
     | group_by(.k)[] | "s18_account_ipv4_usage=\(.[0].k) "
       + (map(.a) | add * 10000 | round / 10000 | tostring)' \
     "$L/s18-all-usage.json"
   ```

   A `s18_account_ipv4_usage=` line with no `s18_tagged_usage=` line of the same usage type is a
   charge of this stack's addresses that the tag does not carry; the figure of item 3 leaves it out,
   and the record names it beside that figure.

6. The priced inventory. Each usage type's on-demand price, its first tier where it is tiered, is
   read from the price list with the list's publication date. The month assumes one task of 0.5 vCPU
   and 1 GB, one load balancer at one capacity unit, three public IPv4 addresses (the task's and the
   load balancer's two), all for 729.6 hours (30.4 days), and the log and CDN volumes set in the first
   lines below. CloudFront's free tier is not subtracted, so the CDN's lines are an upper bound:

   ```bash
   LOG_GB=1 CDN_GB=1 CDN_REQUESTS=100000
   : > "$L/s18-prices.txt"
   price() {
     U1="Type=TERM_MATCH,Field=usagetype,Value=$2"
     if test -n "${3:-}"; then
       F1="Type=TERM_MATCH,Field=productFamily,Value=$3"
       aws pricing get-products --region us-east-1 \
         --service-code "$1" --filters "$U1" "$F1" \
         > "$L/s18-price.json" 2>> "$L/s18-price.err"
     else
       aws pricing get-products --region us-east-1 \
         --service-code "$1" --filters "$U1" \
         > "$L/s18-price.json" 2>> "$L/s18-price.err"
     fi
     echo "s18_price_read=$2 exit=$?"
     jq -r --arg u "$2" '[.PriceList[] | fromjson
       | .publicationDate as $d | .terms.OnDemand[]
       | .priceDimensions[] | select((.beginRange // "0") == "0")
       | "s18_price=\($u) \(.pricePerUnit.USD) per \(.unit)"
         + " published \($d)"] | .[0] // "s18_price=\($u) none"' \
       "$L/s18-price.json" | tee -a "$L/s18-prices.txt"
   }
   price AmazonECS EUN1-Fargate-ARM-vCPU-Hours:perCPU
   price AmazonECS EUN1-Fargate-ARM-GB-Hours
   price AWSELB EUN1-LoadBalancerUsage 'Load Balancer-Application'
   price AWSELB EUN1-LCUUsage 'Load Balancer-Application'
   price AmazonVPC EUN1-PublicIPv4:InUseAddress
   price AmazonCloudWatch EUN1-DataProcessing-Bytes
   price AmazonCloudFront EU-DataTransfer-Out-Bytes
   price AmazonCloudFront EU-Requests-Tier2-HTTPS
   awk -v h=729.6 -v lg="$LOG_GB" -v cg="$CDN_GB" \
     -v cr="$CDN_REQUESTS" '{ sub(/^s18_price=/, ""); p[$1] = $2 }
     END {
       m = 0.5 * h * p["EUN1-Fargate-ARM-vCPU-Hours:perCPU"]
       m += 1 * h * p["EUN1-Fargate-ARM-GB-Hours"]
       m += h * p["EUN1-LoadBalancerUsage"]
       m += 1 * h * p["EUN1-LCUUsage"]
       m += 3 * h * p["EUN1-PublicIPv4:InUseAddress"]
       m += lg * p["EUN1-DataProcessing-Bytes"]
       m += cg * p["EU-DataTransfer-Out-Bytes"]
       m += cr * p["EU-Requests-Tier2-HTTPS"]
       printf "s18_inventory_usd_month=%.2f\n", m
     }' "$L/s18-prices.txt"
   echo "s18_inventory_assumptions=task 0.5vCPU/1GB, 1 LCU," \
     "3 IPv4, logs ${LOG_GB}GB, CDN ${CDN_GB}GB ${CDN_REQUESTS}req"
   ```

   Expected: one `s18_price=` line per usage type, none of them `none`, and
   `s18_inventory_usd_month=`, the priced figure. A `none` line means the usage type has another name
   in the price list: the figure leaves that line out, which the record says.

7. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s18_logs_removed=yes"
   ```

Return: every `s18_` line, in order. The record gives the measured month (`s18_month_usd=`, over
`s18_window_start` and `s18_window_days`, read on `s18_read_utc`) and the priced month
(`s18_inventory_usd_month=`, with the prices' publication dates and the assumptions) side by side,
each with its date, and never one in place of the other.

## Election day

On a day whose peak is known in advance, such as an election day, the floor is raised before the
peak by a scheduled action, so that the tasks are running when the voters arrive rather than when the
target tracking notices them. Step 12 is the rehearsal of this section.

Unlike the observations, the two entries are written in `terraform.tfvars`, because that file is the
record of how the stack runs, and on that day it runs with a raised floor. The root gives the actions
no time zone, so the module reads every schedule in UTC: convert the peak's local times, in the
election's time zone, to UTC before writing them.

1. Write the two entries in `terraform.tfvars`, with the times of the peak. The raising entry sets the
   floor for the peak and a ceiling no lower than it; the lowering entry returns to `task_floor` and
   `task_ceiling`. The numbers below are an example:

   ```hcl
   scheduled_floor_changes = [
     {
       name         = "election-day-raise"
       schedule     = "at(2027-04-11T05:00:00)"
       min_capacity = 4
       max_capacity = 6
     },
     {
       name         = "election-day-lower"
       schedule     = "at(2027-04-11T20:00:00)"
       min_capacity = 1
       max_capacity = 2
     },
   ]
   ```

2. Plan and apply once, well before the raise, with the protocol of Step 12, items 2 and 3: the plan
   must read `Plan: 2 to add, 0 to change, 0 to destroy.` and create the two scheduled actions alone.
   Commit the change of `terraform.tfvars`.
3. **No apply is made between the two actions.** Inside that window the scalable target's bounds are
   the raising entry's, a plan shows them as a change, and an apply would put back `task_floor` and
   `task_ceiling` in the middle of the peak.
4. After the lowering has run and the count is back at the floor, remove both entries from
   `terraform.tfvars`, plan, which must read `Plan: 0 to add, 0 to change, 2 to destroy.` and delete
   the two scheduled actions alone, apply once, and commit the change.

## Not yet observed

This root was first applied on 2026-11-13, in two applies (see "Observations"). Each statement below
is something this runbook relies on and that has not been seen. It moves to "Observations", with its
date, once the step named beside it has shown it.

| Statement                                                                                                                                              | Checked by                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| The destroy check does not list the two parameters, which carry no `Root` tag                                                                          | Step 16                     |
| One apply brings up the whole stack, the certificates' validation waiting inside it                                                                    | Step 5, item 5, and Step 17 |
| `postgres`, over the connection `psql` uses, can delete a user of `auth.users`, its grant going with it, and a claimed invitation by id                | Step 15, item 4             |
| With the stack running, the plans of `dns-mail` and `supabase` show no change                                                                          | Step 15, items 2 and 5      |
| The destroy plan's count equals the managed resources of the state, and its apply exits 0                                                              | Step 16, items 2 and 3      |
| The Tagging API lists the `INACTIVE` task definitions after the destroy, `delete-task-definitions` removes them, and stopped tasks age out of the list | Step 16, items 4 and 5      |
| After the destroy, the Tagging API lists nothing tagged `Root=aws` in `eu-north-1` or in `us-east-1`                                                   | Step 16, item 5             |
| The image keeps its digest, the two parameters, the zone and the execution role survive the destroy, and the `dns-mail` plan still shows no change     | Step 16, item 6             |
| After the destroy, the `supabase` plan shows no change and the conformance probe passes                                                                | Step 16, item 7             |
| A re-apply from the same tag plans only creates, applies, shows no change in a second plan, and serves the same build and the voter page               | Step 17, items 2 to 5       |
| The re-created log group keeps 90 days, and the new subscription is pending until the operator confirms it                                             | Step 17, item 6             |
| Cost Explorer filtered by `Root=aws` gives the stack's daily cost, Fargate included through the tasks' propagated tags                                 | Step 18, item 3             |
| The public IPv4 charges either carry the tag or show in the account's usage types alone                                                                | Step 18, item 5             |
| The price list holds one on-demand price, first tier, for each usage type Step 18 names                                                                | Step 18, item 6             |

## Observations

| Date (UTC) | Observation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-12 | AWS CLI 2.34.7 refuses a whole request read as `--cli-input-json file:///dev/stdin` from a pipe, with `Error parsing parameter 'cli-input-json': Invalid JSON received` and exit 252, before any call is made; seen in Step 2 and reproduced offline. With `--value file:///dev/stdin` the same CLI sends the exact value, with no trailing newline, and both tags (seen offline with a stand-in value and an unreachable endpoint).                                                                                                                                                                                                                                                                |
| 2026-11-12 | Step 2 ran with `--value file:///dev/stdin`: both `put-parameter` calls exited 0 and each parameter is at version 1. Both read back as `SecureString` under `alias/aws/ssm`, and `kms describe-key` reads that key as AWS-managed and enabled, created 16 ms after the first parameter, so AWS created it with the first SecureString that used it.                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-12 | Step 2, item 3: the two parameters carry the tag keys `Environment` and `Project` and no `Root` tag, in the operator's read and the agent's own (`list-tags-for-resource`, keys only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-12 | Step 3, item 4: the policy simulator allows the execution role `ssm:GetParameters` on `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` and gives `implicitDeny` on `/openvaa/staging/other/X`. The role lies under `/openvaa/`, trusts `ecs-tasks.amazonaws.com` alone, carries `AmazonECSTaskExecutionRolePolicy` and `openvaa-staging-frontend-parameters` and no inline policy, and its ARN equals `execution_role_arn`; both inventory asserts exit 0.                                                                                                                                                                                                                                         |
| 2026-11-12 | Step 4, items 2 to 4: a commit built through a temporary index from the tree of `HEAD` without `.planning`, with `origin/main` as its parent, `712947a1bd44a735f66ee8f51610f4748d76cd30`, holds 3291 paths and none under `.planning/`. It was pushed to the new branch `deploy-evidence/185-image` (exit 0), and `git ls-remote origin` lists it. The first push, written `"$SHA:refs/heads/$B"`, was refused in zsh as matching no ref, because zsh reads `:r` as a modifier; with `${SHA}` it went through.                                                                                                                                                                                      |
| 2026-11-12 | Step 4, items 5 and 6: `build-push-image.sh`, run from a detached worktree of that commit on an arm64 workstation, exited 0 after about six minutes and printed the commit id as `image_tag`. The registry holds it as one image manifest, `application/vnd.docker.distribution.manifest.v2+json`, not an index, with the digest the script printed; the local image is `arm64` and carries the commit id as `BUILD_SHA`.                                                                                                                                                                                                                                                                           |
| 2026-11-12 | Step 4, item 7: started with only the four required variables, stand-ins all and the Supabase URL on a closed port, the image answered `/api/health` with 200, `status` `ok` and the commit id as `build`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-12 | Step 4, items 8 and 9: a different image pushed under the existing tag was refused, push exit 1, with `tag invalid: The image tag '712947a1bd44a735f66ee8f51610f4748d76cd30' already exists in the 'openvaa-frontend' repository and cannot be overwritten because the tag is immutable.` The tag kept its digest and the repository still holds one image. The push log lists every layer as `Layer already exists` before that line, so item 8 now searches for `tag invalid` or `immutable`. The build script, run again, printed `tag_exists=yes` with the same digest and exited 3.                                                                                                            |
| 2026-11-13 | Step 5, items 1 and 2: with the key variables unset and `AWS_PROFILE=openvaa-admin`, the AWS CLI read account `471112560111`, and Terraform's providers, which refuse any other account through `allowed_account_ids`, initialised against the state bucket and planned (`init` with `-lockfile=readonly` exit 0).                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-13 | Step 5, item 3: the first plan read `Plan: 40 to add, 0 to change, 0 to destroy.`; its saved file held 40 creates and no other action, all under `module.frontend`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-13 | Step 5, item 5: the first apply stopped at 39 of 40, exit 1, after about five minutes. EC2 refused the CloudFront ingress rule with `InvalidParameterValue: Invalid rule description`, because its description held an apostrophe, outside the set `a-zA-Z0-9. _-:/()#,@[]+=&;{}!$*` EC2 accepts in a security group's or rule's description. The description was rewritten and the module's offline tests now check every security group and rule description against that set. A new saved plan read `Plan: 1 to add, 0 to change, 0 to destroy.`, the one rule, and its apply exited 0. One apply bringing up the whole stack is still to be seen, at the re-apply of Step 17.                   |
| 2026-11-13 | Step 5, item 6: the plan made with `-detailed-exitcode` right after that follow-up apply exited 0, with no resource heading.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-13 | Step 5, item 7: the state object `pipeline/staging/aws/terraform.tfstate` is encrypted with `AES256` and carries a version id. `https://staging.openvaa.org/api/health` answered 200 with `x-cache: Miss from cloudfront`, `status` `ok` and `712947a1bd44a735f66ee8f51610f4748d76cd30`, the image tag, as `build`.                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-13 | Step 6, items 1 and 3: the confirmation mail reached the alert address and the operator followed its link, about ten minutes after the apply that created the subscription; `list-subscriptions-by-topic` then lists the topic's one subscription as `email` and confirmed.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-13 | Step 6, items 2 and 3: Billing offered `Project`, `Environment` and `Root` before this root was applied, because the bootstrap and `dns-mail` resources already carried them, and the operator activated them then. Cost Explorer lists each as `UserDefined` and `Active`, as it does `Election`, which the operator activated with them.                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-13 | Step 7, item 2: both certificates read `ISSUED` with one `DNS` validation, `SUCCESS`: the viewer's, for `staging.openvaa.org`, in `us-east-1`, and the origin's, for `origin.staging.openvaa.org`, in `eu-north-1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-13 | Step 7, item 3: `http://staging.openvaa.org/` answered 301 with `location` `https://staging.openvaa.org/`, and the HTTPS request without `-k` read `ssl_verify_result` 0 with curl exit 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-13 | Step 7, item 4: `/` and `/questions` answered 200, each with `data-project-id` `00000000-0000-0000-0000-000000000001` on `<body>` and five inlined fetches of the hosted project's REST host. The server's HTML of `/questions` holds none of the six statements, because the located layout renders the questions only once their data has resolved in the browser, so the item searched in vain as first written. It now renders the page in Playwright's Chromium, which followed it to `/questions/__first__` and read `Public transport should be free of charge in cities.` under `1/6`. The task definition's environment and secret names together equal the 16 names of the module's list. |
| 2026-11-13 | Step 7, item 5: the post with the public origin was answered 405, not 403: SvelteKit's origin check comes before routing, and `/contestant/login` holds links and no form action. The same post to `/contestant/login/email` reached its action, which answered 400 for credentials that sign nobody in. With `Origin: http://attacker.example` both addresses answered 403 with `Cross-site POST form submissions are forbidden`.                                                                                                                                                                                                                                                                  |
| 2026-11-13 | Step 7, item 6: two requests for `/` both read `Miss from cloudfront` with no `age`, and the origin sent no `cache-control`. `/_app/immutable/entry/start._C5OoPLf.js` read `Miss`, then `Hit from cloudfront`, with `public,max-age=31536000,immutable`. The distribution holds 11 error responses, each with `ErrorCachingMinTTL` 0.                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-13 | Step 7, item 7: the service's grace period is 60 seconds, the target group checks `/api/health`, and its one target is `healthy`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-13 | Step 8, item 2: the task's group holds one ingress rule, from the load balancer's group on 3000, and the load balancer's one, from the CloudFront origin-facing prefix list on 443. The network has no NAT gateway, and its one default route goes to the internet gateway.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-13 | Step 8, item 3: the one running task has a public address, and the load balancer's name resolved. From the workstation, a request to the task's address on 3000 and one to the load balancer on 443 each ended after 10 seconds with curl status 28 and HTTP `000`.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-13 | Step 8, items 4 and 5: of the state's 40 managed resources, 26 carry `tags_all` and every one carries the four default tags. The 14 others are of the types `aws_acm_certificate_validation`, `aws_appautoscaling_policy`, `aws_cloudwatch_event_target`, `aws_route53_record`, `aws_route_table_association`, `aws_sns_topic_policy`, `aws_sns_topic_subscription` and `random_password`. The running task carries `Root=aws`, its keys `Environment`, `ManagedBy`, `Project` and `Root` beside ECS's `aws:ecs:clusterName` and `aws:ecs:serviceName`.                                                                                                                                             |
| 2026-11-13 | Step 8, item 6: of the 30 ARNs in the state, the only two outside `eu-north-1` are the viewer certificate's, in `us-east-1`, and the distribution's, which is global.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-13 | Step 8, item 7: the log group `/openvaa/staging/frontend` keeps 90 days and holds one stream named `frontend/frontend/<task id>` for the running task.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-13 | Step 8, item 8: the state object is encrypted with `AES256` and carries a version id, and the bucket's versioning reads `Enabled`. Of two plans started 5 seconds apart, the second exited 1 with `Error acquiring the state lock` on `pipeline/staging/aws/terraform.tfstate`, and the first exited 0 with no changes.                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-13 | Step 9, items 2 and 3: with `DEPLOYMENT_DIAGNOSTICS=true` and the workstation's `/32`, applied in one saved plan of exactly the four stop-rule changes (exit 0), `/api/diagnostics` through the CDN over IPv4 answered 200. `x-forwarded-for` reached the container as `viewer,edge` and, with a client-sent `X-Forwarded-For: 203.0.113.99`, as `spoof,viewer,edge`: the client-sent entry stays first. The `edge` entry lies inside the CloudFront origin-facing prefix list. The `viewer` entry, `cloudfront-viewer-address` and the resolved client address all equal the address `checkip.amazonaws.com` names over IPv4.                                                                      |
| 2026-11-13 | Step 9, item 3: under the managed origin request policy, `cloudfront-viewer-address`, `x-amz-cf-id` and `via` (naming CloudFront) reach the container, beside `host` (`origin.staging.openvaa.org`), `x-forwarded-port` (`443`) and `x-forwarded-proto` (`https`); `forwarded` and `x-forwarded-host` do not.                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-13 | Step 9, item 4: `s9_depth_verdict=2-confirmed`. Depth 2 resolves the viewer with and without the spoofed entry, with `clientAddressError` `null` both times, so `XFF_DEPTH` stays `"2"` in `terraform.tfvars`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-13 | Step 9, item 5: reached directly through the `/32`, the listener answered 403 without `x-origin-verify` and with a wrong value, with `server: awselb/2.0` and an empty `text/plain` body, its own fixed response; it forwarded the value CloudFront sends, and `/api/health` answered 200. Port 80 of the load balancer answered 301 with `location` `https://origin.staging.openvaa.org:443/`. The load balancer's group held three ingress rules: the prefix list on 443 and the `/32` on 443 and 80.                                                                                                                                                                                             |
| 2026-11-13 | Step 9, item 6: the apply without the two variables, one saved plan of the four stop-rule changes, exited 0. `/api/diagnostics` then answered 404 through the CDN, the load balancer's group holds one ingress rule, from the prefix list on 443, a direct request to the load balancer ended after 10 seconds with curl status 28 and HTTP `000`, and a plan with `-detailed-exitcode` exited 0. The apply returned with the old deployment still listed; its target was already deregistered when the 404 was read, and the service was steady 50 seconds later, with five more requests all answering 404.                                                                                       |
| 2026-11-13 | Step 10, items 3 and 4: the plan with `-var 'omit_environment=["ORIGIN"]'` held the task definition's `delete-create` and the service's `update` alone, and its apply exited 1 after about seven minutes with `Service deployment rolled back because the circuit breaker threshold was exceeded.` Revision 4's tasks failed one by one, and at the third the deployment failed with `ECS deployment circuit breaker: tasks failed to start.`, at 11:35:51Z; the service rolled back to revision 3 and was steady 72 seconds later. Revision 3 was `INACTIVE`, deregistered by the fault apply's destroy, and the rollback ran it all the same.                                                     |
| 2026-11-13 | Step 10, items 4 and 8: the old task kept serving through the fault: its target read `healthy` in all 13 reads, and the request loop counted 692 requests, from before the apply until after the rollback, with no answer that was not 2xx.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-13 | Step 10, item 5: each of the three failed tasks stopped with `EssentialContainerExited` and exit 1, and each one's own stream, `frontend/frontend/<task id>`, holds `Error: Required environment variables are not set: ORIGIN`, thrown from `Server.init` before the server listens; one task never had a `startedAt` and its stream holds the line too. A fourth task of the revision was still pending when the rollback stopped it (`ServiceSchedulerInitiated`, no exit code). `list-tasks --service-name` with `--desired-status STOPPED` exited 0 and listed none of these tasks, so item 5 lists the cluster's stopped tasks and filters them by revision and stop code.                    |
| 2026-11-13 | Step 10, items 7 and 9: the rule fired once (`TriggeredRules` 1, `Invocations` 1) for the rollback's `SERVICE_DEPLOYMENT_FAILED`, the topic delivered one notification and failed none, and the mail reached the confirmed address; its body is the EventBridge event, naming `SERVICE_DEPLOYMENT_FAILED`, `ERROR`, the service `openvaa-staging-frontend`, the failed deployment and the circuit breaker's reason.                                                                                                                                                                                                                                                                                 |
| 2026-11-13 | Step 11, items 3 and 4: the plain plan held the task definition's `delete-create` and the service's `update` alone, and its apply exited 0 after about two minutes, returning while the old task was still `STOPPING`. The rollout started the new task, registered its target, then stopped the old task and deregistered its target, with a deregistration delay of 30 seconds.                                                                                                                                                                                                                                                                                                                   |
| 2026-11-13 | Step 11, items 5 and 6: the stopped task's stream holds the stop record, 12 events, one per line, so the message line `msg: 'The server is exiting after its stop.',` and `signal: 'SIGTERM',` were found by separate searches, in the same second. `SIGTERM` reached Node 35 seconds after the deregistration began, with `inFlightAtSignal` 0 and `drainMs` 1; the task stopped with `ServiceSchedulerInitiated`, `Scaling activity initiated by (deployment ...)` and exit 0. The request loop counted 214 requests with no answer that was not 2xx, and a plan with `-detailed-exitcode` then exited 0.                                                                                         |
| 2026-11-13 | Step 12, items 2 to 4: the pair's plan read `Plan: 2 to add, 0 to change, 0 to destroy.` with the two scheduled actions' `create` alone, and its apply exited 0. The `at()` actions, read in UTC, raised the floor 0.4 and 42 seconds after their times in two runs. The service started a second task and ran 2 at the next minute read. In 16 minute reads, neither count passed the ceiling 2, and the desired count never fell below the floor in force. The running count lagged the raised floor in one read, 33 seconds after the raise, while the task was starting.                                                                                                                        |
| 2026-11-13 | Step 12, items 4 and 5: target tracking scaled in from 2 to 1 within a minute of the lowering, not the 15 to 20 minutes expected (research A3). Measured from the lowering to `Setting desired count to 1.`, it took 35 seconds in one run and 2 seconds in the other, and the count read 1 at the first minute read after the lowering's time. The policy's low alarm (`LessThanThreshold` 54, 15 periods of 60 seconds) had been in `ALARM` at idle CPU since the morning, so the count came down as soon as the floor did. The lowering itself ran 15 and 48 seconds after its time.                                                                                                             |
| 2026-11-13 | Step 12, item 6: the scale-in stopped the raise's task, not the older one, with `ServiceSchedulerInitiated`, `Scaling activity initiated by (deployment ...)` and exit 0. Its own stream holds the stop record with `signal: 'SIGTERM',`, `inFlightAtSignal` 0 and `drainMs` 0, 56 seconds after the deregistration began. This is the stop signal's second record, after Step 11. In the first run the stopped task had already aged out of `describe-tasks` (`MISSING`) about 93 minutes after it stopped, while its stream still held the same record.                                                                                                                                           |
| 2026-11-13 | Step 12, item 4: a lid-closed sleep of the workstation on battery, from 13:49Z to 15:31Z with two DarkWakes of about a minute, left gaps of 8 and 92 minutes in the minute reads of the first run. The loop woke past its end and stopped. The scaling activities and the service's events, written by AWS, kept the whole run. The pair was taken off with item 7 and the step was run again under `caffeinate -i`, with no gap over 68 seconds.                                                                                                                                                                                                                                                   |
| 2026-11-13 | Step 12, item 7: the removal's plan read `Plan: 0 to add, 0 to change, 2 to destroy.` with the two scheduled actions' `delete` alone, and its apply exited 0, twice. Afterwards no scheduled action is listed for the service, the scalable target reads 1 and 2, and a plan with `-detailed-exitcode` exits 0.                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-13 | Step 13, items 1 and 2: `https://staging.openvaa.org/` answered 200 and its inlined public environment carries the anon key. One insert into `public.feedback` from the workstation, made as the browser makes it, straight to the REST API with the anon key and the public origin, answered 201 at 15:59:21Z.                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-14 | Step 13, item 3: from 08:42:46Z, five inserts from the workstation over IPv4 answered 201 and the sixth 400 with `P0001`, so hosted Supabase keys the feedback limit on one client, admitting five in the window and refusing the sixth.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-14 | Step 13, items 4 and 5: the phone, on mobile data, sent feedback through the voter app's form at 08:43Z and was thanked, while the workstation's bucket was full. The workstation's insert at 08:44:18Z, 92 seconds after the block began, was still refused with 400 and `P0001`. The two networks have a bucket each, keyed on the client Cloudflare gives the project.                                                                                                                                                                                                                                                                                                                           |
| 2026-11-13 | Step 14, item 1: read anonymously, the persistent project lists `email,code` as the candidates' registration modes, and the first smoke candidate's id can be read. Because the anonymous read of a candidate admits only a confirmed one, the candidate was confirmed before the invitation.                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-14 | Step 14, item 2: the first two posts of the Admin App's login form answered 400 with `Error from cloudfront` and no cookies. The application's log held `Admin login failed: Invalid login credentials`: `jq -r` ended the form body with a newline, and `--data-binary` sent it as part of the password. With the body written by `jq -j`, which this step now gives, the post answered 303 to `https://staging.openvaa.org/admin`, with `x-cache` `Miss from cloudfront` and the cookie `sb-<project ref>-auth-token`.                                                                                                                                                                            |
| 2026-11-14 | Step 14, item 2: the answer that sets the auth cookie carries `cache-control: private, no-cache, no-store, must-revalidate, max-age=0` from the origin, and CloudFront missed it, so the edge did not answer it from its cache.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-14 | Step 14, item 4: `create_invitations`, called with the administrator's own session and `p_confirm_entity` false, answered 200 with one email invitation for the smoke candidate, no code, and `entity_confirmed` `true`. That field is the entity's confirmation after the call, not the flag: the candidate was already confirmed, as item 1 shows, and the call left it so.                                                                                                                                                                                                                                                                                                                       |
| 2026-11-14 | Step 14, item 5: the sign-in link asked for on `/contestant/login/email` with "I have not set a password yet" reached the second mailbox through SES at 08:55Z. It came from the project's sender `noreply` on `staging.openvaa.org`, the client showed it as verified by `staging.openvaa.org`, and its subject was `Sign-in link for the voting advice application`. Its link has the origin `https://staging.openvaa.org`, the path `/en/api/auth/callback` and the type `magiclink`. Following it showed the screen that asks a user with no password to set one.                                                                                                                               |
