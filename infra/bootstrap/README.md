# Bootstrap root: runbook

This root holds what every other root rests on: the bucket all Terraform state lives in, the image
registry, the monthly cost budget, the GitHub OIDC provider with the plan role and the deploy role
that workflows assume, and the execution role of the frontend's ECS task. It is applied by hand, by an
operator signed in with administrator rights, and never by a workflow. Its first apply runs with local
state, because the bucket its backend names does not exist yet; the state is then migrated into that
bucket.

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

Step 8  the frontend execution role: one additive apply, once the frontend's parameters exist

Step 9  the deploy role's permissions, the id conditions and the plan role's lock: plan, simulator,
        CloudTrail cross-check, then one apply and its read-back
```

Steps 3 to 6 are one sitting. Step 7 can take a day or more and runs alongside the other roots. Steps 8
and 9 are one sitting each.

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
- Step 9 departs from the item numbering: its item 1 prints lines beginning `s9_`, and items 2 to 6
  print `s9a_` (the plan's counts and addresses), `s9b_` (the simulator's decisions), `s9c_` (the
  CloudTrail cross-check), `s9d_` (the apply) and `s9e_` (the read-back), and item 7 prints
  `s9_logs_removed=`. Its address lines name resources, and its condition lines name the trusts'
  claims, which are public; neither holds a secret.

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

5. The assert mode, which exits 1 when any IAM user carries an inline policy. Like the inventory of
   item 4, it reads the caller first and exits 1 without reading any list when the caller is not in
   `471112560111` (`OPENVAA_ACCOUNT_ID`), so a status of 0 is about that account:

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

11. Last item, also when you stop early or a command failed. Paste the lines of items 3 to 10 first:
    this item removes the logs they came from, and a line not yet copied cannot be printed again.

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
   inventory's assert mode that no role or user under the path `/openvaa/` carries an inline policy.
   That mode does not judge attached policies, which the two `_attached` lines read:

   ```bash
   echo "s7_registry=$(aws ecr describe-repositories --region eu-north-1 --repository-names openvaa-frontend --query 'repositories[0].[repositoryName,imageTagMutability]' --output text | tr '\t' ',')"
   echo "s7_oidc_providers=$(aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text | tr '\t' ',')"
   echo "s7_plan_inline_count=$(aws iam list-role-policies --role-name openvaa-plan --query 'length(PolicyNames)' --output text)"
   echo "s7_deploy_inline_count=$(aws iam list-role-policies --role-name openvaa-staging-deploy --query 'length(PolicyNames)' --output text)"
   echo "s7_plan_attached=$(aws iam list-attached-role-policies --role-name openvaa-plan --query 'sort(AttachedPolicies[].PolicyName)' --output text | tr '\t' ',')"
   echo "s7_deploy_attached=$(aws iam list-attached-role-policies --role-name openvaa-staging-deploy --query 'sort(AttachedPolicies[].PolicyName)' --output text | tr '\t' ',')"
   ../scripts/account-inventory.sh --assert-no-inline-under /openvaa/ > "$L/s7.log" 2>&1; echo "s7_assert_no_inline_exit=$?"
   ```

   Expected: `s7_registry=openvaa-frontend,IMMUTABLE`, one provider for
   `token.actions.githubusercontent.com`, both inline counts 0,
   `s7_plan_attached=ReadOnlyAccess,openvaa-plan-deny,openvaa-plan-lock`,
   `s7_deploy_attached=openvaa-ecr-push,openvaa-tfstate-staging-aws` and `s7_assert_no_inline_exit=0`.

   After Step 9 the attached lines read `s7_plan_attached=ReadOnlyAccess,openvaa-plan-deny` and
   `s7_deploy_attached=` the eleven policies item 6 of Step 9 lists.

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

   (a) The plan role, reads of state, one call per resource. Given two resources in one call, the
   simulator returns one result per action and not one per resource.

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names s3:GetObject --resource-arns "arn:aws:s3:::$B/hand/staging/supabase/terraform.tfstate" --query "$Q" --output text | sed 's/^/s8a_decision=/'
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names s3:GetObject --resource-arns "arn:aws:s3:::$B/$K" --query "$Q" --output text | sed 's/^/s8a_decision=/'
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names s3:GetObject --resource-arns "arn:aws:s3:::$B/env:/x/hand/staging/supabase/terraform.tfstate" --query "$Q" --output text | sed 's/^/s8a_decision=/'
   ```

   (b) The plan role, secret reads and data reads:

   ```bash
   aws iam simulate-principal-policy --policy-source-arn "$PLAN_ROLE" --action-names secretsmanager:GetSecretValue kms:Decrypt dynamodb:GetItem logs:GetLogEvents --query "$Q" --output text | sed 's/^/s8b_decision=/'
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

   Expected for the plan role: `explicitDeny` for the object under `hand/`, `allowed` for the
   object under `pipeline/` and `explicitDeny` for the workspace object under `env:/` in (a), `explicitDeny` four times in (b), `allowed` three times in (c), and
   `allowed` in both lines of (d). Expected for the deploy role: `allowed` twice in (e), `allowed`
   three times in (f), `allowed` in `s8g1_decision` and `implicitDeny` in `s8g2_decision`, and
   `implicitDeny` in (h).

   After Step 9 the plan role holds no lock write: (c) reads `allowed` for `s3:GetObject`, which
   the read-only policy grants, and `implicitDeny` for `s3:PutObject` and `s3:DeleteObject`.

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
   On 2026-10-25 the last field of both notification lines read `None` instead of `PERCENTAGE`,
   while the configuration sets `PERCENTAGE` and the plan of item 6 showed no change. Read `None`
   there as the same result, provided item 6 exits 0.

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
spend is of a kind the budget counts; then run this step again. The AWS Budgets console shows whether
the alert has been triggered, which tells a mail that was not sent from one that was not delivered. On
2026-10-23 the console showed the actual alert as triggered while no mail arrived, because the
address had not been confirmed: check that the address you give can receive mail.

Return: `answer_outcome=fired`, `answer_outcome=no-alert-can-fire` or `answer_outcome=no-mail`; the
`s1_` lines; `answer_test_amount=`, and `s2_test_apply_exit=` if you re-applied; for `fired`, the three
`answer_mail_` lines, the `s4_` lines with `answer_lock_branch=`, the `s5_` lines and
`s6_second_plan_exit=`; and in every outcome `s7_logs_removed=yes`. Do not paste your address.

## Step 8: The frontend execution role

This step adds the execution role of the frontend's ECS task to this root: the identity the ECS agent
uses to pull the image, write the container's logs and read the task's parameters. It comes from the
`frontend_task_role` module and creates five resources: the role, the resource that keeps it free of
an inline policy, the policy that reads the parameters, and the two attachments. The role reads the
parameters under `/openvaa/<frontend_environment>/frontend/` only, and decrypts them with the SSM key
only through SSM. The apply only adds; nothing this root already holds changes.

**Precondition: the frontend's parameters exist.** Create them first, from the staging AWS root's
runbook (`infra/envs/staging/aws/README.md`), its parameter step. The policy names the AWS-managed
key `alias/aws/ssm`, which AWS creates only when a SecureString parameter first uses it; before then
the plan of item 2 fails on reading that key.

Run the step in one sitting. Every named line it prints begins `s8_`. Begin with these lines, from the
repository root, signed in. Leave the export of the address out if your shell profile already exports
`TF_VAR_alert_email`, or if you track the address.

```bash
cd infra/bootstrap
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-bootstrap.XXXXXX")
export TF_VAR_alert_email='<your-address>'
printenv TF_VAR_alert_email > /dev/null; echo "s8_alert_set_exit=$?"
```

`s8_alert_set_exit` must read 0. The check is `printenv`, not `test -n`: a variable set in the shell
but not exported passes `test -n`, yet Terraform does not see it and the plan fails with
`No value for required variable` for `alert_email`. If it reads 1, export the variable and run the
check again.

1. Initialise, which installs the new module. The lock file is read, never changed:

   ```bash
   terraform init -input=false -no-color -lockfile=readonly > "$L/s8-init.log" 2>&1; echo "s8_init_exit=$?"
   ```

2. Plan, print the plan's summary line, and print every planned address with its action. The
   addresses are read from the saved plan as JSON, so no attribute value is printed. Status 2 means
   changes, which is expected here; 0 means no change and 1 an error.

   ```bash
   terraform plan -input=false -no-color -out=tfplan -detailed-exitcode > "$L/s8-plan.log" 2>&1; echo "s8_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s8-plan.log" | sed 's/^/s8_plan_line=/'
   terraform show -json tfplan > "$L/s8-plan.json" 2> "$L/s8-show.err"; echo "s8_show_exit=$?"
   jq -r '.resource_changes[] | select(.change.actions != ["no-op"]) | "s8_planned=\(.change.actions | join("-")) \(.address)"' "$L/s8-plan.json"
   ```

3. Read the lines of item 2 against the stop rule.

   > **Apply only when `s8_plan_exit=2`, `s8_plan_line` reads
   > `Plan: 5 to add, 0 to change, 0 to destroy.`, and there are five `s8_planned=` lines, each
   > `s8_planned=create module.frontend_task_role.<resource>`.** Any other line means the plan touches
   > something this step does not add: a role, a policy, the bucket or the budget. Then do not apply.
   > Remove the saved plan with `rm -f tfplan`, run item 7, paste the lines and stop.

4. Apply the saved plan:

   ```bash
   terraform apply -input=false -no-color tfplan > "$L/s8-apply.log" 2>&1; echo "s8_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s8-apply.log" | sed 's/^/s8_apply_line=/'
   ```

5. Plan again. It must exit 0, which means no change:

   ```bash
   terraform plan -input=false -no-color -detailed-exitcode > "$L/s8-second.log" 2>&1; echo "s8_second_plan_exit=$?"
   ```

6. The role's ARN, which the staging AWS root takes as `execution_role_arn`. It is not a secret:

   ```bash
   echo "s8_role_arn=$(terraform output -raw frontend_execution_role_arn)"
   ```

7. Last item, also when you stop early or a command failed. Paste the lines of items 1 to 6 first:
   this item removes the logs they came from.

   ```bash
   rm -f tfplan
   test -n "$L" && rm -rf "$L" && echo "s8_logs_removed=yes"
   ```

Return: every `s8_` line, in order. Do not paste your address.

## Step 9: The deploy role's permissions, the id conditions and the plan role's lock

This step applies four changes to the `github_oidc` module in one apply:

- the deploy role's nine `openvaa-deploy-*` policies, which let a pipeline plan, apply and destroy
  the staging AWS root, and `ecr:DescribeImages` in the image push policy;
- the numeric id conditions `repository_id` and `repository_owner_id` on both trusts;
- the subject of the `staging-destroy` environment in the deploy trust;
- the removal of the plan role's lock policy, `openvaa-plan-lock`, so that the plan role is
  read-only and plans without the lock.

The policies are proved before they exist. The simulator evaluates their rendered text, read from
the saved plan. CloudTrail then lists the calls Terraform made when it destroyed and re-applied
that root on 2026-11-14, and every one of those calls must be one the rendered policies allow.
Only then is the saved plan applied. The apply changes IAM only, and another hand apply of this root
undoes it.

Run the step in one sitting. Item 1 prints lines beginning `s9_`, and items 2 to 6 print lines
beginning `s9a_` to `s9e_`, one letter per item. The blocks run in zsh as well as in bash. A
variable directly before a colon is written in braces, as in `${A}:role`, because zsh reads `$A:r`
as `$A` with its `:r` modifier and drops the colon and the letter after it. Sign in first with
`aws sso login --profile openvaa-admin`. In item 1, leave the export of the address out if your
shell profile already exports `TF_VAR_alert_email`, or if you track the address.

1. The opening lines, the account check and the alert address:

   ```bash
   cd "$(git rev-parse --show-toplevel)"
   unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
   export LC_ALL=C AWS_PAGER="" AWS_PROFILE=openvaa-admin \
     AWS_REGION=eu-north-1 \
     TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
   L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-bootstrap.XXXXXX")
   ACCOUNT=$(aws sts get-caller-identity --query Account \
     --output text 2> "$L/account.err")
   echo "s9_account_read_exit=$?"
   test "$ACCOUNT" = 471112560111; echo "s9_account_match_exit=$?"
   cd infra/bootstrap
   B=openvaa-tfstate-471112560111
   export TF_VAR_alert_email='<your-address>'
   printenv TF_VAR_alert_email > /dev/null; echo "s9_alert_set_exit=$?"
   ```

   All three lines must read 0. A read that is not 0 is an expired session: sign in again and run
   this item again. A match that is not 0 is another account: stop. The alert check is `printenv`
   for the reason given in Step 8.

2. Initialise, plan into a saved file, and read the plan's changes from its JSON. The addresses are
   read from the JSON, so no attribute value is printed. The plan exits 2, which means changes.

   ```bash
   terraform init -input=false -no-color -lockfile=readonly \
     > "$L/s9a-init.log" 2>&1; echo "s9a_init_exit=$?"
   terraform plan -input=false -no-color -out=tfplan \
     -detailed-exitcode > "$L/s9a-plan.log" 2>&1
   echo "s9a_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s9a-plan.log" \
     | sed 's/^/s9a_plan_line=/'
   P="$L/s9a-plan.json"
   terraform show -json tfplan > "$P" 2> "$L/s9a-show.err"
   echo "s9a_show_exit=$?"
   ```

   Then the counts by action, the address lists, and a comparison with the expected set. A change
   that replaces a resource has two actions and is counted by `s9a_replace`:

   ```bash
   count() {
     jq --arg a "$1" '[.resource_changes[]
       | select(.mode == "managed" and .change.actions == [$a])]
       | length' "$P"
   }
   addresses() {
     jq -r --arg a "$1" --arg n "$2" '.resource_changes[]
       | select(.mode == "managed" and .change.actions == [$a])
       | "s9a_\($n)_address=\(.address)"' "$P"
   }
   echo "s9a_add=$(count create)"
   echo "s9a_change=$(count update)"
   echo "s9a_destroy=$(count delete)"
   n=$(jq '[.resource_changes[]
     | select((.change.actions | length) > 1)] | length' "$P")
   echo "s9a_replace=$n"
   addresses create add
   addresses update change
   addresses delete destroy
   G=module.github_oidc
   {
     for c in alert dns ecs edge load_balancing network \
       observability pass_role scaling; do
       echo "create $G.aws_iam_policy.deploy_$c"
       echo "create $G.aws_iam_role_policy_attachment.deploy_$c"
     done
     for a in aws_iam_role.plan aws_iam_role.deploy \
       aws_iam_policy.ecr_push; do
       echo "update $G.$a"
     done
     echo "delete $G.aws_iam_policy.plan_lock"
     echo "delete $G.aws_iam_role_policy_attachment.plan_lock"
   } | sort > "$L/s9a-expected.txt"
   jq -r '.resource_changes[]
     | select(.mode == "managed" and .change.actions != ["no-op"])
     | "\(.change.actions | join("-")) \(.address)"' "$P" \
     | sort > "$L/s9a-actual.txt"
   cmp -s "$L/s9a-expected.txt" "$L/s9a-actual.txt"
   echo "s9a_addresses_match_exit=$?"
   ```

   > **Go on only when `s9a_plan_exit=2`, `s9a_plan_line` reads
   > `Plan: 18 to add, 3 to change, 2 to destroy.`, `s9a_add=18`, `s9a_change=3`, `s9a_destroy=2`,
   > `s9a_replace=0` and `s9a_addresses_match_exit=0`.** The 18 added are the nine
   > `aws_iam_policy.deploy_*` and their nine `aws_iam_role_policy_attachment.deploy_*`, the 3
   > changed in place are `aws_iam_role.plan` and `aws_iam_role.deploy` (their trusts) and
   > `aws_iam_policy.ecr_push`, and the 2 destroyed are `aws_iam_policy.plan_lock` and its
   > attachment, every one under `module.github_oidc`. Any other plan touches something this step
   > does not change: the bucket, the registry, the budget or the execution role. Then do not apply:
   > run item 7, paste the lines and stop.

3. The simulator, on the policies the deploy role will hold, before any of them exists. The eleven
   documents are read from the plan's `after` values: the nine new ones, the image push policy as it
   will be, and the unchanged state policy. Each case passes all eleven, so a refused case is
   refused by the whole set and not by one policy alone. The context entries stand in for the tags
   and the record names that the conditions test.

   ```bash
   jq --arg g "$G" '[.resource_changes[]
     | select(.mode == "managed" and .module_address == $g
         and .type == "aws_iam_policy" and .change.after != null
         and (.name | test("^(deploy_.+|tfstate_pipeline|ecr_push)$")))
     | .change.after.policy]' "$P" > "$L/s9b-policies.json"
   n=$(jq '[.[] | strings] | length' "$L/s9b-policies.json")
   echo "s9b_policies=$n"
   Q='EvaluationResults[].[EvalActionName,EvalResourceName,EvalDecision]'
   kv() {
     jq -n --arg k "$1" --arg t "$2" --arg v "$3" \
       '{ContextKeyName: $k, ContextKeyType: $t, ContextKeyValues: [$v]}'
   }
   sim() {
     label=$1 action=$2 resource=$3
     shift 3
     printf '%s\n' "$@" | jq -s . > "$L/s9b-$label-context.json"
     jq -n --slurpfile p "$L/s9b-policies.json" \
       --slurpfile c "$L/s9b-$label-context.json" \
       --arg a "$action" --arg r "$resource" \
       '{PolicyInputList: $p[0], ActionNames: [$a],
         ResourceArns: [$r], ContextEntries: $c[0]}' \
       > "$L/s9b-$label-input.json"
     aws iam simulate-custom-policy \
       --cli-input-json "file://$L/s9b-$label-input.json" \
       --query "$Q" --output text > "$L/s9b-$label.out" 2> "$L/s9b-$label.err"
     echo "s9b_${label}_exit=$?"
     tr '\t' ' ' < "$L/s9b-$label.out" | sed -e 's|:hostedzone/|:hostedzone |' -e 's/^/s9b_decision=/'
   }
   ```

   Then the cases, an allowed and a refused one for each concern, and the same pair for a subnet
   created in a VPC. EC2 evaluates the VPC of that create with the VPC's own tags and without the
   request's tags, so the allowed subnet case passes the VPC's tags alone, and the refused one passes
   the request's tags on a VPC that carries none. The edge cases show that a tag call reaches only a
   distribution or certificate that already carries the root's tags: the foreign cases pass the
   request's tags on a resource that carries none, which is how the role would otherwise take over a
   resource of another owner. The simulator evaluates only the entries it is given, so the context
   EC2, CloudFront and ACM really build is first seen by the pipeline's deploy from nothing after the
   destroy:

   ```bash
   A=471112560111
   R=eu-north-1:$A
   TAG_P=$(kv aws:RequestTag/Project string openvaa)
   TAG_R=$(kv aws:RequestTag/Root string aws)
   ZONE=arn:aws:route53:::hostedzone/Z02494181MAM7OCUAIPKC
   TYPES=route53:ChangeResourceRecordSetsRecordTypes
   NAMES=route53:ChangeResourceRecordSetsNormalizedRecordNames
   EXEC=arn:aws:iam::${A}:role/openvaa/openvaa-staging-frontend-execution
   TOPIC=arn:aws:sns:${R}:openvaa-staging-frontend-deployments
   sim vpc_tagged ec2:CreateVpc \
     "arn:aws:ec2:${R}:vpc/vpc-00000000000000000" "$TAG_P" "$TAG_R"
   sim vpc_untagged ec2:CreateVpc \
     "arn:aws:ec2:${R}:vpc/vpc-00000000000000000"
   OWN_P=$(kv aws:ResourceTag/Project string openvaa)
   OWN_R=$(kv aws:ResourceTag/Root string aws)
   sim subnet_in_tagged_vpc ec2:CreateSubnet \
     "arn:aws:ec2:${R}:vpc/vpc-00000000000000000" "$OWN_P" "$OWN_R"
   sim subnet_in_foreign_vpc ec2:CreateSubnet \
     "arn:aws:ec2:${R}:vpc/vpc-00000000000000000" "$TAG_P" "$TAG_R"
   sim dns_a route53:ChangeResourceRecordSets "$ZONE" \
     "$(kv "$TYPES" stringList A)" \
     "$(kv "$NAMES" stringList staging.openvaa.org)"
   sim dns_mx route53:ChangeResourceRecordSets "$ZONE" \
     "$(kv "$TYPES" stringList MX)" \
     "$(kv "$NAMES" stringList staging.openvaa.org)"
   sim pass_ecs iam:PassRole "$EXEC" \
     "$(kv iam:PassedToService string ecs-tasks.amazonaws.com)"
   sim pass_lambda iam:PassRole "$EXEC" \
     "$(kv iam:PassedToService string lambda.amazonaws.com)"
   CF=arn:aws:cloudfront::${A}:distribution
   CERT=arn:aws:acm:us-east-1:${A}:certificate/00000000-0000-0000-0000-000000000000
   sim create_distribution cloudfront:CreateDistribution "*" "$TAG_P" "$TAG_R"
   sim tag_owned_distribution cloudfront:TagResource "$CF/EOWNED0000000" \
     "$OWN_P" "$OWN_R" "$TAG_P" "$TAG_R"
   sim tag_foreign_distribution cloudfront:TagResource \
     "$CF/EFOREIGN000000" "$TAG_P" "$TAG_R"
   sim tag_foreign_certificate acm:AddTagsToCertificate "$CERT" \
     "$TAG_P" "$TAG_R"
   DOMAINS=acm:DomainNames
   IN_US=$(kv aws:RequestedRegion string us-east-1)
   sim cert_viewer acm:RequestCertificate "*" "$TAG_P" "$TAG_R" "$IN_US" \
     "$(kv "$DOMAINS" stringList staging.openvaa.org)"
   sim cert_other_name acm:RequestCertificate "*" "$TAG_P" "$TAG_R" \
     "$IN_US" "$(kv "$DOMAINS" stringList other.openvaa.org)"
   sim publish_topic sns:Publish "$TOPIC"
   sim publish_other sns:Publish "arn:aws:sns:${R}:openvaa-other"
   sim hand_state s3:GetObject \
     "arn:aws:s3:::$B/hand/staging/supabase/terraform.tfstate"
   ```

   > **Go on only when `s9b_policies=11`, every `s9b_<case>_exit` reads 0, there are seventeen
   > `s9b_decision=` lines, and they read:** `allowed` for `ec2:CreateVpc` with the tags,
   > `ec2:CreateSubnet` in the tagged VPC, `cloudfront:CreateDistribution` with the tags,
   > `cloudfront:TagResource` on the owned distribution, `acm:RequestCertificate` of
   > `staging.openvaa.org`, `ChangeResourceRecordSets` of the A record, `iam:PassRole` to ECS tasks
   > and `sns:Publish` on the deployment topic; `implicitDeny` for `ec2:CreateVpc` without the tags,
   > `ec2:CreateSubnet` in the untagged VPC, `cloudfront:TagResource` on the foreign distribution,
   > `acm:AddTagsToCertificate` on the foreign certificate, `acm:RequestCertificate` of another name,
   > the MX record, `iam:PassRole` to Lambda, `sns:Publish` on another topic and `s3:GetObject` of
   > the Supabase root's state under `hand/`. **A refused case that reads `allowed` means stop**: a policy is
   > wider than its scope, and it is corrected in the module before anything is applied. An allowed
   > case that reads a deny stops the step too, because the pipeline's apply would fail on it. In
   > either case run item 7, paste the lines and stop. If a call fails, do not paste its error text,
   > which names your session.

4. The CloudTrail cross-check. Event history holds 90 days of management events per region. The
   staging AWS root was destroyed on 2026-11-14 from 09:49Z to about 09:54Z, after its destroy plan,
   and re-applied from 18:08Z to 18:12Z, followed by a second plan. Its viewer certificate and
   distribution are called through `us-east-1`, everything else through `eu-north-1`. The destroy
   window opens at 09:47Z: the read-only plan of the `dns-mail` root ran at 09:46Z, and its calls are
   not the AWS root's.

   ```bash
   for r in eu-north-1 us-east-1; do
     for w in 09:47:00Z,10:00:00Z 18:00:00Z,18:20:00Z; do
       s=${w%,*} e=${w#*,}
       f="$L/s9c-trail-$r-${s%%:*}"
       aws cloudtrail lookup-events --region "$r" \
         --start-time "2026-11-14T$s" --end-time "2026-11-14T$e" \
         --output json > "$f.json" 2> "$f.err"
       echo "s9c_lookup=$r $s exit=$?"
     done
   done
   ```

   Each event is kept when its `userAgent` names Terraform, and turned into an IAM action:
   `<service>:<eventName>`, the service from `eventSource` before `.amazonaws.com` (CloudWatch's
   `monitoring` is the prefix `cloudwatch`), with a trailing API date such as `2020_05_31` removed
   from the name. Application Auto Scaling logs its calls under `autoscaling.amazonaws.com`, the
   event source of EC2 Auto Scaling, while its IAM prefix is `application-autoscaling`, so its event
   names, listed in `$aas`, take that prefix. Each distinct action is then compared with every action
   the eleven rendered policies allow, case-insensitively, a trailing `*` matching as a prefix. Two
   calls need no IAM permission and are left out: `sts:GetCallerIdentity`, and
   `sso:GetRoleCredentials`, by which a Terraform signed in with an SSO profile fetches its
   credentials with the portal's access token. The pipeline assumes its role through OIDC and never
   makes the second.

   ```bash
   jq -s '
     ["RegisterScalableTarget", "DeregisterScalableTarget",
       "DescribeScalableTargets", "DescribeScalingPolicies",
       "DescribeScalingActivities", "DescribeScheduledActions",
       "PutScalingPolicy", "DeleteScalingPolicy", "PutScheduledAction",
       "DeleteScheduledAction", "TagResource", "UntagResource",
       "ListTagsForResource"] as $aas
     | [.[].Events[].CloudTrailEvent | fromjson
     | select((.userAgent // "") | test("Terraform"))
     | (.eventName | sub("[0-9]{4}_[0-9]{2}_[0-9]{2}$"; "")) as $n
     | (.eventSource | sub("\\.amazonaws\\.com$"; "")
         | if . == "monitoring" then "cloudwatch"
           elif . == "autoscaling" and any($aas[]; . == $n)
           then "application-autoscaling"
           else . end)
       + ":" + $n]' \
     "$L"/s9c-trail-*.json > "$L/s9c-calls.json"
   echo "s9c_events=$(jq length "$L/s9c-calls.json")"
   echo "s9c_actions=$(jq 'unique | length' "$L/s9c-calls.json")"
   jq '[.[] | fromjson | .Statement[] | select(.Effect == "Allow")
     | .Action | if type == "string" then [.] else . end | .[]
     | ascii_downcase] | unique' "$L/s9b-policies.json" \
     > "$L/s9c-allowed.json"
   jq -r --slurpfile a "$L/s9c-allowed.json" '
     unique | .[]
     | select(ascii_downcase
         | . != "sts:getcalleridentity" and . != "sso:getrolecredentials")
     | . as $c | ($c | ascii_downcase) as $l
     | select(any($a[0][]; . as $p
         | if ($p | endswith("*")) then ($l | startswith($p[:-1]))
           else $l == $p end) | not)
     | "s9c_uncovered=\($c)"' "$L/s9c-calls.json" \
     > "$L/s9c-uncovered.txt"
   echo "s9c_compare_exit=$?"
   cat "$L/s9c-uncovered.txt"
   echo "s9c_uncovered_count=$(wc -l < "$L/s9c-uncovered.txt" | tr -d ' ')"
   ```

   > **Go on only when all four `s9c_lookup=` lines read `exit=0`, `s9c_events` is above 0,
   > `s9c_compare_exit=0`, no `s9c_uncovered=` line is printed and `s9c_uncovered_count=0`.**
   > Each `s9c_uncovered=` line names a call Terraform made on that root that no deploy policy
   > allows: the pipeline's first apply or destroy would fail on it, so the module needs the action
   > before this apply. Then run item 7, paste the lines and stop. `s9c_events=0` means the check
   > proved nothing (the history has expired, or no event names Terraform), and is a stop as well.
   > The check compares actions, not resources or conditions: the scopes are item 3's to prove.
   > Event history holds no S3 object calls, so the backend's calls on the state are Step 5's.

   A hand run of another root inside the windows is Terraform too, and its calls show up as
   uncovered. On 2026-11-14 the `dns-mail` root read its SMTP user, its send policy and its SES
   identity at 09:55Z, which printed `iam:GetUser`, `ses:GetEmailIdentity` and six more. To tell,
   read the events of an uncovered line in your terminal, here for `iam:GetUser`:

   ```bash
   jq -r --arg n GetUser '.Events[].CloudTrailEvent | fromjson
     | select((.eventName | sub("[0-9]{4}_[0-9]{2}_[0-9]{2}$"; "")) == $n)
     | "\(.eventTime) \(.eventSource) \(.requestParameters | tojson)"' \
     "$L"/s9c-trail-*.json
   ```

   The `requestParameters` name the objects the call read or wrote. A line is another root's only
   when every one of its events names that root's objects: the AWS root holds no IAM user, no IAM
   policy and no SES resource, so `dns-mail`'s are recognisable by their names. Paste the action
   with a `note:` line naming the root and its objects, not the parameters themselves. Every other
   `s9c_uncovered=` line stops the step as above.

5. Apply the saved plan, then plan again. The second plan must exit 0, which means no change:

   ```bash
   terraform apply -input=false -no-color tfplan \
     > "$L/s9d-apply.log" 2>&1; echo "s9d_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s9d-apply.log" \
     | sed 's/^/s9d_apply_line=/'
   rm -f tfplan
   terraform plan -input=false -no-color -detailed-exitcode \
     > "$L/s9d-second.log" 2>&1; echo "s9d_second_plan_exit=$?"
   ```

   Expected: `s9d_apply_exit=0`,
   `s9d_apply_line=Apply complete! Resources: 18 added, 3 changed, 2 destroyed.` and
   `s9d_second_plan_exit=0`.

6. The read-back: the policies attached to both roles, both trusts' conditions, the state bucket,
   and the inventory's two asserts.

   ```bash
   for role in plan:openvaa-plan deploy:openvaa-staging-deploy; do
     who=${role%%:*}
     aws iam list-attached-role-policies --role-name "${role#*:}" \
       --query 'sort(AttachedPolicies[].PolicyName)' --output text \
       > "$L/s9e-$who-policies.txt" 2> "$L/s9e-$who-policies.err"
     echo "s9e_${who}_policies_exit=$?"
     tr '\t' '\n' < "$L/s9e-$who-policies.txt" \
       | sed "s/^/s9e_${who}_policy=/"
     aws iam get-role --role-name "${role#*:}" \
       --query Role.AssumeRolePolicyDocument --output json \
       > "$L/s9e-$who-trust.json" 2> "$L/s9e-$who-trust.err"
     echo "s9e_${who}_trust_exit=$?"
     jq -r --arg n "$who" '.Statement[].Condition | to_entries[]
       | .key as $t | .value | to_entries[]
       | (.key | sub("^token\\.actions\\.githubusercontent\\.com:"; ""))
         as $k
       | (.value | if type == "string" then [.] else . end)[]
       | "s9e_\($n)_condition=\($t) \($k) \(.)"' "$L/s9e-$who-trust.json"
   done
   aws s3api get-bucket-encryption --bucket "$B" --output json \
     > "$L/s9e-encryption.json" 2> "$L/s9e-encryption.err"
   echo "s9e_bucket_encryption_exit=$?"
   aws s3api get-bucket-versioning --bucket "$B" --output json \
     > "$L/s9e-versioning.json" 2> "$L/s9e-versioning.err"
   echo "s9e_bucket_versioning_exit=$?"
   aws s3api get-public-access-block --bucket "$B" --output json \
     > "$L/s9e-blocks.json" 2> "$L/s9e-blocks.err"
   echo "s9e_bucket_blocks_exit=$?"
   n=$(jq -r '.ServerSideEncryptionConfiguration.Rules[0]
     | .ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
     "$L/s9e-encryption.json")
   echo "s9e_bucket_encryption=$n"
   echo "s9e_bucket_versioning=$(jq -r .Status "$L/s9e-versioning.json")"
   n=$(jq '[.PublicAccessBlockConfiguration[] | select(. == true)]
     | length' "$L/s9e-blocks.json")
   echo "s9e_bucket_public_blocks=$n"
   ../scripts/account-inventory.sh --assert-no-inline-user-policies \
     > "$L/s9e-users.log" 2>&1; echo "s9e_assert_users_exit=$?"
   ../scripts/account-inventory.sh --assert-no-inline-under /openvaa/ \
     > "$L/s9e-under.log" 2>&1; echo "s9e_assert_no_inline_exit=$?"
   ```

   Expected:
   - every `_exit` line 0;
   - two `s9e_plan_policy=` lines, `ReadOnlyAccess` and `openvaa-plan-deny`;
   - eleven `s9e_deploy_policy=` lines: `openvaa-deploy-alert`, `openvaa-deploy-dns`,
     `openvaa-deploy-ecs`, `openvaa-deploy-edge`, `openvaa-deploy-load-balancing`,
     `openvaa-deploy-network`, `openvaa-deploy-observability`, `openvaa-deploy-pass-role`,
     `openvaa-deploy-scaling`, `openvaa-ecr-push` and `openvaa-tfstate-staging-aws`;
   - `s9e_deploy_condition=` lines, each `StringEquals`, for `aud sts.amazonaws.com`, for
     `sub repo:OpenVAA/voting-advice-application:environment:staging` and
     `sub repo:OpenVAA/voting-advice-application:environment:staging-destroy`, for
     `repository_id 546467466` and for `repository_owner_id 115159211`;
   - `s9e_plan_condition=` lines for `aud`, `sub repo:OpenVAA/voting-advice-application:pull_request`
     and the same two ids;
   - `s9e_bucket_encryption=AES256`, `s9e_bucket_versioning=Enabled` and
     `s9e_bucket_public_blocks=4`;
   - `s9e_assert_users_exit=0` and `s9e_assert_no_inline_exit=0`.

7. Last item, also when you stop early or a command failed. Paste the lines of items 1 to 6 first:
   this item removes the logs they came from.

   ```bash
   rm -f tfplan
   test -n "$L" && rm -rf "$L" && echo "s9_logs_removed=yes"
   ```

Return: every `s9_` and `s9a_` to `s9e_` line, in order, and `answer_step9=applied` or
`answer_step9=stopped-at-<item>`. Do not paste your address.

## Not yet observed

This root was first applied on 2026-10-21. Each statement below is something this runbook relies on and that
has not been seen. It moves to "Observations", with its date, once the step named beside it has shown
it.

| Statement                                                                                                                        | Checked by                                                                |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| The actual alert of the budget reaches the operator's mailbox, and how long it takes after the spend passes the threshold        | Step 7, item 3                                                            |
| A forecast alert fires (AWS documents that it needs about five weeks of usage data, so it is not expected in the first month)    | A later stage of the deployment work                                      |
| AWS accepts a budget limit below 1 USD as a test amount                                                                          | Step 7, item 2                                                            |
| The spend of a quiet account, such as the hosted zone's monthly charge, shows in the budget's computed spend within a day or two | Step 6, item 10, and Step 7, item 1                                       |
| An account holds one OIDC provider per URL, so a second create for GitHub's URL fails                                            | Step 1, item 4, shows whether one exists; if it does, the root imports it |
| The AWS-managed read-only policy lets a plan of the pipeline root read all it must                                               | A later stage of the deployment work                                      |
| A refused list call for the prefix `env:/` does not stop a plan or an apply of the pipeline root                                 | A later stage of the deployment work                                      |
| A workflow can assume the plan role and the deploy role, and a token with a wrong subject is refused                             | The first deploy workflow run (`infra/README.md` § The deploy pipeline)   |
| AWS evaluates the claims `repository_id` and `repository_owner_id` in a trust condition once they are set                        | The first deploy workflow run (`infra/README.md` § The deploy pipeline)   |
| The deploy role's policies hold every call a pipeline plan, apply and destroy of the AWS root makes                              | The first pipeline deploy and destroy, after Step 9 item 4                |
| A distribution or certificate created with the root's tags passes the edge tag calls' `aws:ResourceTag` test                     | The first pipeline deploy from nothing, after the real destroy            |

## Observations

| Date (UTC) | Observation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-21 | Step 1 inventory run: 2 IAM users found; 1 carried an inline policy (yes), was converted to a managed policy, and the assert mode then exited 0. No GitHub OIDC provider, no hosted zone, no state bucket and no same-named budget, repository or IAM entity were present.                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-10-21 | Step 2: with Terraform 1.16.5, an untracked `backend_override.tf` holding a local backend overrode the S3 block of `backend.tf`, and the first apply ran on local state and created 23 resources.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-21 | Step 3: the state was migrated into the bucket and its object was read back encrypted (AES256) and versioned, with 23 managed resources, before the local files were removed; the second plan exited 0 with no changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-21 | Step 4: the bucket read back encrypted, versioned, with all four public-access blocks, not public and with a TLS-only statement; the registry has immutable tags; both roles have managed policies only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-21 | Step 5: the simulator accepted the `--context-entries` form; it showed an explicit deny for the plan role on a `hand/` state object and on secret reads, and allowed every call the S3 backend makes except the deploy role's list for `env:/`, an implicit deny as expected.                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-21 | Step 5: given two resources in one call, the simulator returns one result per action rather than one per resource, so item 8(a) makes one call per resource.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-10-21 | Step 6: Terraform held the state lock while an apply waited at its approval prompt: a second plan failed on the lock, and the lock object was present, then gone once the prompt was answered `no`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-21 | Step 6: the budget read back at the 1 USD test amount, with a computed spend of 6.475 USD.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-10-22 | Step 7, item 1: the budget read back at 1 USD with a computed spend of 6.828 USD, past the 0.80 USD threshold of its actual alert, so no lower test amount was needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-23 | Step 7, item 3: the AWS Budgets console showed the actual alert of the 1 USD budget as triggered. No mail reached the operator within two days; the operator gave the reason as an address that had not been confirmed. Delivery to the mailbox was not seen.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-25 | Step 7, items 4 to 6: the budget was replaced at 100 USD with no `-var` (one resource replaced). It read back as a monthly cost budget of 100 USD with the actual alert above 80 and the forecast alert above 100, and a second plan with no `-var` showed no change.                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-12 | Step 8: the plan exited 2 with `Plan: 5 to add, 0 to change, 0 to destroy.` and five `create` lines, each under `module.frontend_task_role` (the role, its parameters policy, the exclusive inline-policy resource and the two attachments). It was applied (exit 0, five added), and a second plan exited 0 with no change. The role's ARN equals the staging AWS root's `execution_role_arn`.                                                                                                                                                                                                                                                                                   |
| 2026-11-12 | Step 8: the plan fails with `No value for required variable` for `alert_email` when `TF_VAR_alert_email` is set in the shell but not exported (`printenv` exit 1). After the export (`printenv` exit 0) it ran; the step's opening lines now check with `printenv`, which a set but unexported variable fails, rather than `test -n`, which it passes.                                                                                                                                                                                                                                                                                                                            |
| 2026-11-12 | The policy simulator, run from the staging AWS root's read-back of the role, allows the execution role `ssm:GetParameters` under `/openvaa/staging/frontend/` and gives `implicitDeny` under `/openvaa/staging/other/`; the role has no inline policy, and both inventory asserts exit 0.                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-12 | A second push of one image tag to the registry is refused: a different image pushed under the existing tag `712947a1bd44a735f66ee8f51610f4748d76cd30` failed, exit 1, with `tag invalid: The image tag '…' already exists in the 'openvaa-frontend' repository and cannot be overwritten because the tag is immutable.`, and the tag kept its digest (staging AWS runbook, Step 4, items 8 and 9).                                                                                                                                                                                                                                                                                |
| 2026-11-16 | Step 9, item 2: a first plan, run with an alert address other than the one the budget holds, read `s9a_change=4`, the fourth change being `module.budget.aws_budgets_budget.monthly`, and `s9a_addresses_match_exit=1`; it was not applied. Rerun with the budget's address, the plan exited 2 with `Plan: 18 to add, 3 to change, 2 to destroy.`, no replacement and the address set as expected (`s9a_addresses_match_exit=0`): the nine `deploy_*` policies and their attachments added, both roles and `ecr_push` changed in place, `plan_lock` and its attachment destroyed.                                                                                                 |
| 2026-11-16 | Step 9, item 3: the simulator read the eleven documents from the saved plan and gave seventeen decisions, each as the step expects: allowed for the tagged VPC, the subnet in the tagged VPC, the A record, `iam:PassRole` to ECS tasks, the tagged distribution create and the tag call on the owned distribution, the certificate of `staging.openvaa.org` and the deployment topic; `implicitDeny` for the untagged VPC, the subnet in the foreign VPC, the MX record, `iam:PassRole` to Lambda, the tag calls on the foreign distribution and certificate, the certificate of another name, another topic and the Supabase root's state under `hand/`.                        |
| 2026-11-16 | Step 9, item 3, in zsh: the cases `pass_ecs`, `pass_lambda` and `tag_foreign_certificate` first exited 254 with `InvalidInput` (`ResourceNames are not in a valid ARN format`). zsh read `$A:role` and `$A:certificate` as `$A` with its `:r` and `:c` modifiers, so both ARNs lost the colon and the letter after it. Rerun with `${A}`, the three exited 0 with the expected decisions; the step now braces every variable before a colon.                                                                                                                                                                                                                                      |
| 2026-11-16 | Step 9, item 4: the four lookups exited 0 and kept 626 Terraform events, 119 distinct actions, and printed `s9c_uncovered_count=16`, none a call of the AWS root. Seven were Application Auto Scaling calls logged under `autoscaling.amazonaws.com` and granted as `application-autoscaling` in `openvaa-deploy-scaling`; eight were the `dns-mail` root's reads of its SMTP user, its send policy and its SES identity at 09:55Z on 2026-11-14; one was `sso:GetRoleCredentials`, the admin session fetching its credentials. The operator applied on that reading of the trail; the step now maps the first group, leaves out the third and tells how to recognise the second. |
| 2026-11-16 | Step 9, item 5: the saved plan applied (`Resources: 18 added, 3 changed, 2 destroyed.`), and a second plan exited 0 with no change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-16 | Step 9, item 6: the plan role holds `ReadOnlyAccess` and `openvaa-plan-deny`, the deploy role the eleven policies of the step, both trusts `StringEquals` conditions on `aud`, the subject (`pull_request` for the plan role, the `staging` and `staging-destroy` environments for the deploy role), `repository_id` and `repository_owner_id`; the state bucket read back `AES256`, versioned and with all four public-access blocks, and both inventory asserts exited 0. Assuming the roles and AWS's evaluation of the two id claims are not yet observed.                                                                                                                    |
