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
  for one observation would become part of that record.
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
- **For Steps 15 and 16, the Supabase session secrets**: the access token and the database password,
  given for one shell session as
  [`../supabase/README.md`](../supabase/README.md) describes, because a plan of the Supabase root
  needs them, and the SMTP pair, read from the `dns-mail` root's outputs in the same shell.

## Before you start

- **The tools:** Terraform 1.16.5, the version in `infra/.terraform-version`; the AWS CLI version 2;
  `jq`, `git` and `curl`; Docker with `buildx`, running. The service runs on arm64 and the image is
  built natively, so build on an arm64 workstation.
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

Steps 1 to 6 bring the stack up and are written below. Steps 7 to 18 are not written yet.

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

Each value is read without echoing it and exported for one command. `jq` builds the request from the
environment and hands it to the CLI on standard input, so the value reaches no command line and no
file. The status line is the CLI's own: it is the last command of the pipe, and if `jq` failed the CLI
would receive no input and fail too.

1. The Supabase project's anon key, as the Supabase dashboard shows it under the project's API keys:

   ```bash
   printf 'anon key: '; read -rs PARAMETER_VALUE; echo
   export PARAMETER_VALUE
   jq -n --arg name "$P/PUBLIC_SUPABASE_ANON_KEY" \
     '{Name: $name, Type: "SecureString",
       Value: env.PARAMETER_VALUE,
       Tags: [{Key: "Project", Value: "openvaa"},
         {Key: "Environment", Value: "staging"}]}' \
     | aws ssm put-parameter --cli-input-json file:///dev/stdin \
       > "$L/s2-anon.json" 2> "$L/s2-anon.err"
   echo "s2_anon_put_exit=$?"
   unset PARAMETER_VALUE
   ```

2. The PostHog project key. If there is no PostHog project yet, type a stand-in such as `stand-in`:
   the task receives the parameter but reads it only once `ANALYTICS_PROVIDER` is `posthog`, and ECS
   starts no task whose parameter is missing. Answer `answer_posthog_key=real` or
   `answer_posthog_key=stand-in`.

   ```bash
   printf 'PostHog key: '; read -rs PARAMETER_VALUE; echo
   export PARAMETER_VALUE
   jq -n --arg name "$P/ANALYTICS_POSTHOG_KEY" \
     '{Name: $name, Type: "SecureString",
       Value: env.PARAMETER_VALUE,
       Tags: [{Key: "Project", Value: "openvaa"},
         {Key: "Environment", Value: "staging"}]}' \
     | aws ssm put-parameter --cli-input-json file:///dev/stdin \
       > "$L/s2-posthog.json" 2> "$L/s2-posthog.err"
   echo "s2_posthog_put_exit=$?"
   unset PARAMETER_VALUE
   ```

   A parameter that already exists is refused with `ParameterAlreadyExists` and keeps its value. To
   replace a value, run the same command with `Overwrite: true` in place of the `Tags` member: AWS
   refuses tags on an overwrite, and the parameter keeps the tags it has. Print the error's code alone,
   never its message:

   ```bash
   grep -ho -E 'ParameterAlreadyExists|AccessDenied[A-Za-z]*' \
     "$L/s2-anon.err" "$L/s2-posthog.err" | sed 's/^/s2_put_error=/'
   ```

3. Read both back: name, type and key, then the tag keys, never a value:

   ```bash
   aws ssm describe-parameters \
     --parameter-filters "Key=Path,Option=OneLevel,Values=$P" \
     > "$L/s2-describe.json" 2> "$L/s2-describe.err"
   echo "s2_describe_exit=$?"
   jq -r '.Parameters[] | "s2_parameter=\(.Name) \(.Type) \(.KeyId)"' \
     "$L/s2-describe.json"
   for n in PUBLIC_SUPABASE_ANON_KEY ANALYTICS_POSTHOG_KEY; do
     aws ssm list-tags-for-resource --resource-type Parameter \
       --resource-id "$P/$n" > "$L/s2-tags-$n.json" \
       2> "$L/s2-tags-$n.err"
     echo "s2_tags_${n}_exit=$?"
     jq -r --arg n "$n" \
       '"s2_tag_keys_\($n)=\([.TagList[].Key] | sort | join(","))"' \
       "$L/s2-tags-$n.json"
   done
   aws kms describe-key --key-id alias/aws/ssm \
     > "$L/s2-key.json" 2> "$L/s2-key.err"
   echo "s2_ssm_key_exit=$?"
   ```

   Expected: two `s2_parameter=` lines, `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` and
   `/openvaa/staging/frontend/PUBLIC_SUPABASE_ANON_KEY`, each `SecureString alias/aws/ssm`; both
   `s2_tag_keys_` lines `Environment,Project`; and `s2_ssm_key_exit=0`.

4. Last item, also when you stop early or a command failed:

   ```bash
   unset PARAMETER_VALUE
   test -n "$L" && rm -rf "$L" && echo "s2_logs_removed=yes"
   ```

Return: every `s2_` line and `answer_posthog_key=`. Never paste either value.

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

4. Push it and see `origin` list it. On the first build the branch does not exist yet:

   ```bash
   git push --quiet origin "$SHA:refs/heads/$B" \
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
     "$SHA:refs/heads/$B" > "$L/s4-push.log" 2>&1
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
   grep -i -m1 -E 'immutable|already exists' "$L/s4-second-push.log" \
     | sed "s|$H|<registry>|g; s/^/s4_second_push_refusal=/"
   docker logout "$H" > /dev/null 2>&1; echo "s4_logout_exit=$?"
   ```

   Expected: `s4_second_push_exit=` not 0, and a `s4_second_push_refusal=` line that says the tag
   already exists and the repository's tags are immutable. The line names the registry as
   `<registry>`, never by its host.

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

## Not yet observed

This root has not been applied yet. Each statement below is something this runbook relies on and that
has not been seen. It moves to "Observations", with its date, once the step named beside it has shown
it.

| Statement                                                                                                                                                                                          | Checked by                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| With the key variables unset, `AWS_PROFILE=openvaa-admin` is what both the AWS CLI and Terraform's provider sign in with                                                                           | Step 1, the lines that begin it, and Step 5, item 2 |
| The AWS CLI reads `--cli-input-json` from `file:///dev/stdin`, so a parameter's value reaches it from the environment through `jq` and never on a command line                                     | Step 2, items 1 and 2                               |
| A SecureString created without a key id uses `alias/aws/ssm`, and AWS creates that key with the first such parameter                                                                               | Step 2, item 3                                      |
| The two parameters carry the tags `Project` and `Environment` and no `Root` tag, so the destroy check does not list them                                                                           | Step 2, item 3, and Step 16                         |
| The policy simulator allows the execution role `ssm:GetParameters` under `/openvaa/staging/frontend/` and denies it under another path                                                             | Step 3, item 4                                      |
| A commit built through a temporary index from the tree of `HEAD` without `.planning`, with `origin/main` as its parent, can be pushed to a new branch and is then listed by `git ls-remote origin` | Step 4, items 2 to 4                                |
| The image built natively on an arm64 workstation is pushed as one arm64 image manifest, not an index                                                                                               | Step 4, item 6                                      |
| The image, started with only the four required variables, answers `/api/health` with its commit id as `build`                                                                                      | Step 4, item 7                                      |
| The registry refuses a different image pushed under an existing tag, and the tag keeps its digest                                                                                                  | Step 4, items 8 and 9                               |
| The build script, run again for a tag the registry holds, prints `tag_exists=yes` and exits 3                                                                                                      | Step 4, item 9                                      |
| The first plan of this root creates only, and only under `module.frontend`                                                                                                                         | Step 5, item 3                                      |
| One apply brings up the whole stack, the certificates' validation waiting inside it                                                                                                                | Step 5, item 5                                      |
| A second plan right after the first apply shows no change                                                                                                                                          | Step 5, item 6                                      |
| The state object is encrypted and versioned in the bucket                                                                                                                                          | Step 5, item 7                                      |
| `https://staging.openvaa.org/api/health` answers 200 through CloudFront with the image's commit id                                                                                                 | Step 5, item 7                                      |
| The subscription's confirmation mail reaches the alert address, and the subscription then reads confirmed                                                                                          | Step 6, items 1 and 3                               |
| Billing offers `Project`, `Environment` and `Root` for activation, and Cost Explorer then lists each as `Active`                                                                                   | Step 6, items 2 and 3                               |

## Observations

| Date (UTC) | Observation |
| ---------- | ----------- |
