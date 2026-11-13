# Bootstrap root: runbook

This root holds what every other root rests on: the bucket all Terraform state lives in, the image
registry, the monthly cost budget, and the GitHub OIDC provider with the plan role and the deploy role
that workflows assume. It is applied by hand, by an operator signed in with administrator rights,
and never by a workflow. Its first apply runs with local state, because the bucket its backend names
does not exist yet; the state is then migrated into that bucket.

The overview of every root, the order of first applies and the rules that hold for every apply are in
[`../README.md`](../README.md).

## Flow overview

```
Step 1  inventory of the account, read-only; settle any IAM user with an inline policy
   |
Step 2  first apply with local state, through an untracked backend override, at a 1 USD test budget
   |
Step 3  migrate the state into the bucket; confirm the remote copy; only then remove the local files;
   |    plan again, which must show no change
   |
Step 4  read back the bucket, the registry and the two roles
   |
Step 5  policy simulator: the plan role's deny, the pipeline allow, every call the S3 backend makes
   |
Step 6  the state lock, seen with two terminals; the spend the budget computed
   |
Step 7  the budget alert: a test amount that can fire, the wait for the mail, the raise to 100 USD
```

Steps 3 to 6 are one sitting. Step 7 can take a day or more and runs alongside the other roots.

## What you paste back

Every command below sends its raw output to a log file in a directory outside the repository, `$L`,
and prints named lines of the form `s<item>_<field>=<value>`. Within a step, the numbered items carry
the number that begins their named lines: item 4 prints lines beginning `s4_`. A typed answer goes on
a line of the form `answer_<name>=<text>`. Paste those lines and nothing else: nothing from a log and
nothing from the terminal's scroll-back.

- A plan log or an apply log is never pasted. A plan log holds attribute values, and an apply log
  holds resource ids, among them the access key id of an IAM access key.
- The caller's raw `Arn` is never pasted. It ends in the session name, which is often your e-mail
  address. The commands below print the account id and the role name only.
- When a status line is not 0, paste the lines up to it and stop.
- If whoever asked you to run a step gave you an attempt id, the first line of your reply is
  `answer_attempt=<that id>`.

`$L` and any saved plan file (`tfplan`) hold secrets in clear text: resource ids, attribute values,
and whatever the state or the API returned. Never share, attach or paste either. The last item of
each step removes them and prints a named line; if you stop early or a command fails, run that last
item before you leave the terminal.

## Before you start

- **The applying identity.** Sign in with an IAM Identity Center permission set that uses the
  AWS-managed `AdministratorAccess` policy and carries no inline policy, or with an IAM user that has
  MFA and managed policies only. A "force MFA" policy written inline has to become a customer-managed
  policy first, because no IAM user in the account may carry an inline policy, the applying one
  included.
- **Terraform 1.16.5**, the version in `infra/.terraform-version`, for example from
  `brew install hashicorp/tap/terraform`. Step 1 checks it and the other tools.
- **`TF_VAR_alert_email`**, the address the budget alerts go to. Type it in the terminal of each
  sitting, as `export TF_VAR_alert_email='<your-address>'`, and put it in no file. If you choose
  instead to track it, write `alert_email = "<your-address>"` into `terraform.tfvars` and commit that
  file yourself; the address is then public, and the export is left out everywhere below.

**The lines that begin each sitting.** A step is often resumed in a new terminal, so no command below
relies on an earlier sitting. Run these first, from the repository root, signed in, and again in any
new terminal. Each step lists the ones it needs.

```bash
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
```

`LC_ALL=C` keeps every number and sort order independent of your workstation's locale. Give a time in
UTC, in the form `date -u +%Y-%m-%dT%H:%MZ` prints.

## Step 1: Inventory of the account

Nothing in this step changes the account. The inventory script makes read-only calls only and prints
names and counts: no session name, no e-mail address, no error text of a failed call, and no IAM user
name outside the path `/openvaa/`. Such a user is printed as `user-<n>`; to see which one that is, run
`aws iam list-users --query 'Users[].UserName'` on your own machine and count.

1. Say which identity applies Terraform by hand, `identity-center` or `iam-user`, and name its
   managed policies, each on the `answer_` line you were given for it.
2. Install Terraform 1.16.5, then check every tool a later step calls, so that a missing one is found
   before anything is applied and not in the middle of a state migration. Each line must carry a
   version; if one prints nothing after the `=`, install that tool and run its line again.

   ```bash
   export LC_ALL=C
   echo "s2_terraform=$(terraform version | head -1)"
   echo "s2_jq=$(jq --version)"
   echo "s2_aws=$(aws --version 2>&1 | cut -d' ' -f1)"
   echo "s2_dig=$(dig -v 2>&1 | head -1)"
   echo "s2_curl=$(curl --version | head -1 | cut -d' ' -f1-2)"
   echo "s2_shasum=$(shasum --version | head -1)"
   echo "s2_git=$(git --version)"
   ```

3. Sign in with that identity, run the lines that begin a sitting, then print the account and the kind
   of identity. The second command cuts off the session name; for an IAM user it prints the word
   `user` and not the user's name. Only if it printed `s3_principal=user`, run the third, which counts
   the MFA devices of the signed-in user.

   ```bash
   export LC_ALL=C
   export AWS_PAGER=""
   L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
   echo "s3_account=$(aws sts get-caller-identity --query Account --output text)"
   aws sts get-caller-identity --query Arn --output text | sed -E 's#^arn:aws:(sts|iam)::[0-9]+:##; s#^(assumed-role/[^/]+)/.*#\1#; s#^user/.*#user#; s#^#s3_principal=#'
   echo "s3_user_mfa_devices=$(aws iam list-mfa-devices --query 'length(MFADevices)' --output text)"
   ```

   `s3_account` must be `471112560111`. Any other account means stop: the shell is signed in elsewhere.

4. From the repository root, the full inventory:

   ```bash
   infra/scripts/account-inventory.sh > "$L/s4.log" 2>&1; echo "s4_inventory_exit=$?"
   sed 's/^/s4_inv=/' "$L/s4.log"
   ```

5. The assert mode, which exits 1 when any IAM user carries an inline policy:

   ```bash
   infra/scripts/account-inventory.sh --assert-no-inline-user-policies > "$L/s5.log" 2>&1; echo "s5_assert_users_exit=$?"
   sed 's/^/s5_inv=/' "$L/s5.log"
   ```

6. In the Cloudflare dashboard, open the zone `openvaa.org`, then DNS, Records, and search for
   `staging`. Answer whether any record exists at or under `staging`, a disabled or proxied one
   included: `none`, or the type and the name of each record found. The dashboard also lists a record
   that public DNS does not serve, which a lookup would miss.
7. Answer, one `answer_` line each: whether the AWS account runs on credits (`yes`, `no` or
   `unknown`); whether the GitHub organisation has opted in to immutable OIDC subjects (`yes`, `no`
   or `unknown`); whether a rename or a transfer of the repository is planned (`yes` or `no`); whether
   the alert address stays per session or is tracked (`per-session` or `tracked`).
8. Only if you chose to track the alert address: write the line into `terraform.tfvars` and commit that
   one file yourself, as "Before you start" says, so that the address passes through no reply.
9. Last item, also when you stop early:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s9_logs_removed=yes"
   ```

Return: the `s2_`, `s3_`, `s4_`, `s5_` and `s9_` lines, and the `answer_` lines of items 1, 6 and 7.

### If an IAM user carries an inline policy

If `s5_assert_users_exit` is 1, decide for each user the inventory lists with a non-empty `inline=[…]`
what happens to it. The choice is per user, and deleting cannot be undone.

- **Convert.** Keep the user and move the permission to a customer-managed policy: save the document
  with `aws iam get-user-policy`, create a managed policy from it, attach it, then delete the inline
  one. Nothing that uses the user's key stops. Do not paste the policy document.
- **Delete the user.** Check first with `aws iam list-access-keys` and `aws iam get-access-key-last-used`
  that nothing has used its key recently.
- **Leave it for now.** The rule stays broken and the assert mode keeps exiting 1.

AWS documents that SMTP credentials created in the SES console carry an inline user policy named
`AmazonSesSendingAccess`, on a user tagged `InvokedBy=SESConsole`; the inventory prints that tag's
value. Such a user may still be sending mail for something.

After a conversion or a deletion, run the assert mode again in a new sitting:

```bash
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
infra/scripts/account-inventory.sh --assert-no-inline-user-policies > "$L/s5b.log" 2>&1; echo "s5b_assert_users_exit=$?"
sed 's/^/s5b_inv=/' "$L/s5b.log"
test -n "$L" && rm -rf "$L" && echo "s5b_logs_removed=yes"
```

Return: one `answer_` line per user naming your choice and the label the inventory printed for it,
and the three `s5b_` lines.

## Step 2: First apply with local state

The apply creates the state bucket, the OIDC provider, the two roles and their four policies, the
registry and the budget. The bucket has a global name and is protected from destruction, and later
workflows name the roles, so undoing this step means emptying a versioned bucket and removing roles
by hand. Run it in one terminal, signed in with the identity of Step 1.

1. From the repository root:

   ```bash
   cd infra/bootstrap
   ```

2. The lines that begin the sitting. Type your address in the terminal; leave the last line out if
   you chose to track the address.

   ```bash
   export LC_ALL=C
   export AWS_PAGER=""
   L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
   export TF_VAR_alert_email='<your-address>'
   ```

3. It must print `s3_account=471112560111`:

   ```bash
   echo "s3_account=$(aws sts get-caller-identity --query Account --output text)"
   ```

4. Write the untracked backend override, which replaces the S3 block of `backend.tf` with a local
   backend for this apply:

   ```bash
   printf 'terraform {\n  backend "local" {}\n}\n' > backend_override.tf
   ```

5. It must print 0, which means Git ignores the file:

   ```bash
   git check-ignore -q backend_override.tf; echo "s5_override_ignored_exit=$?"
   ```

6. Initialise, and print the lines that name the backend:

   ```bash
   terraform init -input=false -no-color > "$L/s6.log" 2>&1; echo "s6_init_exit=$?"
   grep -E 'backend' "$L/s6.log" | sed 's/^/s6_backend_line=/'
   ```

   A printed line must name the backend `local`, and none may name `s3`. If one names `s3`, or the
   init failed on the backend, the override did not take. Then take the fallback: move `backend.tf`
   aside and run this item again, and answer `answer_fallback=yes`. Otherwise answer
   `answer_fallback=no`.

   ```bash
   rm backend_override.tf
   mv backend.tf /tmp/openvaa-bootstrap-backend.tf
   ```

7. Plan at the test budget amount, and print the plan's summary line and the number of lines that
   hold an address:

   ```bash
   terraform plan -input=false -no-color -var budget_limit_usd=1 -out=tfplan > "$L/s7.log" 2>&1; echo "s7_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s7.log" | sed 's/^/s7_plan_line=/'
   echo "s7_plan_address_lines=$(grep -c -E '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][a-z]+' "$L/s7.log")"
   ```

8. Go on only if `s7_plan_line` reads `0 to change, 0 to destroy` and `s7_plan_address_lines=0`. A first
   apply adds resources, so the count to add is not zero. If the address count is not 0, stop and say
   so: the plan should show your address as `(sensitive value)`. You may read the plan itself in
   `$L/s7.log`.
9. Apply the saved plan:

   ```bash
   terraform apply -input=false -no-color tfplan > "$L/s9.log" 2>&1; echo "s9_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s9.log" | sed 's/^/s9_apply_line=/'
   ```

10. Five outputs, each by name. None is a secret.

    ```bash
    for o in state_bucket_name registry_url plan_role_arn deploy_role_arn budget_name; do echo "s10_$o=$(terraform output -raw "$o")"; done
    ```

11. Last item, also when you stop early or a command failed:

    ```bash
    rm -f tfplan
    test -n "$L" && rm -rf "$L" && echo "s11_logs_removed=yes"
    ```

> **Give `-var budget_limit_usd=1` to every plan and apply of this root until Step 7 raises the
> budget.** The tracked `terraform.tfvars` says 100. Without the argument, the second plan of Step 3
> shows the limit changing to 100 and exits 2 instead of 0. If Step 7 sets another test amount, that
> amount takes the place of 1 from then on.

Return: the `s3_`, `s5_`, `s6_`, `s7_`, `s9_`, `s10_` and `s11_` lines, and `answer_fallback=`.

## Step 3: Migrate the state and plan again

Steps 3 to 6 run in one sitting. The local state files of Step 2 are in `infra/bootstrap` and do not
depend on the terminal. Begin with these lines, from the repository root, signed in; leave the export
of the address out if you track it.

```bash
cd infra/bootstrap
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
export TF_VAR_alert_email='<your-address>'
B=openvaa-tfstate-471112560111
```

1. Bring the S3 backend back by removing the override:

   ```bash
   rm backend_override.tf
   ```

   If you took the fallback in Step 2, restore the moved file instead:

   ```bash
   git checkout -- backend.tf
   ```

2. Migrate. Answer `yes` when asked to copy the state. This command asks a question, so its output
   stays in the terminal; paste only its status line. Terraform documents that `-migrate-state`
   copies the existing state to the new backend.

   ```bash
   terraform init -migrate-state -no-color; echo "s2_migrate_exit=$?"
   ```

3. Confirm the remote copy before deleting anything. These read the state object in the bucket,
   print its size, its encryption and whether it has a version id (not the id itself), list the state
   through the new backend, and count the managed resources in it, leaving out the data sources the
   list holds too.

   ```bash
   aws s3api head-object --bucket "$B" --key hand/bootstrap/terraform.tfstate --output json > "$L/s3.json" 2> "$L/s3.err"; echo "s3_head_exit=$?"
   jq -r '"s3_state_size=\(.ContentLength)", "s3_state_sse=\(.ServerSideEncryption)", "s3_state_versioned=\(.VersionId != null)"' "$L/s3.json"
   terraform state list > "$L/s3-list.txt" 2> "$L/s3-list.err"; echo "s3_state_list_exit=$?"
   echo "s3_managed_count=$(grep -c -v -E '(^|[.])data[.]' "$L/s3-list.txt")"
   ```

4. Only if item 3 printed `s3_head_exit=0` and an `s3_managed_count` equal to the number that the
   `s9_apply_line` of Step 2 reported as added, plus any it reported as imported:

   ```bash
   rm -f terraform.tfstate terraform.tfstate.backup
   echo "s4_local_state_removed=yes"
   ```

   > **The remote state is checked first, and the local files are removed second.** Until item 3 has
   > shown the object in the bucket and the same number of resources through the new backend, the
   > local `terraform.tfstate` may be the only copy of the state. Deleting it then would orphan every
   > resource of this root, and the recovery is an import of each one. If item 3 did not print
   > `s3_head_exit=0`, do not run item 4; paste the lines up to it and stop.

5. Plan again. Status 0 means no change, 2 means changes, 1 means an error.

   ```bash
   terraform plan -input=false -no-color -var budget_limit_usd=1 -detailed-exitcode > "$L/s5.log" 2>&1; echo "s5_second_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s5.log" | sed 's/^/s5_plan_line=/'
   ```

Steps 4 to 6 continue in the same terminal. Return the lines of Steps 3 to 6 together, at the end of
Step 6.

## Step 4: Read back the bucket, the registry and the roles

6. The bucket, one field per line: encryption, versioning, the four public-access blocks, whether the
   bucket is public, and the number of statements in its policy that test for TLS. The checks expect
   the booleans as `True` or `False`.

   ```bash
   echo "s6_sse=$(aws s3api get-bucket-encryption --bucket "$B" --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text)"
   echo "s6_versioning=$(aws s3api get-bucket-versioning --bucket "$B" --query Status --output text)"
   echo "s6_public_block=$(aws s3api get-public-access-block --bucket "$B" --query 'PublicAccessBlockConfiguration.[BlockPublicAcls,IgnorePublicAcls,BlockPublicPolicy,RestrictPublicBuckets]' --output text | tr '\t' ',')"
   echo "s6_is_public=$(aws s3api get-bucket-policy-status --bucket "$B" --query PolicyStatus.IsPublic --output text)"
   echo "s6_tls_only_statements=$(aws s3api get-bucket-policy --bucket "$B" --query Policy --output text | grep -c 'aws:SecureTransport')"
   ```

7. The registry, the OIDC providers, the inline and attached policies of both roles, and the
   inventory's assert mode over everything under the path `/openvaa/`:

   ```bash
   echo "s7_registry=$(aws ecr describe-repositories --region eu-north-1 --repository-names openvaa-frontend --query 'repositories[0].[repositoryName,imageTagMutability]' --output text | tr '\t' ',')"
   echo "s7_oidc_providers=$(aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text | tr '\t' ',')"
   echo "s7_plan_inline_count=$(aws iam list-role-policies --role-name openvaa-plan --query 'length(PolicyNames)' --output text)"
   echo "s7_deploy_inline_count=$(aws iam list-role-policies --role-name openvaa-staging-deploy --query 'length(PolicyNames)' --output text)"
   echo "s7_plan_attached=$(aws iam list-attached-role-policies --role-name openvaa-plan --query 'sort(AttachedPolicies[].PolicyName)' --output text | tr '\t' ',')"
   echo "s7_deploy_attached=$(aws iam list-attached-role-policies --role-name openvaa-staging-deploy --query 'sort(AttachedPolicies[].PolicyName)' --output text | tr '\t' ',')"
   ../scripts/account-inventory.sh --assert-managed-only /openvaa/ > "$L/s7.log" 2>&1; echo "s7_assert_managed_exit=$?"
   ```

   Expected: `s7_registry=openvaa-frontend,IMMUTABLE`, one provider for
   `token.actions.githubusercontent.com`, both inline counts 0,
   `s7_plan_attached=ReadOnlyAccess,openvaa-plan-deny,openvaa-plan-lock`,
   `s7_deploy_attached=openvaa-ecr-push,openvaa-tfstate-staging-aws` and `s7_assert_managed_exit=0`.

## Step 5: The policy simulator

8. The simulator evaluates each role's policies for each call the S3 backend makes, and for the reads
   the plan role must never make. Set the four variables, then run each command; each prints one
   named line per decision.

   ```bash
   PLAN_ROLE=$(terraform output -raw plan_role_arn)
   DEPLOY_ROLE=$(terraform output -raw deploy_role_arn)
   K=pipeline/staging/aws/terraform.tfstate
   Q='EvaluationResults[].[EvalActionName,EvalResourceName,EvalDecision]'
   ```

   (a) The plan role, reads of state:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names s3:GetObject --resource-arns "arn:aws:s3:::$B/hand/staging/supabase/terraform.tfstate" "arn:aws:s3:::$B/$K" --query "$Q" --output text | sed 's/^/s8a_decision=/'
   ```

   (b) The plan role, secret reads:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names secretsmanager:GetSecretValue kms:Decrypt --query "$Q" --output text | sed 's/^/s8b_decision=/'
   ```

   (c) The plan role, the lock object, which the backend reads, writes and deletes:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names s3:GetObject s3:PutObject s3:DeleteObject --resource-arns "arn:aws:s3:::$B/$K.tflock" --query "$Q" --output text | sed 's/^/s8c_decision=/'
   ```

   (d) The plan role, the two list prefixes:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names s3:ListBucket --resource-arns "arn:aws:s3:::$B" --context-entries "ContextKeyName=s3:prefix,ContextKeyValues=$K,ContextKeyType=string" --query "$Q" --output text | sed 's/^/s8d1_decision=/'
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names s3:ListBucket --resource-arns "arn:aws:s3:::$B" --context-entries "ContextKeyName=s3:prefix,ContextKeyValues=env:/,ContextKeyType=string" --query "$Q" --output text | sed 's/^/s8d2_decision=/'
   ```

   (e) The deploy role, its own state:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$DEPLOY_ROLE" --action-names s3:GetObject s3:PutObject --resource-arns "arn:aws:s3:::$B/$K" --query "$Q" --output text | sed 's/^/s8e_decision=/'
   ```

   (f) The deploy role, the lock object:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$DEPLOY_ROLE" --action-names s3:GetObject s3:PutObject s3:DeleteObject --resource-arns "arn:aws:s3:::$B/$K.tflock" --query "$Q" --output text | sed 's/^/s8f_decision=/'
   ```

   (g) The deploy role, the two list prefixes:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$DEPLOY_ROLE" --action-names s3:ListBucket --resource-arns "arn:aws:s3:::$B" --context-entries "ContextKeyName=s3:prefix,ContextKeyValues=$K,ContextKeyType=string" --query "$Q" --output text | sed 's/^/s8g1_decision=/'
   aws iam simulate-principal-policy --policy-source-arn "$DEPLOY_ROLE" --action-names s3:ListBucket --resource-arns "arn:aws:s3:::$B" --context-entries "ContextKeyName=s3:prefix,ContextKeyValues=env:/,ContextKeyType=string" --query "$Q" --output text | sed 's/^/s8g2_decision=/'
   ```

   (h) The deploy role, another root's state:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$DEPLOY_ROLE" --action-names s3:GetObject --resource-arns "arn:aws:s3:::$B/hand/staging/supabase/terraform.tfstate" --query "$Q" --output text | sed 's/^/s8h_decision=/'
   ```

   Expected for the plan role: `explicitDeny` for the object under `hand/` and `allowed` for the
   object under `pipeline/` in (a), `explicitDeny` twice in (b), `allowed` three times in (c), and
   `allowed` in both lines of (d). Expected for the deploy role: `allowed` twice in (e), `allowed`
   three times in (f), `allowed` in `s8g1_decision` and `implicitDeny` in `s8g2_decision`, and
   `implicitDeny` in (h).

   If the CLI rejects the `--context-entries` form, no line is printed for (d) or (g). Say so with
   `answer_context_entries=rejected`, and do not paste the error text, which names your session.

> **An `allowed` for the state object under `hand/` in (a) means stop.** The roles are then not
> usable as designed, and the policy is corrected before anything else relies on them.

## Step 6: The state lock, with two terminals

9. Terminal 1 is the one of Steps 3 to 5. Start an apply there and leave it waiting at
   `Enter a value:`. Its output stays in that terminal and is not pasted.

   ```bash
   terraform apply -var budget_limit_usd=1 -replace=module.budget.aws_budgets_budget.monthly
   ```

   Terminal 2 is a new terminal and has none of terminal 1's variables. Without them its plan would
   stop on a missing variable before it reached the lock, and that would read as a lock that was not
   seen. So run these there first, signed in, from the repository root; they give terminal 2 a log
   directory of its own. Leave the export of the address out if you track it.

   ```bash
   cd infra/bootstrap
   export LC_ALL=C
   export AWS_PAGER=""
   export TF_VAR_alert_email='<your-address>'
   B=openvaa-tfstate-471112560111
   L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
   ```

   Then, in terminal 2, a plan that must fail on the lock, and a read of the lock object:

   ```bash
   terraform plan -input=false -no-color -var budget_limit_usd=1 -lock-timeout=0s > "$L/s9.log" 2>&1; echo "s9_locked_plan_exit=$?"
   echo "s9_lock_error_lines=$(grep -c 'Error acquiring the state lock' "$L/s9.log")"
   aws s3api head-object --bucket "$B" --key hand/bootstrap/terraform.tfstate.tflock > /dev/null 2>&1; echo "s9_lock_object_during_exit=$?"
   ```

   Back in terminal 1, type `no`, so that nothing is applied. Then, in terminal 2 again:

   ```bash
   aws s3api head-object --bucket "$B" --key hand/bootstrap/terraform.tfstate.tflock > /dev/null 2>&1; echo "s9_lock_object_after_exit=$?"
   test -n "$L" && rm -rf "$L" && echo "s9_terminal2_logs_removed=yes"
   ```

   The lock error can name the machine and the user that hold the lock, so only its count is
   printed.
   Say what you saw: `answer_lock_seen=yes` if the second plan failed on the lock,
   `answer_lock_seen=no` if it succeeded while the first apply waited. With `no`, the lock is observed
   instead during the raise of Step 7.

10. In terminal 1, the budget's limit and the spend the budget itself computed:

    ```bash
    echo "s10_budget_limit=$(aws budgets describe-budget --account-id 471112560111 --budget-name openvaa-monthly --query 'Budget.BudgetLimit.Amount' --output text)"
    echo "s10_budget_actual=$(aws budgets describe-budget --account-id 471112560111 --budget-name openvaa-monthly --query 'Budget.CalculatedSpend.ActualSpend.Amount' --output text)"
    ```

11. Last item, in terminal 1, also when you stop early or a command failed:

    ```bash
    test -n "$L" && rm -rf "$L" && echo "s11_logs_removed=yes"
    ```

Return, for Steps 3 to 6: the `s2_` to `s11_` lines, `answer_lock_seen=`, and
`answer_context_entries=` if the CLI rejected that form. Afterwards `git status` in `infra/bootstrap`
shows no state file, no plan file and no override.

## Step 7: The budget alert

The budget's actual alert is set at 80 percent of its limit, and its forecast alert at 100 percent.
AWS documents that budget information is updated up to three times a day, that an actual alert is sent
once per budget period when the budget first reaches its threshold, and that a forecast alert is not
triggered until about five weeks of usage data exist. So this step reads the spend the budget computed,
sets a test amount whose 80 percent lies below that spend, waits for the actual alert's mail, and then
replaces the budget at its standing 100 USD. The budget excludes credits and refunds, so usage should
show as spend even on an account that runs on credits. The step can take a day or more.

Begin each sitting with these lines, from the repository root, signed in. Expect to run them more than
once. Leave the export of the address out if you track it.

```bash
cd infra/bootstrap
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
export TF_VAR_alert_email='<your-address>'
```

1. The limit and the computed spend:

   ```bash
   echo "s1_limit=$(aws budgets describe-budget --account-id 471112560111 --budget-name openvaa-monthly --query 'Budget.BudgetLimit.Amount' --output text)"
   echo "s1_actual=$(aws budgets describe-budget --account-id 471112560111 --budget-name openvaa-monthly --query 'Budget.CalculatedSpend.ActualSpend.Amount' --output text)"
   ```

2. Choose the test amount from `s1_actual`, and write the amount the budget carries after this item
   on the line `answer_test_amount=`.
   - `s1_actual` is 0.80 or more: the 1 USD budget can fire as it is. Write `answer_test_amount=1.00`
     and go to item 3.
   - `s1_actual` is 0.01 or more and below 0.80: compute a limit just under `s1_actual` divided by
     0.8, never below 0.01. The `LC_ALL=C` matters: under a locale with a decimal comma the same
     command prints `0,61`, which Terraform rejects as a number. Check that 80 percent of the result
     is below `s1_actual`.

     ```bash
     LC_ALL=C awk -v s=<Actual> 'BEGIN{ l=int((s/0.8)*100-1)/100; if (l<0.01) l=0.01; printf "%.2f\n", l }'
     ```

     Then replace the budget at that amount, and answer `yes` after reading that the plan replaces the
     budget and touches nothing else. This command asks a question, so its output stays in the
     terminal; paste only its status line. If AWS refuses the amount, paste the status line, write
     `answer_amount_refused=yes` and stop.

     ```bash
     terraform apply -no-color -var budget_limit_usd=<that amount> -replace=module.budget.aws_budgets_budget.monthly; echo "s2_test_apply_exit=$?"
     ```

   - `s1_actual` is below 0.01: nothing can fire, because an alert needs spend above its threshold.
     Read item 1 again later. If `s1_actual` is still below 0.01 two days after the zone and mail
     root was applied, the outcome is `no-alert-can-fire`: skip to the end.

3. Wait for the mail from AWS Budgets. When it arrives, write the time it arrived on the line
   `answer_mail_arrived_utc=`, its subject line on `answer_mail_subject=`, and `answer_mail_alert=actual`
   or `answer_mail_alert=forecast`, by which amount it says passed the threshold. If no mail has
   arrived two days after `s1_actual` passed 80 percent of the test amount, the outcome is `no-mail`:
   skip to the end.
4. Only for the outcome `fired`. Raise the budget to its standing limit by replacing it, with no
   `-var`. Both ways below begin with the same three lines, so that the plan is on record either way.
   The plan line must read `1 to add, 0 to change, 1 to destroy`, and the one resource named must be
   the budget.

   ```bash
   terraform plan -input=false -no-color -replace=module.budget.aws_budgets_budget.monthly -out=tfplan > "$L/s4.log" 2>&1; echo "s4_raise_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s4.log" | sed 's/^/s4_plan_line=/'
   grep -E '^  # ' "$L/s4.log" | sed 's/^/s4_plan_resource=/'
   ```

   The usual way, if Step 6 saw the state lock. Then write `answer_lock_branch=no`.

   ```bash
   terraform apply -input=false -no-color tfplan > "$L/s4a.log" 2>&1; echo "s4_raise_apply_exit=$?"
   rm -f tfplan
   ```

   Only if Step 6 did not see the state lock: remove the saved plan first, because this way does not
   apply it. The apply shows the same plan again and waits at its prompt.

   ```bash
   rm -f tfplan
   terraform apply -no-color -replace=module.budget.aws_budgets_budget.monthly; echo "s4_raise_apply_exit=$?"
   ```

   While it waits, run in a second terminal, signed in, the two lines below; that terminal needs
   nothing else. Then answer `yes` in the first terminal, and write `answer_lock_branch=yes`.

   ```bash
   export AWS_PAGER=""
   aws s3api head-object --bucket openvaa-tfstate-471112560111 --key hand/bootstrap/terraform.tfstate.tflock > /dev/null 2>&1; echo "s4_lock_object_during_exit=$?"
   ```

5. Only for the outcome `fired`: read the budget and its two notifications back. These print no
   address.

   ```bash
   echo "s5_budget=$(aws budgets describe-budget --account-id 471112560111 --budget-name openvaa-monthly --query 'Budget.[BudgetLimit.Amount,BudgetLimit.Unit,BudgetType,TimeUnit]' --output text | tr '\t' ',')"
   aws budgets describe-notifications-for-budget --account-id 471112560111 --budget-name openvaa-monthly --query 'Notifications[].[NotificationType,ComparisonOperator,Threshold,ThresholdType]' --output text | tr '\t' ',' | sed 's/^/s5_notification=/'
   ```

   Expected: `s5_budget=100.0,USD,COST,MONTHLY` or the same with another number of zeros, and two
   notification lines, `ACTUAL` at 80 and `FORECASTED` at 100, both `GREATER_THAN` and `PERCENTAGE`.

6. Only for the outcome `fired`: a plan with no `-var` must show no change.

   ```bash
   terraform plan -input=false -no-color -detailed-exitcode > "$L/s6.log" 2>&1; echo "s6_second_plan_exit=$?"
   ```

7. Last item in every outcome, also when you stop early or a command failed:

   ```bash
   rm -f tfplan
   test -n "$L" && rm -rf "$L" && echo "s7_logs_removed=yes"
   ```

**The outcomes that are not `fired`.** In both, do not run items 4 to 6 and do not raise the budget:
it stays at the test amount, so that the alert can still fire. Keep giving
`-var budget_limit_usd=<the test amount>` to every plan and apply of this root; without it a plan
shows the limit changing to 100, because the tracked `terraform.tfvars` says 100 while the account
holds the test amount. For `no-alert-can-fire` there is nothing else to do until spend appears; then
run this step again. For `no-mail`, check the address you exported, your spam folder, and whether the
spend is of a kind the budget counts; then run this step again.

Return: `answer_outcome=fired`, `answer_outcome=no-alert-can-fire` or `answer_outcome=no-mail`; the
`s1_` lines; `answer_test_amount=`, and `s2_test_apply_exit=` if you re-applied; for `fired`, the three
`answer_mail_` lines, the `s4_` lines with `answer_lock_branch=`, the `s5_` lines and
`s6_second_plan_exit=`; and in every outcome `s7_logs_removed=yes`. Do not paste your address.

## Not yet observed

Nobody has applied this root yet. Each statement below is something this runbook relies on and that
has not been seen. It moves to "Observations", with its date, once the step named beside it has shown
it.

| Statement                                                                                                                        | Checked by                                                                |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| An untracked `backend_override.tf` holding a local backend overrides the S3 block of `backend.tf`                                | Step 2, item 6                                                            |
| Terraform holds the state lock while an apply waits at its approval prompt                                                       | Step 6, item 9; if not seen there, Step 7, item 4                         |
| The plan role's deny shows as an explicit deny in the policy simulator                                                           | Step 5, item 8                                                            |
| The policy simulator accepts the `--context-entries` form for a list prefix                                                      | Step 5, item 8                                                            |
| The actual alert of the budget reaches the operator's mailbox, and how long it takes after the spend passes the threshold        | Step 7, item 3                                                            |
| A forecast alert fires (AWS documents that it needs about five weeks of usage data, so it is not expected in the first month)    | A later stage of the deployment work                                      |
| AWS accepts a budget limit below 1 USD as a test amount                                                                          | Step 7, item 2                                                            |
| The spend of a quiet account, such as the hosted zone's monthly charge, shows in the budget's computed spend within a day or two | Step 6, item 10, and Step 7, item 1                                       |
| An account holds one OIDC provider per URL, so a second create for GitHub's URL fails                                            | Step 1, item 4, shows whether one exists; if it does, the root imports it |
| The AWS-managed read-only policy lets a plan of the pipeline root read all it must                                               | A later stage of the deployment work                                      |
| A refused list call for the prefix `env:/` does not stop a plan or an apply of the pipeline root                                 | A later stage of the deployment work                                      |
| A workflow can assume the plan role and the deploy role, and a token with a wrong subject is refused                             | A later stage of the deployment work                                      |
| A second push of one image tag to the registry is refused                                                                        | A later stage of the deployment work                                      |

## Observations

| Date (UTC) | Observation |
| ---------- | ----------- |
