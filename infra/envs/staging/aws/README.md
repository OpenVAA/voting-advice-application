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

Steps 1 to 6 bring the stack up. Steps 7 and 8 read the running stack and change nothing; Steps 9 to
12 each change it for an observation and change it back. Steps 13 to 18 are not written yet.

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
   parameter store. The six statements are those of the smoke dataset:

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
   grep -o -F -f "$L/s7-statements.txt" "$L/s7-questions.html" \
     | sort -u | sed 's/^/s7_statement_seen=/'
   ```

   Expected: `s7_home=` and `s7_questions=` each `200` and an address on `https://staging.openvaa.org`;
   both `_project_id=00000000-0000-0000-0000-000000000001`; at least one `_supabase_fetches=` above 0;
   and at least one `s7_statement_seen=` line, such as
   `s7_statement_seen=Defence spending should be increased.`

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
   copy of the log lines: paste them at once, because the log group goes with a destroy:

   ```bash
   aws ecs list-tasks --cluster "$C" --service-name "$S" \
     --desired-status STOPPED \
     > "$L/s10-stopped.json" 2> "$L/s10-stopped.err"
   echo "s10_list_stopped_exit=$?"
   jq -r '.taskArns[]' "$L/s10-stopped.json" > "$L/s10-stopped.txt"
   xargs aws ecs describe-tasks --cluster "$C" --tasks \
     < "$L/s10-stopped.txt" \
     > "$L/s10-stopped-tasks.json" 2> "$L/s10-stopped-tasks.err"
   echo "s10_describe_stopped_exit=$?"
   jq -r --arg td "$NEW_TD" '[.tasks[]
     | select(.taskDefinitionArn == $td)]
     | "s10_failed_tasks=\(length)",
       (map(.stoppedReason) | unique[]
         | "s10_failed_task_reason=\(.)"),
       (map(.containers[0].exitCode | tostring) | unique[]
         | "s10_failed_task_exit=\(.)")' \
     "$L/s10-stopped-tasks.json"
   jq -r --arg td "$NEW_TD" '.tasks[]
     | select(.taskDefinitionArn == $td)
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
   `s10_failed_task_streams_with_line=` equal to `s10_failed_tasks`.

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
count comes down when target tracking scales in, which it does slowly, so the step waits up to 30
minutes after the lowering. The scale-in stops a task, which writes the stop record a second time.
The root gives the actions no time zone, so their times are read in UTC.

No apply is made between the two actions: inside that window the scalable target's floor is the
raised one, a plan shows it as a change, and an apply would put it back. This step is the rehearsal of
"Election day".

Run the step in one sitting: it takes up to 50 minutes.

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
