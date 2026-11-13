# Supabase roots: runbook

This root holds the persistent staging Supabase project and its hosted API and auth settings. The
project is created by hand in the Supabase dashboard and imported into this root. Every step of this
root is first rehearsed on a throwaway project in the root
[`../../scratch/supabase`](../../scratch/supabase), which uses the same module and keeps its state on
your workstation. Both roots are applied by hand, by an operator, and never by a workflow. This root's
state lives in the state bucket under `hand/`, which neither workflow role can read.

The overview of every root, the order of first applies and the rules that hold for every apply are in
[`../../../README.md`](../../../README.md).

## Rules of this root

- **The project is created by hand and imported, and Terraform never creates or destroys it**, because
  a project holds the database, the storage and every key, and none of them comes back once it is
  deleted.
- **A plan that shows a destroy, a replacement or a change of the database password is never
  applied**, because each of them changes what the project holds or how it is reached, and none can be
  undone by applying again.
- **A plan and its apply are two separate steps**: you make the plan, save it, paste its named lines,
  and wait for the go-ahead before you apply that saved file, because only a plan someone has read
  against these rules may be applied.
- **Any new plan goes through the same reading before it is applied**, because a new plan file is a
  different plan, even when it was made for the same change.
- **The settings resource of the module is the only writer of hosted auth settings, and the CLI's
  configuration push is used nowhere**, because a second writer would overwrite the first and a plan
  could no longer show the drift.
- **The access token and the database password are exported for one shell session and written to no
  file**, because a file outlives the session and can be committed, synced or shared.
- **Every command sends its raw output to a log directory outside the repository and prints named
  lines, and only those lines and your `answer_` lines are pasted**, because a log holds attribute
  values and resource ids, and after an import the state holds every auth setting of the project.
- **The filters the steps give drop every setting whose name ends in a secret word** (`secret`,
  `secrets`, `pass`, `passwd`, `password`, `key`, `keys`, `token` or `tokens`), by name as well as by
  value, because the name of a secret setting next to an empty or hashed value already says more than
  a public paste should.
- **A plan log, an apply log, and the output of `terraform show`, `terraform state show`,
  `terraform state pull` or `terraform output` without a name are never pasted**, because each of them
  holds the project's settings, secrets included.

## What you paste back

Every command below sends its raw output to a log file in a directory outside the repository, `$L`,
and prints named lines of the form `s<item>_<field>=<value>`. Within a step, the numbered items carry
the number that begins their named lines: item 4 prints lines beginning `s4_`. A typed answer goes on
a line of the form `answer_<name>=<text>`. Paste those lines and nothing else: nothing from a log and
nothing from the terminal's scroll-back.

- When a status line is not 0, paste the lines up to it and stop.
- If whoever asked you to run a step gave you an attempt id, the first line of your reply is
  `answer_attempt=<that id>`. A reply is recorded only for the attempt it names, so an answer given in
  an earlier sitting cannot stand in for this one.
- Never paste the access token or the database password, and never an e-mail address.

`$L` and any saved plan file (`tfplan`) hold secrets in clear text: resource ids, attribute values, and
whatever the state or the API returned. Never share, attach or paste either. The last item of each
step removes them and prints a named line; if you stop early or a command fails, run that last item
before you leave the terminal, unless whoever asked you to run the step has asked you to keep a log
for one more named line. Two steps keep `tfplan` on purpose, for the apply that follows the go-ahead,
and say so.

## Before you start

- **A dedicated Supabase organisation on a Pro plan**, in which both projects are created.
- **An access token** of an account that is a member of that organisation only (dashboard, Account,
  Access Tokens), kept in your password manager. The provider documents that it reads the token from
  the environment variable `SUPABASE_ACCESS_TOKEN`.
- **Terraform 1.16.5**, the version in `infra/.terraform-version`, and `jq`, `curl` and `shasum`. For
  the persistent project also the AWS CLI, signed in, because this root's state is in the bucket.
- **The secrets of a session.** Read the token and the database password into the shell without
  echoing them, so that they reach neither a file nor the shell's history. Run these in each sitting
  that needs them, and paste each value from your password manager when asked:

  ```bash
  printf 'access token: '; read -rs SUPABASE_ACCESS_TOKEN; echo; export SUPABASE_ACCESS_TOKEN
  printf 'database password: '; read -rs TF_VAR_database_password; echo; export TF_VAR_database_password
  ```

**The lines that begin each sitting.** A step is often resumed in a new terminal, so no command below
relies on an earlier sitting. Each step begins with the lines it needs; run them again in any new
terminal. `LC_ALL=C` keeps every number and sort order independent of your workstation's locale. Give a
time in UTC, in the form `date -u +%Y-%m-%dT%H:%MZ` prints.

## Flow overview

```
Rehearsal, in infra/envs/scratch/supabase, on the throwaway project
Step 1  the access token; the throwaway project, created by hand
Step 2  import the project and the settings; read the imported settings through the filter
Step 3  the first plan, saved and pasted back                         <- nothing is applied
Step 4  wait for the go-ahead on that plan file
Step 5  apply the saved plan
Step 6  plan again, which must show no change; read back what the project serves
Step 7  the destroy plan, which must be refused; a plan with one variable changed, which must
        report a change

The persistent project, in this directory
Step 8  choose the region; create the project by hand
Step 9  import the project only; the first plan, saved and pasted back  <- nothing is applied
Step 10 wait for the go-ahead on that plan file
Step 11 apply the saved plan
Step 12 plan again; read back what the project serves
Step 13 the destroy plan, which must be refused; the state object in the bucket
```

The persistent project is created only once the rehearsal has passed: its first plan was read and
applied, its second plan showed no change, and its destroy plan was refused.

## Rehearsal on the throwaway project

The throwaway project shows, before the persistent project is touched, what the provider and the API
do with this module: which settings the import reads, which keys the API accepts, in which form it
returns them, and whether the stop rules hold. A misspelled key or a string the API rewrites gives no
error, so this is the only place either is seen first.

### Step 1: The access token and the throwaway project

1. Say which organisation is the dedicated one, on the line `answer_org=`, and which account holds
   the access token, on the line `answer_token_holder=`, as a role or a name and not as an e-mail
   address. Create a token for an account that is a member of that organisation only (dashboard,
   Account, Access Tokens), and keep it in your password manager.
2. Create the throwaway project by hand in that organisation: name `openvaa-scratch`, region
   `eu-north-1` if the dashboard offers it, and a database password you keep in your password manager.
   If the dashboard does not offer `eu-north-1`, pick the EU region the persistent project will get;
   a project's region cannot be changed later. Answer on the lines `answer_ref=<the project ref>`,
   `answer_slug=<the organisation slug as the dashboard's address shows it>`,
   `answer_region=<the region id the dashboard shows>` and `answer_eu_north_1_offered=yes` or `no`; if
   it was not offered, list the EU regions that were on the line `answer_eu_regions=`.

Steps 1 and 2 are one sitting. Return their lines together, at the end of Step 2.

### Step 2: The two imports and the read of the settings

The local state file of the scratch root, `terraform.tfstate`, holds every auth setting of the
throwaway project in clear text once the import has run. Git ignores it; never share it, and delete it
with the project when the rehearsal is over. The provider documents that on import all setting
categories are fetched from the API.

3. The lines that begin the sitting, from the repository root:

   ```bash
   cd infra/envs/scratch/supabase
   export LC_ALL=C
   L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
   ```

   Then export, for this session only, `SUPABASE_ACCESS_TOKEN` and `TF_VAR_database_password` with the
   two `read -rs` lines of "Before you start", and the three values of Step 1 and the ref. Write none
   of them to a file.

   ```bash
   export TF_VAR_organization_id='<the slug>'
   export TF_VAR_project_name=openvaa-scratch
   export TF_VAR_region='<the region id, for example eu-north-1>'
   REF='<the project ref>'
   ```

4. Initialise:

   ```bash
   terraform init -input=false -no-color > "$L/s4.log" 2>&1; echo "s4_init_exit=$?"
   ```

5. Import the project:

   ```bash
   terraform import -no-color module.supabase.supabase_project.this "$REF" > "$L/s5.log" 2>&1; echo "s5_import_project_exit=$?"
   ```

6. Import the settings:

   ```bash
   terraform import -no-color module.supabase.supabase_settings.this "$REF" > "$L/s6.log" 2>&1; echo "s6_import_settings_exit=$?"
   ```

7. Five named fields of the imported project. The last says only whether the state holds a password,
   never the password.

   ```bash
   terraform show -json | jq -r '[.. | objects | select(.type? == "supabase_project")][0].values | "s7_project_ref=\(.id)", "s7_organization=\(.organization_id)", "s7_name=\(.name)", "s7_region=\(.region)", "s7_password_in_state=\(.database_password != null)"'
   ```

8. The imported settings, through the filter. It prints one named line per API setting, one
   `s8_auth_name=` line per auth setting name, and one named line with its value for each auth setting
   on an allow-list of names. In all three parts it first drops every setting whose name ends in a
   secret word: such a setting is printed neither with its value nor by name. The raw JSON goes from
   one command into the other and never to the terminal.

   ```bash
   terraform show -json | jq -r '[.. | objects | select(.type? == "supabase_settings")][0].values | def safe: with_entries(select(.key | test("(^|_)(secret|secrets|pass|passwd|password|key|keys|token|tokens)$") | not)); ((.api | fromjson | safe | to_entries[] | "s8_api.\(.key)=\(.value | tojson)"), (.auth | fromjson | safe | keys[] | "s8_auth_name=\(.)"), (.auth | fromjson | with_entries(select(.key | test("^(site_url|uri_allow_list|disable_signup|mailer_(autoconfirm|otp_|secure_)|external_[a-z0-9_]+_enabled$|jwt_exp|refresh_token_|password_(min_length|required_characters)|rate_limit_|smtp_max_frequency|hook_custom_access_token_(enabled|uri)|oauth_server|mfa_|security_(manual|refresh|update|sb_))"))) | safe | to_entries[] | "s8_auth.\(.key)=\(.value | tojson)"))'
   ```

   The send-email hook's two settings, `hook_send_email_enabled` and `hook_send_email_uri`, are not on
   the allow-list, so they appear on `s8_auth_name=` lines by name only.

9. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s9_logs_removed=yes"
   ```

Return, for Steps 1 and 2: the `answer_` lines of items 1 and 2, and the named lines of items 4 to 9.

Before Step 3, the organisation, the name and the region that item 7 printed are written into the
scratch root's `terraform.tfvars`, and any key or value that item 8 showed in another form is
corrected in the module. Pull that change before you plan.

### Step 3: The first plan

The lines that begin the sitting, from the repository root. Export the token and the password with the
two `read -rs` lines of "Before you start". The variable file now holds the organisation, the name
and the region, so the three exports of Step 2 are removed.

```bash
cd infra/envs/scratch/supabase
export LC_ALL=C
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
unset TF_VAR_organization_id TF_VAR_project_name TF_VAR_region
```

The plan file of this step is kept on purpose, for the apply of Step 5. It holds the project's settings
and the database password in clear text.

1. Plan, and save the plan:

   ```bash
   terraform plan -input=false -no-color -out=tfplan > "$L/s1.log" 2>&1; echo "s1_plan_exit=$?"
   ```

2. The plan file's checksum, which ties the go-ahead to this one file:

   ```bash
   echo "s2_plan_sha256=$(shasum -a 256 tfplan | cut -d' ' -f1)"
   ```

3. The resource headings, the summary line, and any line that names the password, a replacement or a
   destroy. It prints no setting value, and a password line would read `(sensitive value)`.

   ```bash
   grep -n -E '^  # |^Plan:|^No changes|database_password|must be replaced|will be destroyed|forces replacement' "$L/s1.log" | sed 's/^/s3_plan_line=/'
   ```

4. Last item, also when you stop early or a command failed. This removes the plan log and keeps
   `tfplan`.

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s4_logs_removed=yes"
   ```

Do not run `terraform apply`. Keep `tfplan` where it is and keep the terminal open. If you make a new
plan for any reason, say so: the reading is then done again.

Return: `s1_plan_exit=`, `s2_plan_sha256=`, every `s3_plan_line=` line and `s4_logs_removed=yes`.

### Step 4: Wait for the go-ahead

Do nothing in this step but wait. Whoever reads the lines you pasted reads them against the stop
rules, one by one:

1. No resource heading names the project resource, `module.supabase.supabase_project.this`. Any
   heading for it, as an update, a replacement or a destroy, is a stop.
2. No pasted line contains `database_password`.
3. The summary line shows `0 to destroy`, and no line says that a resource must be replaced.
4. The only resource heading is for the settings resource, `module.supabase.supabase_settings.this`,
   as an update in place or a creation. A heading for any other address is a stop.
5. The plan's status line reads 0.

The go-ahead names the SHA-256 of the plan file it was given for, and it is good for that file only.
If the reading says stop, nothing is applied and the plan file is removed:

```bash
rm -f tfplan
```

> **A password line in a plan means stop.** If any pasted line names `database_password`, the first
> apply would send the exported value to the project as its new password. The module ignores changes
> to the password so that this line never appears; if it appears anyway, the module's protection did
> not hold, and nothing is applied until that is resolved. The lifecycle block is not edited to make
> the line go away.

### Step 5: Apply the saved plan

Steps 5 to 7 are one sitting. The lines that begin it, from the repository root; export the token and
the password with the two `read -rs` lines of "Before you start", and set the throwaway project's ref.
The plan file `tfplan` of Step 3 is in this directory and does not depend on the terminal. Here `$L`
receives the raw auth configuration of the project, which holds its secrets.

```bash
cd infra/envs/scratch/supabase
export LC_ALL=C
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
REF='<the throwaway project ref>'
```

1. Compare the plan file's checksum with the one the go-ahead names:

   ```bash
   echo "s1_plan_sha256=$(shasum -a 256 tfplan | cut -d' ' -f1)"
   ```

   If they differ, stop here: do not apply, remove the stale plan file, paste the lines, write
   `answer_applied=not-applied`, and run the last item of Step 7.

   ```bash
   rm -f tfplan; echo "s2_plan_file_removed=yes"
   ```

2. Apply the saved plan, print its summary line, and remove the plan file whether the apply succeeded
   or failed: the file holds the database password and is of no use after this step.

   ```bash
   terraform apply -input=false -no-color tfplan > "$L/s2.log" 2>&1; echo "s2_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s2.log" | sed 's/^/s2_apply_line=/'
   rm -f tfplan; echo "s2_plan_file_removed=yes"
   ```

   If the status is 0, write `answer_applied=yes`. If the apply fails, write `answer_applied=error`,
   add the titles of the errors, stop here, and run the last item of Step 7. Do not plan or apply again
   in this step.

   ```bash
   grep -E '^Error: ' "$L/s2.log" | sed 's/^/s2_error=/'
   ```

### Step 6: Plan again and read back what the project serves

3. Plan again. Status 0 means no change, 2 means changes, 1 means an error.

   ```bash
   terraform plan -input=false -detailed-exitcode -no-color > "$L/s3.log" 2>&1; echo "s3_second_plan_exit=$?"
   grep -n -E '^  # |^Plan:|^No changes' "$L/s3.log" | sed 's/^/s3_plan_line=/'
   ```

4. Read back what the project serves, from the Supabase Management API. The token is given to `curl`
   on its standard input, as a one-line configuration, by a shell builtin: it is written to no file and
   is on no command line, so there is nothing to remove if a request fails. The first filter prints only
   the auth settings Terraform manages and drops any whose name ends in a secret word; the second prints
   the API settings that `hosted-settings.json` names.

   ```bash
   KEYS=$(terraform output -json managed_auth_keys)
   printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" | curl -sS -K - -o "$L/s4-auth.json" -w 's4_auth_http=%{http_code}\n' "https://api.supabase.com/v1/projects/$REF/config/auth"
   jq -r --argjson k "$KEYS" 'to_entries[] | select((.key as $x | $k | index($x)) and (.key | test("(^|_)(secret|secrets|pass|passwd|password|key|keys|token|tokens)$") | not)) | "s4_auth.\(.key)=\(.value | tojson)"' "$L/s4-auth.json"
   printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" | curl -sS -K - -o "$L/s4-api.json" -w 's4_api_http=%{http_code}\n' "https://api.supabase.com/v1/projects/$REF/postgrest"
   jq -r --slurpfile h ../../../modules/supabase/hosted-settings.json 'to_entries[] | select(.key as $x | $h[0].api | has($x)) | "s4_api.\(.key)=\(.value | tojson)"' "$L/s4-api.json"
   ```

   If a status is not 200, paste the `…_http=` line and nothing of the answer.

### Step 7: The refused destroy and a changed variable

5. The refusal. A plan applies nothing. The status must not be 0, and the count must be at least 1.

   ```bash
   terraform plan -destroy -input=false -no-color > "$L/s5.log" 2>&1; echo "s5_destroy_plan_exit=$?"
   echo "s5_refusal_lines=$(grep -c -i -E 'cannot be destroyed|prevent_destroy' "$L/s5.log")"
   ```

   Terraform documents that `prevent_destroy` rejects a plan that would destroy the resource, that the
   argument must be present in the configuration, and that it is not recorded in state.

6. The red control of item 3: a plan with one variable changed must report a change. The status must
   be 2, and nothing is applied. If the variable file already sets the hook off, use
   `-var enable_access_token_hook=true` instead.

   ```bash
   terraform plan -input=false -detailed-exitcode -no-color -var enable_access_token_hook=false > "$L/s6.log" 2>&1; echo "s6_red_plan_exit=$?"
   ```

7. Last item, also when you stop early or a command failed:

   ```bash
   rm -f tfplan
   test -n "$L" && rm -rf "$L" && echo "s7_logs_removed=yes"
   ```

Return, for Steps 5 to 7: `answer_applied=`, and the named lines of items 1 to 7. Do not paste the
token, the password or anything from a log.

**When the rehearsal is over** and its results are on record, delete the throwaway project in the
dashboard, then remove the scratch root's local state, which holds the project's settings in clear
text: `terraform.tfstate` and `terraform.tfstate.backup` in `infra/envs/scratch/supabase`.

## The persistent project

Work in this directory, `infra/envs/staging/supabase`, signed in to AWS, because this root's state is
in the bucket. The database password of these steps is the persistent project's, not the throwaway's.

### Step 8: Choose the region and create the project

Choose the region before the project exists, and treat the choice as final: a project's region cannot
be changed later, and moving means a new project and a migration of the database, the storage and
every key. The AWS stack is in `eu-north-1`; Step 1 recorded whether the dashboard offered it.

Answer on the line `answer_option=`: `eu-north-1`; `other-eu`, with the region on the line
`answer_region=`; or `stop`, in which case nothing is created. For `eu-north-1` or `other-eu`, create
the project by hand in the dedicated Pro organisation with that region, a name such as
`openvaa-staging`, and a database password that you keep in your password manager. If the project
already exists from an earlier sitting, name the same option and give the existing ref; no second
project is created.

Return: `answer_option=`, and for `eu-north-1` or `other-eu` the lines `answer_ref=`, `answer_slug=`,
`answer_name=` and `answer_region_shown=`: the project ref, the organisation slug as the dashboard
shows it, the project's name, and the region the dashboard shows for it. If the region shown is not
the one chosen, say so and stop. Do not paste the password.

### Step 9: Import the project and make the first plan

The lines that begin the sitting, from the repository root, signed in to AWS. Export the token and the
persistent project's database password with the two `read -rs` lines of "Before you start", and set
the persistent project's ref. If the ref you are given with this step is not the project you are about
to import, stop and say so.

```bash
cd infra/envs/staging/supabase
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
REF='<the persistent project ref>'
```

The plan file of this step is kept on purpose, for the apply of Step 11. It holds the project's
settings and the database password in clear text.

1. It must print `s1_account=471112560111`:

   ```bash
   echo "s1_account=$(aws sts get-caller-identity --query Account --output text)"
   ```

2. Add three lines to `terraform.tfvars`: `organization_id`, `project_name` and `region`, with the
   slug, the name and the region id of the project you created. If the rehearsal recorded that the
   provider reads an organisation id other than the dashboard slug, use the form it recorded. This
   file is tracked and public; it holds no secret. Whoever reads your lines reads this change with
   `git diff`.
3. Initialise:

   ```bash
   terraform init -input=false -no-color > "$L/s3.log" 2>&1; echo "s3_init_exit=$?"
   ```

4. Import the project only. Do not import the settings resource here: the provider's tutorial
   documents that creating the settings resource and updating it are the same, and that its deletion
   is a no-op, so the first apply writes the module's keys and the state then holds those keys only.

   ```bash
   terraform import -no-color module.supabase.supabase_project.this "$REF" > "$L/s4.log" 2>&1; echo "s4_import_project_exit=$?"
   ```

5. Five named fields of the imported project. Check that the name and the region are the persistent
   project's. If `s5_organization` differs from the value in `terraform.tfvars`, correct the file to
   the one printed. Do not run `terraform state show` or `terraform show` on their own.

   ```bash
   terraform show -json | jq -r '[.. | objects | select(.type? == "supabase_project")][0].values | "s5_project_ref=\(.id)", "s5_organization=\(.organization_id)", "s5_name=\(.name)", "s5_region=\(.region)", "s5_password_in_state=\(.database_password != null)"'
   ```

6. Plan, and save the plan:

   ```bash
   terraform plan -input=false -no-color -out=tfplan > "$L/s6.log" 2>&1; echo "s6_plan_exit=$?"
   ```

7. The plan file's checksum:

   ```bash
   echo "s7_plan_sha256=$(shasum -a 256 tfplan | cut -d' ' -f1)"
   ```

8. The resource headings, the summary line, and any line that names the password, a replacement or a
   destroy:

   ```bash
   grep -n -E '^  # |^Plan:|^No changes|database_password|must be replaced|will be destroyed|forces replacement' "$L/s6.log" | sed 's/^/s8_plan_line=/'
   ```

9. Last item, also when you stop early or a command failed. This removes the plan log and keeps
   `tfplan`.

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s9_logs_removed=yes"
   ```

Do not run `terraform apply`. Keep `tfplan` where it is and keep the terminal open. If you make a new
plan for any reason, say so: the reading is then done again.

Return: the named lines of items 1 and 3 to 9.

### Step 10: Wait for the go-ahead

Do nothing in this step but wait. Whoever reads the lines you pasted reads them against the stop rules
of Step 4, with `s6_plan_exit=0` in place of the plan status of Step 3. Here the settings resource
appears as a creation, because it was not imported. The go-ahead names the SHA-256 of the plan file and
the project ref it was given for, and it is good for that file only. If the reading says stop, nothing
is applied and the plan file is removed with `rm -f tfplan`.

### Step 11: Apply the saved plan

Steps 11 to 13 are one sitting. The lines that begin it, from the repository root, signed in to AWS;
export the token and the persistent project's password with the two `read -rs` lines of "Before you
start", and set the persistent project's ref. The plan file `tfplan` of Step 9 is in this directory
and does not depend on the terminal. Here `$L` receives the raw auth configuration of the project,
which holds its secrets.

```bash
cd infra/envs/staging/supabase
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
REF='<the persistent project ref>'
```

1. Compare the plan file's checksum with the one the go-ahead names:

   ```bash
   echo "s1_plan_sha256=$(shasum -a 256 tfplan | cut -d' ' -f1)"
   ```

   If they differ, stop here: do not apply, remove the stale plan file with
   `rm -f tfplan; echo "s2_plan_file_removed=yes"`, paste the lines, write
   `answer_applied=not-applied`, and run the last item of Step 13.

2. Apply the saved plan, print its summary line, and remove the plan file whether the apply succeeded
   or failed:

   ```bash
   terraform apply -input=false -no-color tfplan > "$L/s2.log" 2>&1; echo "s2_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s2.log" | sed 's/^/s2_apply_line=/'
   rm -f tfplan; echo "s2_plan_file_removed=yes"
   ```

   If the status is 0, write `answer_applied=yes`. If the apply fails, write `answer_applied=error`,
   add the titles of the errors with `grep -E '^Error: ' "$L/s2.log" | sed 's/^/s2_error=/'`, stop
   here, and run the last item of Step 13. Do not plan or apply again in this step.

### Step 12: Plan again and read back what the project serves

3. Plan again. Status 0 means no change.

   ```bash
   terraform plan -input=false -detailed-exitcode -no-color > "$L/s3.log" 2>&1; echo "s3_second_plan_exit=$?"
   grep -n -E '^  # |^Plan:|^No changes' "$L/s3.log" | sed 's/^/s3_plan_line=/'
   ```

4. Read back what the project serves, as in Step 6. The token goes to `curl` on its standard input
   and is written to no file.

   ```bash
   KEYS=$(terraform output -json managed_auth_keys)
   printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" | curl -sS -K - -o "$L/s4-auth.json" -w 's4_auth_http=%{http_code}\n' "https://api.supabase.com/v1/projects/$REF/config/auth"
   jq -r --argjson k "$KEYS" 'to_entries[] | select((.key as $x | $k | index($x)) and (.key | test("(^|_)(secret|secrets|pass|passwd|password|key|keys|token|tokens)$") | not)) | "s4_auth.\(.key)=\(.value | tojson)"' "$L/s4-auth.json"
   printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" | curl -sS -K - -o "$L/s4-api.json" -w 's4_api_http=%{http_code}\n' "https://api.supabase.com/v1/projects/$REF/postgrest"
   jq -r --slurpfile h ../../../modules/supabase/hosted-settings.json 'to_entries[] | select(.key as $x | $h[0].api | has($x)) | "s4_api.\(.key)=\(.value | tojson)"' "$L/s4-api.json"
   ```

   If a status is not 200, paste the `…_http=` line and nothing of the answer.

### Step 13: The refused destroy and the state object

5. The refusal. A plan applies nothing. The status must not be 0, and the count must be at least 1.

   ```bash
   terraform plan -destroy -input=false -no-color > "$L/s5.log" 2>&1; echo "s5_destroy_plan_exit=$?"
   echo "s5_refusal_lines=$(grep -c -i -E 'cannot be destroyed|prevent_destroy' "$L/s5.log")"
   ```

   > **Never run `terraform destroy` in this root.** `prevent_destroy` protects the project only while
   > the resource block is in the configuration, so a destroy run after the block was renamed or
   > removed would delete the project with no protection. The destroy plan above is the only form of
   > destroy this root ever sees.

6. The state's resource addresses, and the state object in the bucket. The state list prints addresses
   and no value; the version id itself is not printed.

   ```bash
   terraform state list > "$L/s6.txt" 2> "$L/s6.err"; echo "s6_state_list_exit=$?"
   sed 's/^/s6_state_address=/' "$L/s6.txt"
   aws s3api head-object --bucket openvaa-tfstate-471112560111 --key hand/staging/supabase/terraform.tfstate --output json > "$L/s6.json" 2> "$L/s6h.err"; echo "s6_head_exit=$?"
   jq -r '"s6_state_sse=\(.ServerSideEncryption)", "s6_state_versioned=\(.VersionId != null)"' "$L/s6.json"
   ```

7. Last item, also when you stop early or a command failed:

   ```bash
   rm -f tfplan
   test -n "$L" && rm -rf "$L" && echo "s7_logs_removed=yes"
   ```

Return, for Steps 11 to 13: `answer_applied=`, and the named lines of items 1 to 7. Do not paste the
token, the password or anything from a log.

## Settings and their guard

The hosted values live in [`../../../modules/supabase/hosted-settings.json`](../../../modules/supabase/hosted-settings.json),
in five groups: `api`, `auth`, `auth_hook` (the access-token hook), `auth_send_email_hook` (the
send-email hook) and `redirect_callback_paths`. The module adds what depends on the environment: the
site address and the redirect allow list, built from the root's `public_origin`, the rate limits, and
the SMTP settings once a root sets them. `terraform output -json managed_auth_keys` lists the auth
settings a root sends. Every key of the local Supabase configuration's API and auth tables is in one of
four classes:

| Class                  | Example key, local and hosted                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Must agree             | `[auth] enable_signup` and `disable_signup`, inverted: sign-up is closed in both            |
| Hosted may be stricter | `[auth] minimum_password_length` and `password_min_length`, 8 in both                       |
| Differs by design      | `[auth] site_url` and `site_url`, which is each root's `public_origin`                      |
| Not compared           | `[auth.rate_limit] email_sent`, a limit sized for the test suite, set by the module instead |

`yarn assert:hosted-settings-parity`, a link of `yarn lint:check`, fails when a compared key
disagrees.

Each hook has a switch of its own in every Supabase root's `terraform.tfvars`:
`enable_access_token_hook` and `enable_send_email_hook`, both `true` by default and in each root. While
a switch is `false`, that hook's keys are left out of what is sent. The guard fails on a switch set to
`false` unless the assignment carries a comment that begins `hook off until` and gives the reason, for
example `enable_send_email_hook = false # hook off until <reason>`; such a root passes and is named in
the guard's report.

The send-email hook's function takes every mail the auth service would send and sends none; the
application's own function sends the mails. So while the send-email hook is on, the hosted auth service
sends no mail of its own, and the SMTP settings and the mail rate limit `rate_limit_email_sent` govern
no mail the auth service sends. No step of this runbook applies the SMTP settings; the root's
`terraform.tfvars` gains its `smtp` object in a later stage of the deployment work.

## Traps

> **A misspelled key is accepted and never applied.** Symptom: a setting the read-back of Step 6 or
> Step 12 does not print, or prints with the platform's value, although the second plan reports no
> change. The provider's source, read at version 1.11.0, decodes the auth and API settings into a fixed
> structure, which drops a key it does not know; state keeps the key with its planned value, so no plan
> ever shows it. Take key names only from `hosted-settings.json`, and read the served settings back
> after every apply.

> **A string the API rewrites keeps the plan from emptying.** Symptom: the same one-line change on
> `db_schema` or `uri_allow_list` in every plan, after every apply. The API may return a list with
> other spacing or another order than the one sent. Copy the exact form the import of Step 2 printed
> into the module, and plan again.

> **A password line in a plan means stop.** Symptom: a pasted plan line that names
> `database_password`. Do not apply that plan; remove it with `rm -f tfplan`. The provider's source,
> read at version 1.11.0, does not read the password back from the API, so an import leaves none in
> state, and without the module's ignore rule the first apply would send the exported value as the new
> password.

> **A hook switched on before its function exists.** Symptom: the apply of Step 5 or Step 11 fails with
> an error that names a hook. Both hooks point at database functions that the migrations create. If
> the project does not have them yet, set the switch of that hook to `false` in the root's
> `terraform.tfvars`, with the comment `# hook off until <reason>`, and start again from a new plan,
> which is read again before it is applied.

## Not yet observed

Nobody has applied either root yet. Each statement below is something this runbook relies on and that
has not been seen. It moves to "Observations", with its date, once the step named beside it has shown
it.

| Statement                                                                                                                                                          | Checked by                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Ignoring changes to the database password gives a plan with no change to the project and no password line on an imported project                                   | Step 3, item 3; Step 9, item 8                                                 |
| The text and the exit status of a refused destroy plan: a status other than 0, and a message that names `prevent_destroy` or says the resource cannot be destroyed | Step 7, item 5; Step 13, item 5                                                |
| The exact strings the API returns for the schema list (`db_schema`) and the redirect list (`uri_allow_list`), and whether the second plan is empty with them       | Step 2, item 8; Step 6, items 3 and 4                                          |
| Whether the hosted API accepts the three OAuth-server keys                                                                                                         | Step 2, item 8, shows whether the project holds them; sending them comes later |
| Whether the access-token hook can be switched on before its function exists on the project                                                                         | Step 5, item 2                                                                 |
| Whether the send-email hook can be switched on before its function exists on the project                                                                           | Step 5, item 2                                                                 |
| Whether two settings resources work side by side for one project, each keeping only its own keys                                                                   | A later stage of the deployment work, when the SMTP settings are applied       |
| Whether the organisation id the provider reads equals the slug the dashboard shows                                                                                 | Step 2, item 7                                                                 |
| The addresses of the two Management API reads, `/v1/projects/<ref>/config/auth` and `/v1/projects/<ref>/postgrest`, and the form of their answers                  | Step 6, item 4                                                                 |
| Every key the module sends is served as sent                                                                                                                       | Step 6, item 4; Step 12, item 4                                                |
| A plan with one variable changed reports a change, with status 2                                                                                                   | Step 7, item 6                                                                 |
| The dashboard offers `eu-north-1` for a project of the organisation                                                                                                | Step 1, item 2                                                                 |
| While the send-email hook is on, the hosted auth service sends no mail of its own                                                                                  | A later stage of the deployment work, with the first mail the function sends   |

## Observations

| Date (UTC) | Observation |
| ---------- | ----------- |
