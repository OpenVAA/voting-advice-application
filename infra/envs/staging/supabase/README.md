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
  deleted. The root's `import` block names the project by `project_ref` in `terraform.tfvars`, so a
  plan against a state that lacks the project imports it rather than creating one; a plan that still
  shows the project as a creation is never applied.
- **A plan that shows a destroy, a replacement or a change of the database password is never
  applied**, because each of them changes what the project holds or how it is reached, and none can be
  undone by applying again. There is one exception, and it never touches a project: Step 18 admits
  the destroy of the SMTP credential settings resource,
  `module.supabase.supabase_settings.smtp_secret[0]`, while the root's send-email hook is on.
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
- Never paste the access token, the database password or any other secret, and never an e-mail
  address other than the sender address `noreply@staging.openvaa.org`.

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

Deploying to a project: first with R=scratch, then unchanged with R=staging
Step 14 the linked work directory, outside apps/supabase
Step 15 the connection psql uses: direct, else the session pooler; never port 6543
Step 16 the migrations, pushed by the wrapper, and the drift check
Step 17 the three functions, deployed from the linked work directory
Step 18 the settings and the function secrets: plan, go-ahead, apply, read-back
Step 19 the server's logging settings                    <- the bootstrap waits on them
Step 20 the bootstrap, twice, and the seed check
Step 21 the first administrator: the user, the grant, the claims of a token
Step 22 the smoke dataset, once per project; the smoke contestant, once
Step 23 the conformance probe
Step 24 the backups and the PITR state, read                <- nothing is restored
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
   L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-supabase.XXXXXX")
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
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-supabase.XXXXXX")
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
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-supabase.XXXXXX")
REF='<the throwaway project ref>'
```

1. Compare the plan file's checksum with the one the go-ahead names:

   ```bash
   echo "s1_plan_sha256=$(shasum -a 256 tfplan | cut -d' ' -f1)"
   ```

   If they differ, stop here: do not apply, remove the stale plan file with
   `rm -f tfplan; echo "s2_plan_file_removed=yes"`, paste the lines, write
   `answer_applied=not-applied`, and run the last item of Step 7.

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
text: `terraform.tfstate`, `terraform.tfstate.backup`, any `tfplan` and the `.terraform` directory in
`infra/envs/scratch/supabase`, and the project's linked work directory `tmp/supabase-linked/<ref>`
(Step 14). The root's tracked files stay for the next rehearsal, which writes the new throwaway's
ref, organisation, name and region into its `terraform.tfvars`.

## The persistent project

Work in this directory, `infra/envs/staging/supabase`, signed in to AWS, because this root's state is
in the bucket. The database password of these steps is the persistent project's, not the throwaway's.

The persistent project is `cofbsatfrdysyphajsky` (`openvaa-staging`, in `eu-north-1`). It is imported
into this root, and its settings are applied.

### Step 8: Choose the region and create the project

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

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

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

The lines that begin the sitting, from the repository root, signed in to AWS. Export the token and the
persistent project's database password with the two `read -rs` lines of "Before you start", and set
the persistent project's ref. If the ref you are given with this step is not the project you are about
to import, stop and say so.

```bash
cd infra/envs/staging/supabase
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-supabase.XXXXXX")
REF='cofbsatfrdysyphajsky'
```

The plan file of this step is kept on purpose, for the apply of Step 11. It holds the project's
settings and the database password in clear text.

1. It must print `s1_account=471112560111`:

   ```bash
   echo "s1_account=$(aws sts get-caller-identity --query Account --output text)"
   ```

2. Add four lines to `terraform.tfvars`: `project_ref`, `organization_id`, `project_name` and
   `region`, with the ref, the slug, the name and the region id of the project you created. If the rehearsal recorded that the
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

   The root's `import` block names the same project; once this item has run, it plans nothing.

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
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-supabase.XXXXXX")
REF='cofbsatfrdysyphajsky'
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

## Deploying to a project

Steps 14 to 23 deploy the repository to a project. Each step is run first on the throwaway project,
with `R=scratch`, and then, unchanged, on the persistent project, with `R=staging`, so that the
persistent project gets the rehearsed commands and nothing else. The order is the deploy order: the
migrations, the functions, the settings and the secrets, the rows, and last the check of what the
project serves. Step 24, after them, only reads the project's backups. A step that is run again
later, in another sitting, is run as written here.

Every command is run from the repository root. In this part every named line begins with the
number of its step, not of its item: Step 16 prints `s16_` lines whatever item prints them, because
a sitting often pastes the lines of several steps together. The rules of "What you paste back" hold
as they are.

You need, besides "Before you start": Docker running (the drift check of Step 16 starts a shadow
database, and Step 17 bundles the functions), `psql` 15 or later, Node 24 with `yarn install` run,
and for `R=staging` the AWS CLI, signed in.

### The lines that begin each sitting of this part

Run them in each new terminal, with the root the sitting names:

```bash
cd "$(git rev-parse --show-toplevel)"
export LC_ALL=C
R=scratch
REF=$(sed -n 's/^project_ref *= *"\([a-z]*\)".*/\1/p' \
  "infra/envs/$R/supabase/terraform.tfvars")
W=tmp/supabase-linked/$REF
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-supabase.XXXXXX")
```

Then the secrets the sitting names, each read without echoing it and exported, never given on a
command line:

```bash
printf 'access token: '; read -rs SUPABASE_ACCESS_TOKEN; echo
export SUPABASE_ACCESS_TOKEN
printf 'database password: '; read -rs SUPABASE_DB_PASSWORD; echo
export SUPABASE_DB_PASSWORD PGPASSWORD="$SUPABASE_DB_PASSWORD"
```

Where a step needs them, also these. The database password of the Terraform root is the same
project's password.

```bash
printf 'anon key: '; read -rs SUPABASE_ANON_KEY; echo
export SUPABASE_ANON_KEY
printf 'service-role key: '; read -rs SUPABASE_SERVICE_ROLE_KEY
echo; export SUPABASE_SERVICE_ROLE_KEY
export TF_VAR_database_password="$SUPABASE_DB_PASSWORD"
```

The SMTP user name and password come from the outputs of the `staging/dns-mail` root, read into
the variables and never printed. That root's state is in the bucket, so this needs the AWS CLI
signed in to account `471112560111` and the root initialised. Name the profile explicitly: a
workstation's default profile may sign in to another account, and Terraform then fails with "No
valid credential sources found". The account check must print `471112560111`.

```bash
export AWS_PROFILE=openvaa-admin
aws sts get-caller-identity --query Account --output text
D=infra/envs/staging/dns-mail
TF_VAR_smtp_user=$(terraform -chdir="$D" output -raw \
  smtp_username)
TF_VAR_smtp_password=$(terraform -chdir="$D" output -raw \
  smtp_password)
export TF_VAR_smtp_user TF_VAR_smtp_password
test -n "$TF_VAR_smtp_user" && test -n "$TF_VAR_smtp_password" \
  && echo "smtp_credentials_read=yes"
```

Each step ends by removing `$L`. A step that follows another in the same sitting begins by making
it again:

```bash
test -d "$L" || \
  L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-supabase.XXXXXX")
```

### Step 14: The linked work directory

The CLI is linked to a project in a work directory of its own, `tmp/supabase-linked/<ref>`, whose
`supabase/` holds symbolic links to the repository's `config.toml`, `migrations` and `functions`.
**`apps/supabase` is never linked**: a link writes the project's service versions into
`supabase/.temp`, and the CLI then starts those versions' images for that directory's local stack,
which in `apps/supabase` is the stack every checkout of this repository shares. Git ignores `tmp/`.

Secrets: `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`.

1. The work directory and its three links:

   ```bash
   mkdir -p "$W/supabase"
   for p in config.toml migrations functions; do
     ln -sfn "$PWD/apps/supabase/supabase/$p" "$W/supabase/$p"
   done
   N=$(find "$W/supabase" -maxdepth 1 -type l | wc -l)
   echo "s14_links=$((N))"
   ```

   It must print `s14_links=3`.

2. Link it:

   ```bash
   node_modules/.bin/supabase link --project-ref "$REF" \
     --workdir "$W" --agent no --output-format text \
     > "$L/s14-link.log" 2>&1
   echo "s14_link_exit=$?"
   ```

3. The ref the link wrote, and that the shared work directory holds none:

   ```bash
   echo "s14_linked_ref=$(cat "$W/supabase/.temp/project-ref")"
   test ! -e apps/supabase/supabase/.temp/project-ref \
     && echo "s14_shared_dir_linked=no"
   ```

   `s14_linked_ref=` must be the ref of the root, and `s14_shared_dir_linked=no` must be printed.

4. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s14_logs_removed=yes"
   ```

The work directory is kept for the steps that follow and for later sittings.

### Step 15: The connection psql uses

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

The bootstrap, the drift check, the grant and the probe's catalog reads connect through the libpq
variables. The direct connection is tried first; when it fails, the session pooler on port 5432 is
used. **Port 6543, the transaction pooler, is never used**: it gives each transaction a backend of
its own, so a session setting the bootstrap makes before its transaction can be lost before the
statement it protects. Keep the variables of this step in the shell for the rest of the sitting.

Secrets: `SUPABASE_DB_PASSWORD`, exported also as `PGPASSWORD`.

1. The direct connection:

   ```bash
   export PGHOST="db.$REF.supabase.co" PGPORT=5432
   export PGUSER=postgres PGDATABASE=postgres
   export PGCONNECT_TIMEOUT=10
   unset PGHOSTADDR PGSERVICE
   psql -X -At -c 'select 1' > "$L/s15-direct.log" 2>&1
   echo "s15_direct_exit=$?"
   ```

2. Only when `s15_direct_exit=` is not 0: the session pooler. Copy its host from the dashboard's
   Connect dialog, under "Session pooler"; it cannot be built from the region. The user name carries
   the ref.

   ```bash
   printf 'session pooler host: '; read -r PGHOST; export PGHOST
   export PGUSER="postgres.$REF" PGPORT=5432
   psql -X -At -c 'select 1' > "$L/s15-pooler.log" 2>&1
   echo "s15_pooler_exit=$?"
   ```

3. Which connection the variables now give:

   ```bash
   if psql -X -At -c 'select 1' > /dev/null 2>&1; then
     case "$PGHOST" in
       db.*) echo "s15_connection=direct" ;;
       *) echo "s15_connection=pooler" ;;
     esac
   else
     echo "s15_connection=none"
   fi
   ```

   With `s15_connection=none`, stop here.

4. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s15_logs_removed=yes"
   ```

### Step 16: The migrations

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

The deploy workflow runs this step itself, in the gated `staging` job: it links a work directory of
its own under the runner's temporary directory, reaches the database through the session pooler, and
calls `push-migrations.sh` with `--confirmed-ref`, the environment's approval standing in for the
typed ref. That approval is given when the job starts, before the pending versions are listed, and
what keeps the push in that job is the database password, an environment secret; the flag's own
conditions only guard against a mistake. A hand push is for a sitting outside the pipeline. For the pipeline,
`SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` are environment secrets of the `staging` GitHub
Environment and nowhere else.

`infra/scripts/push-migrations.sh` refuses a work directory that is not linked to the ref it is
given, shows what the project lacks, asks you on the terminal to type the ref, pushes, and then runs
the drift check against the same project. Its status is the drift check's after a push. It needs
Step 14's work directory, Step 15's variables and Docker.

Secrets: `SUPABASE_DB_PASSWORD`, exported also as `PGPASSWORD`.

1. The push. The pending versions and the question `Type the project ref to push to it:` appear on
   the terminal; read the versions, then type the ref of the root. Anything else pushes nothing.

   ```bash
   infra/scripts/push-migrations.sh --ref "$REF" \
     --workdir "$W" --log-dir "$L/push" > "$L/s16.out"
   echo "s16_push_exit=$?"
   sed 's/^/s16_/' "$L/s16.out"
   ```

   The lines it prints, in this order: `s16_push_connection=direct` or `pooler`, the host `PGHOST`
   names, which the CLI is given as its address; one `s16_push_pending=<version>` per migration the project lacks;
   `s16_push_up_to_date=yes` or `no`; `s16_push_confirmation=terminal` and `s16_push_status=<n>` when
   a push ran; `s16_drift_status=<n>`, followed by the drift check's report. `s16_push_exit=` is 0
   when the migrations are in place and there is no drift, 1 on drift after the push, 2 when it
   refused and pushed nothing, 3 when the dry run or the push failed, 4 when the drift check could
   not run, and 130 when interrupted.

2. Run item 1 again. It pushes nothing and asks nothing: it must print `s16_push_up_to_date=yes`
   and `s16_push_exit=0`.

3. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s16_logs_removed=yes"
   ```

### Step 17: The functions

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

The deploy workflow deploys the three functions the same way, in the gated `staging` job, and fails
unless the read-back of item 2 shows three `ACTIVE` functions, each with `verify_jwt` as
`config.toml` says. Their secrets stay with Step 18. For the pipeline, `SUPABASE_ACCESS_TOKEN` and
`SUPABASE_DB_PASSWORD` are environment secrets of the `staging` GitHub Environment and nowhere else.

The three functions are deployed from the linked work directory, so the CLI reads each function's
`verify_jwt` from `config.toml`. Their secrets are set in Step 18.

Secrets: `SUPABASE_ACCESS_TOKEN`.

1. Deploy all three:

   ```bash
   node_modules/.bin/supabase functions deploy \
     --project-ref "$REF" --workdir "$W" \
     --agent no --output-format text \
     > "$L/s17-deploy.log" 2>&1
   echo "s17_deploy_exit=$?"
   ```

2. The functions the project serves, from the Management API. The token is given to `curl` on its
   standard input, as a one-line configuration, by a shell builtin, as in Step 6.

   ```bash
   printf 'header = "Authorization: Bearer %s"\n' \
       "$SUPABASE_ACCESS_TOKEN" \
     | curl -sS -K - -o "$L/s17-functions.json" \
       -w 's17_list_http=%{http_code}\n' \
       "https://api.supabase.com/v1/projects/$REF/functions"
   jq -r 'sort_by(.slug)[] | "s17_function=\(.slug)"
     + " status=\(.status) verify_jwt=\(.verify_jwt)"' \
     "$L/s17-functions.json"
   ```

   It prints one `s17_function=<slug> status=<status> verify_jwt=<true|false>` line per function:
   three lines, each `status=ACTIVE`, with `verify_jwt=false` for `account-access` and
   `identity-callback` and `verify_jwt=true` for `send-email`.

3. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s17_logs_removed=yes"
   ```

### Step 18: The settings and the function secrets

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

← guide: [Hosted Supabase settings § How to verify](https://openvaa.org/developers-guide/deployment/hosted-settings#how-to-verify)

← guide: [Operations § The function secrets](https://openvaa.org/developers-guide/deployment/operations#the-function-secrets)

The root's settings resources and its function secrets are applied by the protocol of Steps 9 to 12,
for `R=scratch` and for `R=staging` alike: a saved plan and its named lines, the go-ahead, the apply
of that file, a second plan, and the read-back. Part A is one sitting, then you wait, and parts B
and C are the next sitting. The function secrets are `PUBLIC_PROJECT_ID`, `SITE_URL` and, when the
root sets `smtp`, the five `SMTP_` names; their values go into the plan file and into state, never
into a paste.

Secrets: `SUPABASE_ACCESS_TOKEN`, `TF_VAR_database_password` and, when the root sets `smtp`,
`TF_VAR_smtp_user` and `TF_VAR_smtp_password`. For `R=staging`, also `export AWS_PAGER=""`.

**Part A: the plan.** The plan file `tfplan` of this part is kept on purpose, for part B.

1. For `R=staging` only; it must print `s18_account=471112560111`:

   ```bash
   A=$(aws sts get-caller-identity --query Account \
     --output text)
   echo "s18_account=$A"
   ```

2. Initialise, plan and save the plan:

   ```bash
   T="infra/envs/$R/supabase"
   terraform -chdir="$T" init -input=false -no-color \
     > "$L/s18-init.log" 2>&1
   echo "s18_init_exit=$?"
   terraform -chdir="$T" plan -input=false -no-color \
     -out=tfplan > "$L/s18-plan.log" 2>&1
   echo "s18_plan_exit=$?"
   ```

3. The plan file's checksum, the resource headings, the summary line, and any line that names the
   password, a replacement or a destroy:

   ```bash
   S=$(shasum -a 256 "$T/tfplan" | cut -d' ' -f1)
   echo "s18_plan_sha256=$S"
   grep -n -E -e '^  # |^Plan:|^No changes' \
     -e 'database_password|must be replaced' \
     -e 'will be destroyed|forces replacement' \
     "$L/s18-plan.log" | sed 's/^/s18_plan_line=/'
   ```

4. Last item of part A. This removes the logs and keeps `tfplan`.

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s18_logs_removed=yes"
   ```

Do not apply. Whoever reads the lines reads them against the stop rules of Step 4, with
`s18_plan_exit=0` in place of the plan status of Step 3, and with these resource headings admitted:
`module.supabase.supabase_settings.this` and `module.supabase.supabase_edge_function_secrets.this`,
each as a creation or an update in place, and, while the root's send-email hook is on,
`module.supabase.supabase_settings.smtp_secret[0]` only as a destroy, which changes nothing on the
project; the summary line then reads `1 to destroy` in place of rule 3's `0 to destroy`, and the
destroy line it prints is that resource's. A root whose `enable_send_email_hook` is `false` admits
`smtp_secret[0]` as a creation or an update in place instead. The go-ahead names the SHA-256 and
the ref it was given for. If the reading says stop, nothing is applied and the plan file is removed with
`rm -f "infra/envs/$R/supabase/tfplan"`.

The first plan of a state that still holds `supabase_edge_function_secrets.this[0]` also prints
`module.supabase.supabase_edge_function_secrets.this[0] has moved to
module.supabase.supabase_edge_function_secrets.this`, from the module's `moved` block. That line
changes nothing on the project and is admitted; the plans after its apply no longer print it.

**Part B: the apply.** Begin with the lines of a sitting and `T="infra/envs/$R/supabase"`.

5. Compare the checksum with the one the go-ahead names. If they differ, do not apply: remove the
   plan file, write `answer_applied=not-applied`, and run item 9.

   ```bash
   S=$(shasum -a 256 "$T/tfplan" | cut -d' ' -f1)
   echo "s18_plan_sha256=$S"
   ```

6. Apply the saved plan, and remove the plan file whether the apply succeeded or failed:

   ```bash
   terraform -chdir="$T" apply -input=false -no-color \
     tfplan > "$L/s18-apply.log" 2>&1
   echo "s18_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s18-apply.log" \
     | sed 's/^/s18_apply_line=/'
   grep -E '^Error: ' "$L/s18-apply.log" \
     | sed 's/^/s18_error=/'
   rm -f "$T/tfplan"; echo "s18_plan_file_removed=yes"
   ```

   If the status is 0, write `answer_applied=yes`; otherwise write `answer_applied=error`, stop here
   and run item 9. Do not plan or apply again in this step.

7. Plan again. Status 0 means no change.

   ```bash
   terraform -chdir="$T" plan -input=false -no-color \
     -detailed-exitcode > "$L/s18-plan2.log" 2>&1
   echo "s18_second_plan_exit=$?"
   grep -n -E '^  # |^Plan:|^No changes' \
     "$L/s18-plan2.log" | sed 's/^/s18_plan2_line=/'
   ```

**Part C: the read-back.** It can also be run on its own, after the lines of a sitting and
`T="infra/envs/$R/supabase"`.

8. What the project serves. The auth settings the root manages are printed as in Step 6, without
   the SMTP fields, which follow on lines of their own: host, port, sender address and sender name,
   and whether an SMTP user name is set, as `yes` or `no` only. Then the API settings, and the name
   of each function secret, one `s18_secret_name=` line each. That list holds nothing but secrets,
   so it is printed by name and never with a value or a digest; it also holds the names the
   platform sets itself, which begin with `SUPABASE_`. The sender address is the one e-mail
   address a paste may hold. While the root's send-email hook is on, the module sends no SMTP
   setting to the auth service, so the `s18_smtp` lines read what the project already held, not
   what this apply wrote; only for a root whose `enable_send_email_hook` is `false` do they read
   the root's `smtp` object back.

   ```bash
   API="https://api.supabase.com/v1/projects/$REF"
   get() {
     printf 'header = "Authorization: Bearer %s"\n' \
         "$SUPABASE_ACCESS_TOKEN" \
       | curl -sS -K - -o "$L/s18-$1.json" \
         -w "s18_${1}_http=%{http_code}\n" "$API/$2"
   }
   get auth config/auth
   get api postgrest
   get secrets secrets
   KEYS=$(terraform -chdir="$T" output -json managed_auth_keys)
   jq -r --argjson k "$KEYS" 'to_entries[]
     | select(.key as $x | $k | index($x))
     | select(.key | test("^smtp_") | not)
     | select(.key | test("(^|_)(secret|secrets|pass)$") | not)
     | select(.key | test("(^|_)(passwd|password)$") | not)
     | select(.key | test("(^|_)(key|keys|token|tokens)$") | not)
     | "s18_auth.\(.key)=\(.value | tojson)"' "$L/s18-auth.json"
   jq -r '"s18_smtp.host=\(.smtp_host)",
     "s18_smtp.port=\(.smtp_port)",
     "s18_smtp.admin_email=\(.smtp_admin_email)",
     "s18_smtp.sender_name=\(.smtp_sender_name)",
     "s18_smtp_user_set=\((.smtp_user // "")
       | if . == "" then "no" else "yes" end)"' \
     "$L/s18-auth.json"
   jq -r --slurpfile h infra/modules/supabase/hosted-settings.json \
     'to_entries[] | select(.key as $x | $h[0].api | has($x))
     | "s18_api.\(.key)=\(.value | tojson)"' "$L/s18-api.json"
   jq -r '.[].name' "$L/s18-secrets.json" | sort \
     | sed 's/^/s18_secret_name=/'
   ```

   If a status is not 200, paste the `…_http=` line and nothing of that answer.

9. Last item, also when you stop early or a command failed:

   ```bash
   rm -f "infra/envs/$R/supabase/tfplan"
   test -n "$L" && rm -rf "$L" && echo "s18_logs_removed=yes"
   ```

### Step 19: The server's logging settings

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

The bootstrap sends the service-role key as a bound parameter and keeps it out of the log entry of a
statement that fails. A server that logs the parameters of a statement that succeeds, or of a slow
one, logs the key all the same, and the script cannot change that. These seven settings say whether
the server would. A setting of a module the server has not loaded reads as `(null)`.

Secrets: `SUPABASE_DB_PASSWORD`, exported also as `PGPASSWORD`, with Step 15's variables.

1. The seven settings, one `s19_setting.<name>=` line each:

   ```bash
   psql -X -At -F '=' > "$L/s19.out" 2>&1 <<'SQL'
   SELECT 's19_setting.' || s.name,
     coalesce(current_setting(s.name, true), '(null)')
   FROM (VALUES ('log_statement'),
     ('log_parameter_max_length'),
     ('log_min_duration_statement'),
     ('pgaudit.log'), ('pgaudit.log_parameter'),
     ('auto_explain.log_min_duration'),
     ('auto_explain.log_parameter_max_length')) AS s(name);
   SQL
   echo "s19_psql_exit=$?"
   grep '^s19_setting\.' "$L/s19.out"
   ```

2. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s19_logs_removed=yes"
   ```

Whoever reads the lines decides by this table. A row's "Would log" applies only together with its
partner setting:

| Setting                                 | Safe                                                   | Would log the parameters                                                                |
| --------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `log_statement`                         | `none` or `ddl`; the bootstrap's statements are `mod`  | `mod` or `all`, with `log_parameter_max_length` other than `0`                          |
| `log_parameter_max_length`              | `0`                                                    | `-1` or more than `0`, with either row above or below                                   |
| `log_min_duration_statement`            | `-1`                                                   | `0` or more, such as `10s`, with `log_parameter_max_length` other than `0`              |
| `pgaudit.log`                           | `(null)`, `none`, or classes without `write` and `all` | `write` or `all`, with `pgaudit.log_parameter` `on`                                     |
| `pgaudit.log_parameter`                 | `off` or `(null)`                                      | `on`, with the row above                                                                |
| `auto_explain.log_min_duration`         | `-1` or `(null)`                                       | `0` or more, such as `10s`, with `auto_explain.log_parameter_max_length` other than `0` |
| `auto_explain.log_parameter_max_length` | `0` or `(null)`                                        | `-1` or more than `0`, with the row above                                               |

When no row would log the parameters, Step 20 may run. When one would, the bootstrap waits until
whoever asked for the step has decided what to do.

### Step 20: The bootstrap

← guide: [Deployment § Feedback rate limit and Cloudflare](https://openvaa.org/developers-guide/deployment#feedback-rate-limit-and-cloudflare)

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

`infra/scripts/bootstrap.sql` writes the rows no migration can hold: the account, the project, its
settings row, the two rows of `public.storage_config` and the row of
`private.deployment_settings`. It runs twice, and both runs must leave the same rows. It runs only
after Step 19's settings were read and found safe, or the decision on them was made.

The deploy pipeline's `settings` stage runs `infra/scripts/check-deployment-settings.sql` after
every migration push and stops the run unless this step has left `behind_cloudflare` true
([`../../../README.md` § The gated job and its order](../../../README.md#the-gated-job-and-its-order)).

Secrets: `SUPABASE_DB_PASSWORD` (as `PGPASSWORD`, with Step 15's variables) and
`SUPABASE_SERVICE_ROLE_KEY`.

1. The environment the script reads. `BOOTSTRAP_BEHIND_CLOUDFLARE` is `true` or `false` as the dated
   record of the headers that reach a function and a database request, in "Observations", decides;
   that record is made before this step runs on either project. Every hosted project is opened for
   voters at its bootstrap.

   ```bash
   PUBLIC_PROJECT_ID=$(sed -n \
     's/^public_project_id *= *"\([0-9a-f-]*\)".*/\1/p' \
     "infra/envs/$R/supabase/terraform.tfvars")
   export PUBLIC_PROJECT_ID
   export BOOTSTRAP_STORAGE_URL="https://$REF.supabase.co"
   export BOOTSTRAP_BEHIND_CLOUDFLARE='<true or false>'
   export BOOTSTRAP_OPEN_FOR_VOTERS=true
   ```

   When whoever asked for the step gives a session statement timeout, such as `5s`, set `T` to it
   below; otherwise leave `T` empty. The timeout is set inside the bootstrap's own session, by a
   wrapper that runs the script only when the session reports the timeout. **`PGOPTIONS` does not
   do it:** the session pooler drops a startup option, and the session keeps the server's
   default.

   ```bash
   T=''
   B=infra/scripts/bootstrap.sql
   if [ -n "$T" ]; then
     B="$L/s20-boot.sql"
     printf '%s\n' '\set ON_ERROR_STOP on' \
       "SET statement_timeout = '$T';" \
       "SELECT 's20_session_timeout=' ||" \
       "  current_setting('statement_timeout');" \
       "SELECT current_setting('statement_timeout')" \
       "  = '$T' AS timeout_ok \gset" \
       '\if :timeout_ok' '\i infra/scripts/bootstrap.sql' \
       '\else' "SELECT 's20_timeout_guard=stopped';" \
       'SELECT 1/0;' '\endif' > "$B"
   fi
   ```

   With a timeout, each run below also prints `s20_boot<k>_session_timeout=`, which must be the
   value of `T`; a run whose session did not take it prints `s20_timeout_guard=stopped` in its log,
   exits 3 and writes nothing.

2. A function that prints the rows the bootstrap writes, as one count line
   `s20_counts<k>=accounts,projects,app_settings,storage_config,deployment_settings` and the two
   booleans `s20_open_for_voters<k>=` and `s20_behind_cloudflare<k>=`:

   ```bash
   s20_rows() {
     psql -X -At -v k="$1" <<'SQL'
   \getenv pid PUBLIC_PROJECT_ID
   SELECT 's20_counts' || :'k' || '=' || concat_ws(',',
     (SELECT count(*) FROM public.accounts),
     (SELECT count(*) FROM public.projects),
     (SELECT count(*) FROM public.app_settings),
     (SELECT count(*) FROM public.storage_config),
     (SELECT count(*) FROM private.deployment_settings));
   SELECT 's20_open_for_voters' || :'k' || '=' || open_for_voters
   FROM public.projects WHERE id = :'pid'::uuid;
   SELECT 's20_behind_cloudflare' || :'k' || '=' || behind_cloudflare
   FROM private.deployment_settings;
   SQL
   }
   ```

3. The first run and its rows:

   ```bash
   psql -X -At -f "$B" > "$L/s20-boot1.log" 2>&1
   echo "s20_boot1_exit=$?"
   sed -n 's/^s20_session_timeout=/s20_boot1_session_timeout=/p' \
     "$L/s20-boot1.log"
   s20_rows 1
   ```

4. The second run and its rows:

   ```bash
   psql -X -At -f "$B" > "$L/s20-boot2.log" 2>&1
   echo "s20_boot2_exit=$?"
   sed -n 's/^s20_session_timeout=/s20_boot2_session_timeout=/p' \
     "$L/s20-boot2.log"
   s20_rows 2
   ```

   Both count lines must read `1,1,1,2,1`, and the two pairs of booleans must be equal.

5. The seed check, which fails on anything of the local seed: a seed user, a local address or the
   demo key. It prints no key.

   ```bash
   psql -X -f infra/scripts/check-seed.sql \
     > "$L/s20-check-seed.log" 2>&1
   echo "s20_check_seed_exit=$?"
   ```

6. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s20_logs_removed=yes"
   ```

### Step 21: The first administrator

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

The project's first administrator is a user with the project-scope `admin` grant on the project.
The user is created in the dashboard and the grant is written by
`infra/scripts/grant-project-admin.sql`; a sign-in then shows the claims the access-token hook puts
into the token. On the throwaway project the user is a disposable one, with your own address.

Secrets: `SUPABASE_DB_PASSWORD` (as `PGPASSWORD`, with Step 15's variables) and `SUPABASE_ANON_KEY`.
The address is read into the shell and never pasted; the password is read without echoing it, and
neither it nor the token is ever printed or pasted.

1. Create the user in the dashboard: Authentication, Users, Add user, create a new user, with the
   administrator's own address, a password from your password manager, and the address confirmed at
   creation. **Never "Send invitation"**: the send-email hook takes every mail the auth service
   would send and sends none, so the invitation never arrives. Answer `answer_admin_created=yes`. If
   the user already exists, skip this item.

2. The address and the password:

   ```bash
   printf 'administrator address: '; read -r ADMIN_EMAIL
   export ADMIN_EMAIL
   printf 'administrator password: '; read -rs ADMIN_PASSWORD
   echo; export ADMIN_PASSWORD
   PUBLIC_PROJECT_ID=$(sed -n \
     's/^public_project_id *= *"\([0-9a-f-]*\)".*/\1/p' \
     "infra/envs/$R/supabase/terraform.tfvars")
   export PUBLIC_PROJECT_ID
   ```

3. The grant. It prints `grants_on_project=<n>`, here prefixed, and exits 3 with nothing written
   when no user or more than one user has the address, when the project does not exist, or when a
   variable is not set, each reason on an `s21_grant_error=` line that names no address. A second run
   adds nothing.

   ```bash
   psql -X -f infra/scripts/grant-project-admin.sql \
     > "$L/s21-grant.out" 2> "$L/s21-grant.err"
   echo "s21_grant_exit=$?"
   sed 's/^/s21_/' "$L/s21-grant.out"
   grep -o 'grant-project-admin: .*' "$L/s21-grant.err" \
     | sed 's/^/s21_grant_error=/'
   ```

4. A password sign-in. The body is built by `jq` from the environment and given to `curl` on its
   standard input; the answer, which holds the token, goes to `$L`. The anon key is the public key
   every page of the application carries.

   ```bash
   jq -n '{email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD}' \
     | curl -sS -o "$L/s21-token.json" \
       -w 's21_signin_http=%{http_code}\n' \
       -H "apikey: $SUPABASE_ANON_KEY" \
       -H 'Content-Type: application/json' --data-binary @- \
       "https://$REF.supabase.co/auth/v1/token?grant_type=password"
   unset ADMIN_PASSWORD
   ```

5. The token's claims: the payload is decoded in the shell, and only the claim names and the
   `grants` array are printed.

   ```bash
   jq -r '.access_token | split(".")[1]
     | gsub("-"; "+") | gsub("_"; "/")
     | . + ("=" * ((4 - length % 4) % 4))
     | @base64d | fromjson
     | "s21_claim_names=\(keys | join(","))",
       "s21_claim_grants=\(.grants | tojson)"' \
     "$L/s21-token.json"
   ```

   `s21_claim_grants=` must hold one object with `"scope":"project"`, the project's id and
   `"role":"admin"`.

6. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s21_logs_removed=yes"
   ```

### Step 22: The smoke dataset

← guide: [Deployment § Checking the instance](https://openvaa.org/developers-guide/deployment#checking-the-instance)

← guide: [Operations § The GitHub secrets](https://openvaa.org/developers-guide/deployment/operations#the-github-secrets)

The `smoke` template of `@openvaa/dev-seed` writes 1001 candidates and 1001 nominations into the
project, every row's external id beginning `smoke_`, and no auth user. It is seeded once per project:
the conformance probe reads more than 1000 rows of it in one request. The seed takes about 15
minutes, nearly all of it the candidates' portrait uploads, at about two a second. It is removed with
`yarn db:seed:teardown --prefix smoke_ --allow-remote`, with the same two variables exported.

Secrets: `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`.

1. The seed. dev-seed reads the repository's `.env` at start, where the local stack's address is,
   and a variable exported in the shell wins over it; so export both here, or the dataset lands on
   the local stack.

   The seed writes into the project `--project-id` names, the deployment's `public_project_id`; with
   `--allow-remote` the flag is required.

   ```bash
   export SUPABASE_URL="https://$REF.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY
   P=$(sed -n 's/^public_project_id *= *"\([0-9a-f-]*\)".*/\1/p' \
     "infra/envs/$R/supabase/terraform.tfvars")
   yarn db:seed --template smoke --allow-remote --project-id "$P" \
     > "$L/s22-seed.log" 2>&1
   echo "s22_seed_exit=$?"
   ```

2. An anonymous read of the project's nominations, which asks for the total and one row:

   ```bash
   Q="select=id&project_id=eq.$P&limit=1"
   curl -sS -o /dev/null -D "$L/s22-headers.txt" \
     -w 's22_read_http=%{http_code}\n' \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -H 'Prefer: count=exact' \
     "https://$REF.supabase.co/rest/v1/nominations?$Q"
   tr -d '\r' < "$L/s22-headers.txt" \
     | sed -n 's/^[Cc]ontent-[Rr]ange: */s22_rows_range=/p'
   ```

   `s22_rows_range=0-0/<total>` must give a total above 1000. A total of 0 means that no row is
   readable: the project is closed for voters or holds no nominations.

**The smoke contestant.** The deployed smoke run signs one contestant in and out again. The
contestant is one auth user with a password, at an address outside the `openvaa.test` domain (the
seed check fails on that domain), one entity-scope `editor` grant on the project's `smoke_`
candidate with the lowest external id that has a nomination, and one terms-of-use acceptance on the
project; `infra/scripts/grant-smoke-contestant.sql` writes the two rows. It is written once, at a
sitting the operator approves, and never by dev-seed. That sitting begins with the lines of the
sitting, with `R=staging`, and Step 15, then runs items 3 to 13 in order; its record lines begin
`s22c_`. No item prints the address, the password, a key or a token: the address is read from the
keychain, the password is made in the sitting, and both travel in the environment and on standard
input only. `printf` and `test` are shell builtins, so a value they are given is in no process's
arguments. A workstation reads the two back for `yarn test:e2e:deployed` from the same keychain
item, the password with `security find-generic-password -s openvaa-staging-smoke-contestant -w` and
the address from the item's `acct` attribute as item 6 reads it (see `tests/README.md` § Deployed
smoke run). A failed test of such a run can still leave both values in plaintext in its per-test
output directory, in the page snapshot of `error-context.md`, so that directory is treated as
secret on every run, green or red, and is never published, uploaded or attached. The sitting ends
with a dated row in "Observations".

Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and `PGPASSWORD` with Step 15's variables.

3. The ref, and the unset of every credential this part does not name:

   ```bash
   test "$REF" = cofbsatfrdysyphajsky \
     && echo "s22c_ref=ok"
   unset SUPABASE_ACCESS_TOKEN SUPABASE_SECRET_KEY \
     SUPABASE_DB_PASSWORD TF_VAR_database_password \
     TF_VAR_smtp_user TF_VAR_smtp_password
   ```

   It must print `s22c_ref=ok`. Without it the sitting stops here, with nothing written.

4. The keychain method, checked on a throwaway service before anything hosted is written. The
   command `security -i` runs is read from its standard input, so the value is never on a command
   line:

   ```bash
   S=openvaa-keychain-method-check
   V=$(openssl rand -hex 16)
   printf 'add-generic-password -U -s %s -a %s -w %s\n' \
     "$S" method-check "$V" | security -i
   K=$(security find-generic-password -s "$S" -w)
   test -n "$K" && test "$K" = "$V" \
     && echo "s22c_keychain_method=ok"
   security delete-generic-password -s "$S" > /dev/null
   security find-generic-password -s "$S" \
     > /dev/null 2>&1
   test "$?" = 44 \
     && echo "s22c_keychain_check_removed=yes"
   unset S V K
   ```

   It must print `s22c_keychain_method=ok` and `s22c_keychain_check_removed=yes`. If either is
   missing, the sitting stops here, with nothing hosted written.

5. The operator's one action, in their own terminal and before the sitting: the address, typed once
   into `read` and stored as the account of the keychain item `openvaa-staging-smoke-contestant`,
   with a placeholder password that item 11 replaces. The address is never typed into a command
   line or a transcript.

   ```bash
   printf 'contestant address: '; read -r A
   printf 'add-generic-password -U -s %s -a %s -w %s\n' \
     openvaa-staging-smoke-contestant "$A" placeholder \
     | security -i
   unset A
   ```

   It prints the prompt only. Answer `answer_contestant_address_stored=yes`.

6. The address, read from the item's `acct` attribute and never echoed, and the users that already
   have it, counted with the address as a bound parameter under a 5-second statement timeout:

   ```bash
   SMOKE_CONTESTANT_EMAIL=$(security find-generic-password \
     -s openvaa-staging-smoke-contestant \
     | sed -n 's/^ *"acct"<blob>="\(.*\)"$/\1/p')
   export SMOKE_CONTESTANT_EMAIL
   X=$(printf '%s' "$SMOKE_CONTESTANT_EMAIL" \
     | tr '[:upper:]' '[:lower:]')
   case "$X" in
     '') echo "s22c_address_read=no" ;;
     *@openvaa.test) echo "s22c_address_read=refused" ;;
     *) echo "s22c_address_read=yes" ;;
   esac
   unset X
   psql -X -q -At 2> "$L/s22c-users.err" <<'SQL'
   \set ON_ERROR_STOP on
   SET statement_timeout = '5s';
   SET log_parameter_max_length_on_error = 0;
   \getenv a SMOKE_CONTESTANT_EMAIL
   SELECT 's22c_users_before=' || count(*)
   FROM auth.users WHERE lower(email) = lower($1)
   \bind :a \g
   SQL
   echo "s22c_users_exit=$?"
   ```

   It must print `s22c_address_read=yes`, `s22c_users_before=0` and `s22c_users_exit=0`. Anything
   else stops the sitting here, with nothing written: an address in `openvaa.test` would fail the
   seed check, and a user who already has the address is either the contestant of an earlier
   sitting, removed first as below, or someone else.

7. The password, 32 random bytes in base64url without padding:

   ```bash
   SMOKE_CONTESTANT_PASSWORD=$(openssl rand -base64 32 \
     | tr '+/' '-_' | tr -d '=\n')
   export SMOKE_CONTESTANT_PASSWORD
   echo "s22c_password_length=${#SMOKE_CONTESTANT_PASSWORD}"
   ```

   It must print `s22c_password_length=43`. The hosted policy accepts it: `password_min_length` is 8
   and `password_required_characters` is empty in `infra/modules/supabase/hosted-settings.json`.

8. The user, created through the Auth Admin API with the address confirmed. The key goes into a
   header file in `$L` and the body, built by `jq` from the environment, goes to `curl` on its
   standard input; the answer, which holds the address, goes to `$L`:

   ```bash
   (umask 077
    printf 'apikey: %s\nAuthorization: Bearer %s\n' \
      "$SUPABASE_SERVICE_ROLE_KEY" \
      "$SUPABASE_SERVICE_ROLE_KEY" > "$L/s22c-service.h")
   jq -n '{email: env.SMOKE_CONTESTANT_EMAIL,
     password: env.SMOKE_CONTESTANT_PASSWORD,
     email_confirm: true}' \
     | curl -sS -o "$L/s22c-user.json" \
       -w 's22c_create_http=%{http_code}\n' \
       -H @"$L/s22c-service.h" \
       -H 'Content-Type: application/json' \
       --data-binary @- \
       "https://$REF.supabase.co/auth/v1/admin/users"
   ```

   It must print `s22c_create_http=200`. From here on the user exists: if the sitting stops before
   item 11 has stored the password, remove the user as below and begin again at item 3.

9. The grant. It prints its three lines, here prefixed, and exits 3 with nothing written on every
   refusal, each reason on an `s22c_grant_error=` line that names no address:

   ```bash
   PUBLIC_PROJECT_ID=$(sed -n \
     's/^public_project_id *= *"\([0-9a-f-]*\)".*/\1/p' \
     "infra/envs/$R/supabase/terraform.tfvars")
   export PUBLIC_PROJECT_ID
   psql -X -f infra/scripts/grant-smoke-contestant.sql \
     > "$L/s22c-grant.out" 2> "$L/s22c-grant.err"
   echo "s22c_grant_exit=$?"
   sed 's/^/s22c_/' "$L/s22c-grant.out"
   grep -o 'grant-smoke-contestant: .*' \
     "$L/s22c-grant.err" \
     | sed 's/^/s22c_grant_error=/'
   ```

   It must print `s22c_grant_exit=0`, `s22c_candidate=smoke_cand_0000`, `s22c_grants=1` and
   `s22c_terms=1`. A second run adds nothing and prints the same.

10. The readback: Step 21's password sign-in with the contestant's variables, the claims decoded as
    in Step 21 item 5, and a sign-out with the token, so the readback leaves no live session. The
    token goes into a header file in `$L`, never on a command line:

    ```bash
    jq -n '{email: env.SMOKE_CONTESTANT_EMAIL,
      password: env.SMOKE_CONTESTANT_PASSWORD}' \
      | curl -sS -o "$L/s22c-token.json" \
        -w 's22c_signin_http=%{http_code}\n' \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H 'Content-Type: application/json' \
        --data-binary @- \
        "https://$REF.supabase.co/auth/v1/token?grant_type=password"
    jq -r '.access_token | split(".")[1]
      | gsub("-"; "+") | gsub("_"; "/")
      | . + ("=" * ((4 - length % 4) % 4))
      | @base64d | fromjson
      | "s22c_claim_names=\(keys | join(","))",
        "s22c_claim_grants=\(.grants | tojson)"' \
      "$L/s22c-token.json"
    (umask 077
     jq -r '"Authorization: Bearer \(.access_token)"' \
       "$L/s22c-token.json" > "$L/s22c-user.h")
    curl -sS -o /dev/null -X POST \
      -w 's22c_logout_http=%{http_code}\n' \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H @"$L/s22c-user.h" \
      "https://$REF.supabase.co/auth/v1/logout"
    rm -f "$L/s22c-token.json" "$L/s22c-user.h"
    ```

    It must print `s22c_signin_http=200`, a `s22c_claim_grants=` array holding one object with
    `"scope":"entity"` and `"role":"editor"`, and `s22c_logout_http=204`.

11. The keychain store: the password replaces the placeholder of item 5, and a read-back compares
    equal:

    ```bash
    printf 'add-generic-password -U -s %s -a %s -w %s\n' \
      openvaa-staging-smoke-contestant \
      "$SMOKE_CONTESTANT_EMAIL" \
      "$SMOKE_CONTESTANT_PASSWORD" | security -i
    K=$(security find-generic-password \
      -s openvaa-staging-smoke-contestant -w)
    test -n "$K" \
      && test "$K" = "$SMOKE_CONTESTANT_PASSWORD" \
      && echo "s22c_keychain_stored=yes"
    unset K
    ```

    It must print `s22c_keychain_stored=yes`.

12. Step 20's seed check, with the service-role key unset first, then the unset of both contestant
    variables and the anon key:

    ```bash
    unset SUPABASE_SERVICE_ROLE_KEY
    psql -X -f infra/scripts/check-seed.sql \
      > "$L/s22c-check-seed.log" 2>&1
    echo "s22c_check_seed_exit=$?"
    unset SMOKE_CONTESTANT_EMAIL \
      SMOKE_CONTESTANT_PASSWORD SUPABASE_ANON_KEY
    ```

    It must print `s22c_check_seed_exit=0`.

13. Last item:

    ```bash
    unset SUPABASE_URL
    test -n "$L" && rm -rf "$L" && echo "s22_logs_removed=yes"
    ```

**Removing the contestant.** The user is deleted through the Auth Admin API, and the grant and the
acceptance go with it by `ON DELETE CASCADE` on both tables' `user_id` (seen on an isolated
database). Begin with the lines of the sitting,
`R=staging`, Step 15, item 3 and item 6 up to its `unset X`, which must print
`s22c_address_read=yes`. Secrets: as above.

1. The user's id, looked up by the address as a bound parameter:

   ```bash
   psql -X -q -At > "$L/s22c-user-id.txt" \
     2> "$L/s22c-lookup.err" <<'SQL'
   \set ON_ERROR_STOP on
   SET statement_timeout = '5s';
   SET log_parameter_max_length_on_error = 0;
   \getenv a SMOKE_CONTESTANT_EMAIL
   SELECT id FROM auth.users
   WHERE lower(email) = lower($1)
   \bind :a \g
   SQL
   echo "s22c_lookup_exit=$?"
   U=$(cat "$L/s22c-user-id.txt")
   N=$(grep -c . "$L/s22c-user-id.txt")
   echo "s22c_users_found=$N"
   ```

   It must print `s22c_lookup_exit=0` and `s22c_users_found=1`; otherwise stop here.

2. The delete:

   ```bash
   (umask 077
    printf 'apikey: %s\nAuthorization: Bearer %s\n' \
      "$SUPABASE_SERVICE_ROLE_KEY" \
      "$SUPABASE_SERVICE_ROLE_KEY" > "$L/s22c-service.h")
   curl -sS -o /dev/null -X DELETE \
     -w 's22c_delete_http=%{http_code}\n' \
     -H @"$L/s22c-service.h" \
     "https://$REF.supabase.co/auth/v1/admin/users/$U"
   ```

   It must print `s22c_delete_http=200`.

3. The rows that went with it:

   ```bash
   psql -X -q -At -v u="$U" <<'SQL'
   SELECT 's22c_rows_after=' || concat_ws(',',
     (SELECT count(*) FROM public.grants
      WHERE user_id = :'u'::uuid),
     (SELECT count(*) FROM public.terms_of_use_acceptances
      WHERE user_id = :'u'::uuid));
   SQL
   ```

   It must print `s22c_rows_after=0,0`.

4. The keychain item. `delete-generic-password` prints the item's attributes, the address among
   them, so its output is discarded:

   ```bash
   security delete-generic-password \
     -s openvaa-staging-smoke-contestant > /dev/null
   security find-generic-password \
     -s openvaa-staging-smoke-contestant \
     > /dev/null 2>&1
   test "$?" = 44 && echo "s22c_keychain_removed=yes"
   unset U N SMOKE_CONTESTANT_EMAIL \
     SUPABASE_SERVICE_ROLE_KEY
   ```

   It must print `s22c_keychain_removed=yes`.

5. Step 20 item 5, the seed check, and Step 23, the probe, again; then item 13 above; then a dated
   row in "Observations".

### Step 23: The conformance probe

← guide: [Deployment § Auth settings of a hosted project](https://openvaa.org/developers-guide/deployment#auth-settings-of-a-hosted-project)

← guide: [Deployment § Checking the instance](https://openvaa.org/developers-guide/deployment#checking-the-instance)

← guide: [Hosted Supabase settings § How to verify](https://openvaa.org/developers-guide/deployment/hosted-settings#how-to-verify)

← guide: [Operations § Restoring to a new project](https://openvaa.org/developers-guide/deployment/operations#restoring-to-a-new-project)

← guide: [Operations § The service-role key and the anon key](https://openvaa.org/developers-guide/deployment/operations#the-service-role-key-and-the-anon-key)

`infra/scripts/probe-hosted.mjs` compares what the project serves with what the repository declares
for it, through the Management API, the project's public API with the anon key only, and the
catalog over psql. It writes nothing to the project and never takes the service-role key. Each line
it prints is `PASS <check>` or `FAIL <check>: <finding>`, then one `NOTE key-model:` line; a source
that cannot be read gives one `COULD NOT RUN <source>: <reason>` line and no check line. Its status is
0 when every check passed, 1 when one failed and 2 when it could not run.

The two calls of `functions.identity-callback-unverified` carry no key at all, neither `apikey` nor
`Authorization`, because that is how the identity provider's browser redirect arrives, and because
a publishable key in `apikey` passes the gateway's JWT check (see "Observations", 2026-11-11).

Secrets: `SUPABASE_ACCESS_TOKEN` and `SUPABASE_ANON_KEY`, never `SUPABASE_SERVICE_ROLE_KEY`. The
catalog connection is Step 15's host and port, with the user and the password of the role ruled for
the probe: `postgres` (`postgres.<ref>` through the pooler) with the database password, or the role
named with the ruling. The role must bypass row-level security, or the seed check reads no rows.

1. The probe:

   ```bash
   node infra/scripts/probe-hosted.mjs \
     --root "infra/envs/$R/supabase" \
     > "$L/s23-probe.out" 2> "$L/s23-probe.err"
   echo "s23_probe_exit=$?"
   sed 's/^/s23_probe=/' "$L/s23-probe.out"
   ```

2. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s23_logs_removed=yes"
   ```

### Step 24: The backups, read

← guide: [Operations § What Supabase keeps](https://openvaa.org/developers-guide/deployment/operations#what-supabase-keeps)

This step reads the project's list of backups and its point-in-time recovery (PITR) state from the
Management API, with one `GET` of `/v1/projects/<ref>/database/backups`, an endpoint for which
Supabase's API reference names the scope `database:read`. It changes nothing on the project. A
restore is not part of it: this runbook starts no restore, neither from the API nor from the
dashboard. It can be run with either root; the persistent project's answer, with `R=staging`, is
the one the operations guide relies on.

Secrets: `SUPABASE_ACCESS_TOKEN`, and no other.

1. The read. The token is given to `curl` on its standard input, as a one-line configuration, by a
   shell builtin, as in Step 6.

   ```bash
   echo "s24_read_at=$(date -u +%Y-%m-%dT%H:%MZ)"
   printf 'header = "Authorization: Bearer %s"\n' \
       "$SUPABASE_ACCESS_TOKEN" \
     | curl -sS -K - -o "$L/s24-backups.json" \
       -w 's24_backups_http=%{http_code}\n' \
       "https://api.supabase.com/v1/projects/$REF/database/backups"
   ```

   If the status is not 200, paste the `s24_backups_http=` line, skip item 2 and run item 3.

2. What the answer says. It prints the region, whether PITR and the WAL-G archiving are on, the number
   of backups and how many of them are `COMPLETED`, and the times of the earliest and the latest
   physical backup, in Unix seconds. A field the answer lacks prints `null`, which is itself the
   observation.

   ```bash
   jq -r '"s24_region=\(.region)",
     "s24_pitr_enabled=\(.pitr_enabled)",
     "s24_walg_enabled=\(.walg_enabled)",
     "s24_backups=\(.backups | if . == null then null
       else length end)",
     "s24_completed=\(.backups | if . == null then null
       else map(select(.status == "COMPLETED")) | length end)",
     "s24_earliest_unix=\(.physical_backup_data
       .earliest_physical_backup_date_unix)",
     "s24_latest_unix=\(.physical_backup_data
       .latest_physical_backup_date_unix)"' \
     "$L/s24-backups.json"
   ```

3. Last item:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s24_logs_removed=yes"
   ```

## Settings and their guard

The hosted values live in [`../../../modules/supabase/hosted-settings.json`](../../../modules/supabase/hosted-settings.json),
in five groups: `api`, `auth`, `auth_hook` (the access-token hook), `auth_send_email_hook` (the
send-email hook) and `redirect_callback_paths`. The module adds what depends on the environment: the
site address and the redirect allow list, built from the root's `public_origin`, the rate limits, and
the SMTP settings while a root sets `smtp` and switches the send-email hook off. `terraform output -json managed_auth_keys` lists the auth
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
`enable_access_token_hook` and `enable_send_email_hook`, both `true` in each root. A root declares
them with no default, so a `terraform.tfvars` that leaves one out fails at plan. While a switch is
`false`, that hook's keys are left out of what is sent. The guard fails on a switch set to
`false` unless the assignment carries a comment that begins `hook off until` and gives the reason, for
example `enable_send_email_hook = false # hook off until <reason>`; such a root passes and is named in
the guard's report.

The send-email hook's function takes every mail the auth service would send and sends none; the
application's own function sends the mails. So while the send-email hook is on, the hosted auth service
sends no mail of its own, and the module sends it no SMTP setting, no SMTP credential and no
`rate_limit_email_sent`; their hosted values stay as they are. The root's `smtp` object, as the
staging root's `terraform.tfvars` sets it, then feeds only the Edge Functions' `SMTP_` secrets. That
object holds no user name and no password: the SMTP user name, which for SES is the access key id of
the SMTP user and half of the mail credential, is `TF_VAR_smtp_user`, and the password is
`TF_VAR_smtp_password`. Both are exported in the shell that plans, from the dns-mail root's outputs,
and written to no file. Step 18 sends them to the Edge Functions as `SMTP_USER` and `SMTP_PASS`, and
to the auth service too only for a root whose `enable_send_email_hook` is `false`, through a settings
resource of their own, so no plan diff shows them.

## Traps

Every Supabase root pins the provider at exactly 1.11.0 (`version = "= 1.11.0"`), because the first
and the third trap below rest on a reading of that version's source. A change of the pin goes together
with a new reading of the provider's decoding and import paths; `terraform init -upgrade` alone never
moves it.

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

> **A hook switched on before its function exists.** The hosted API accepts both hooks on a project
> that does not have their functions yet, so the apply does not fail. Both hooks point at database
> functions that the migrations create, and the auth service calls them when it issues a token or
> sends a mail, so apply the migrations before anyone signs in. If the apply of Step 5 or Step 11
> fails with an error that names a hook, set the switch of that hook to `false` in the root's
> `terraform.tfvars`, with the comment `# hook off until <reason>`, and start again from a new plan,
> which is read again before it is applied.

## Observations

← guide: [Deployment § Auth settings of a hosted project](https://openvaa.org/developers-guide/deployment#auth-settings-of-a-hosted-project)

← guide: [Deployment § Feedback rate limit and Cloudflare](https://openvaa.org/developers-guide/deployment#feedback-rate-limit-and-cloudflare)

← guide: [Deployment § The Supabase project](https://openvaa.org/developers-guide/deployment#the-supabase-project)

← guide: [Deployment § The per-caller limit of account-access](https://openvaa.org/developers-guide/deployment#the-per-caller-limit-of-account-access)

← guide: [Hosted Supabase settings § The staging instance as observed](https://openvaa.org/developers-guide/deployment/hosted-settings#the-staging-instance-as-observed)

| Date (UTC)    | Observation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-22    | The import of the throwaway project in Step 2 left no database password in state (`s7_password_in_state=false`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-22    | The organisation id the provider read on import equals the organisation slug in the dashboard's address.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-10-22    | A project of the organisation was created in `eu-north-1`, and the provider read that region on import.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-10-22    | On a new project the API returned the schema list as `public,graphql_public`, with no space after the comma, and the extra search path as `public, extensions`, with a space after it. `hosted-settings.json` uses each of the two forms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-22    | On a new project the redirect list (`uri_allow_list`) was an empty string, so its form for a non-empty value was not seen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-10-22    | The settings import holds only the keys whose value is not null. `password_required_characters`, `hook_custom_access_token_uri` and `hook_send_email_uri` were absent from it; a read of `/v1/projects/<ref>/config/auth` (status 200) returned each of the three names with the value null.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-10-22    | A new project holds `oauth_server_enabled` and `oauth_server_allow_dynamic_registration`, both `false`, and no `oauth_server_authorization_path`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-10-22    | The hosted API refused, with status 400, the auth update of a plan whose settings set `oauth_server_enabled` and `oauth_server_allow_dynamic_registration`, both `false`, and not `oauth_server_authorization_path`: "Both OAUTH_SERVER_ENABLED and OAUTH_SERVER_AUTHORIZATION_PATH must be provided together when updating OAuth configuration". The module sends neither key, and the guard does not compare them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-10-22    | On the imported throwaway project, with the password left out of state on import and its changes ignored, the first plan showed no change to the project and no password line; the plan of the corrected module on 2026-10-23 showed the same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-23    | The settings apply on the throwaway project succeeded, and the second plan exited 0 with "No changes", with the two schema lists and the redirect list as sent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-23    | The API returned the redirect list as sent: the two addresses joined by a comma, with no space and in the order sent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-23    | Every key the module sends was served as sent: 34 auth settings and 3 API settings, read back one by one. `password_required_characters` is served as `""`, not as null.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-10-23    | The hosted API accepted both hooks, the access-token hook and the send-email hook, on a project that does not have their functions, and serves each as on with its address.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-23    | The two Management API reads, `/v1/projects/<ref>/config/auth` and `/v1/projects/<ref>/postgrest`, answered with status 200 and a JSON object holding each setting as a top-level field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-10-23    | A destroy plan of the throwaway root exited 1. Its matching lines: `Error: Instance cannot be destroyed`, `Resource module.supabase.supabase_project.this has lifecycle.prevent_destroy` and `error and continue with the plan, either disable lifecycle.prevent_destroy or`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-10-23    | A plan with `-var enable_access_token_hook=false` exited 2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-23    | The persistent project `cofbsatfrdysyphajsky` was imported into this root, and its settings were applied (`Apply complete! Resources: 1 added, 0 changed, 0 destroyed.`). The second plan exited 0 with "No changes".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-23    | A destroy plan of the persistent root exited 1, with the same three matching lines as on the throwaway root. It names `module.supabase.supabase_project.this` and `lifecycle.prevent_destroy`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-23    | Every key the module sends was served by the persistent project as declared: 34 auth settings and 3 API settings, read back one by one, with both hooks on.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-23    | The persistent root's state object `hand/staging/supabase/terraform.tfstate` is in the bucket, encrypted with AES256 and versioned, and holds the project and the settings resource.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-08/09 | On the throwaway project, `psql` reached the database directly from a workstation, at `db.<ref>.supabase.co` on port 5432 as `postgres`; the session pooler was not needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-08/09 | The seven logging settings of the throwaway project, before any bootstrap: `log_statement=ddl`, `log_parameter_max_length=-1`, `log_min_duration_statement=-1`, `pgaudit.log=none`, `pgaudit.log_parameter=off`, `auto_explain.log_min_duration=10s` and `auto_explain.log_parameter_max_length=-1`. By the table of Step 19, a statement that succeeds is not logged with its parameters, and a statement slower than 10 seconds would be, through the two `auto_explain` settings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-08/09 | A project created in November 2026 issues the legacy `anon` and `service_role` keys, enabled, together with a `publishable` and a `secret` key, each named `default`. `/v1/projects/<ref>/api-keys/legacy` answered with status 200 and `enabled` true. The dashboard's API keys page shows the legacy keys enabled, offers "Disable JWT-based API keys" and gives "early 2027" as their retirement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-08/09 | The dashboard names the two switches "Allow new users to sign up" and "Confirm email", in the User Signups panel of Authentication, Sign In / Providers. On a new project both are on, and Authentication, Hooks lists no hook.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-08/09 | On a new project with no hook set, a password sign-in of a user created in the dashboard with its address confirmed answered with status 200, with the publishable key as `apikey`. It says nothing of a sign-in while the access-token hook is on and its function is absent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-09    | A throwaway project created on 2026-11-08 was read by the provider in `eu-west-1`. With `eu-north-1` in the variable file, the plan proposed an in-place change of the region; it was not applied, and the variable file now holds the region the provider reads.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-09    | With no state, the throwaway root's `import` block planned the project as an import with no change: `Plan: 1 to import, 3 to add, 0 to change, 0 to destroy.`, the three additions being the settings, the SMTP credential settings and the function secrets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-09/10 | The first apply of the throwaway root's reviewed settings plan imported the project and set the function secrets, then failed on the main settings resource: `Unable to update api settings, got status 500` ("Postgrest config update did not succeed within the expected time frame"). A read of `/v1/projects/<ref>/postgrest` right after showed the three API values in place. A new plan of the two settings resources not yet created (`Plan: 2 to add, 0 to change, 0 to destroy.`) was read against the same rules and applied with status 0. The cause of the 500 was not established.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-09/10 | Two settings resources work side by side for one project, the main settings and the SMTP credential settings, each keeping its own keys: after both were applied, the next plan exited 0 with "No changes".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-09/10 | The first SMTP enablement was accepted with the user name and the password sent by the second settings resource. The project serves the SMTP host, port `2587`, the sender address `noreply@staging.openvaa.org` and the sender name as declared, with an SMTP user name set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-09/10 | The function secrets read back by name are exactly the seven the module sets: `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_FROM`, `SMTP_HOST`, `SMTP_PASS`, `SMTP_PORT` and `SMTP_USER`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-09/10 | With the access-token hook on and its function not yet created, a password sign-in answered with status 500, `error_code` `unexpected_failure` and the message `Error running hook URI: pg-functions://postgres/public/custom_access_token_hook`; no token was issued. Between the first settings apply and Step 16 no one can sign in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-09/10 | On the throwaway project, `psql` could not translate `db.<ref>.supabase.co` from the same workstation that reached it directly the sitting before: the name had one AAAA record and no A record, and the workstation had an IPv6 default route. The session pooler on port 5432, with the user `postgres.<ref>`, worked, and the steps that followed used it. The cause of the failed lookup was not established.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-09/10 | Given the persistent project's ref with the throwaway's linked work directory, `push-migrations.sh` refused with status 2, printed nothing on standard output and pushed nothing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-09/10 | The CLI followed the symbolic links of the linked work directory when it pushed: the dry run listed `00001`, and the push applied it with status 0. Its connection path was printed as `unknown`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-09/10 | On a hosted database that holds only the migrations, the drift check after the push was clean with the CLI's default schema set: the history equals the manifest and the diff is empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-09/10 | The migration's buckets exist on a hosted project after the push: `private-assets`, not public, and `public-assets`, public. `postgres` owns the five bootstrap tables and can read `auth.users`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-10    | The three functions were deployed from the linked work directory with status 0: the CLI followed the symbolic link to `functions` and read `verify_jwt` from the linked `config.toml`. The Management API lists `account-access`, `identity-callback` and `send-email` as `ACTIVE`, with `verify_jwt` false for `identity-callback` alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-10    | On a function served with `verify_jwt` true, a call with the anon key in `apikey` alone and no `Authorization` header was refused by the hosted gateway with status 401, code `UNAUTHORIZED_NO_AUTH_HEADER` and the message `Missing authorization header`; the function did not run. This was seen on `account-access` (a `check-code` POST) and on `send-email` (a GET).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-10    | A call with the anon key in `apikey` and `Authorization: Bearer <anon key>`, the shape supabase-js sends without a session, reached the function: `account-access` answered a `check-code` POST with status 200 and its own `{"status":"unknown"}`, and `send-email` answered a GET with its own 405 `{"error":"Method not allowed"}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-11-10    | A call with the publishable key in both `apikey` and `Authorization: Bearer` passed the gateway's JWT check of `account-access`, although that header is not a JWT: the function answered a `check-code` POST with status 200 and its own `{"status":"unknown"}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-10    | With no identity provider configured, the served `identity-callback`, called with the anon key in `apikey` and no `Authorization` header, refused on its own: a GET answered 405 with `{"error":"Method not allowed"}`, and a POST of `{}` answered 500 with the fixed body `{"error":"Internal server error"}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-10    | The legacy anon key, in `apikey` and as the Bearer header, works for REST (`GET /rest/v1/elections`, status 200), for auth (`GET /auth/v1/settings`, status 200) and for function calls. The publishable key, in the same two headers, works for the same REST and auth requests (status 200 each) and for `account-access`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-10    | On the throwaway project, a request that carried its own `cf-connecting-ip` was refused by Cloudflare with status 403 and the body `error code: 1000`, before the project, both for a function and for a database request; the same request without that header was served. On every served request `cf-connecting-ip` was the connecting client, so a client cannot choose it, and the bootstrap of both projects sets `behind_cloudflare` true.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-10    | The headers that reach a function: `cf-connecting-ip`, `cf-ew-via`, `cf-ray`, `cf-visitor`, `cf-worker`, `x-forwarded-for` (rebuilt by the platform: a client-sent entry does not survive), `x-forwarded-port` and `x-forwarded-proto`. The headers that reach a database request: the same without `x-forwarded-port` and with `cf-ipcountry`; there `x-forwarded-for` keeps a client-sent value first and appends the connecting client last. No `x-real-ip`, `forwarded` or `via` header reached either.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-10    | The `anon` role's statement timeout ends a served request: an anonymous RPC that sleeps 9 s answered status 500 with SQLSTATE `57014` after about 8 s, and one that sleeps 7 s completed with status 204.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-10    | On a hosted database, the drift check exited 1 while two temporary functions existed, with a diff naming them and nothing else, and 0 after they were dropped. Its guard refused port 6543 and a host of another project with exit 2, before connecting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-10    | A second run of the push wrapper on a project holding every migration printed `push_up_to_date=yes`, pushed nothing, asked nothing and exited 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-11    | After `account-access` was deployed with `verify_jwt` false from the linked `config.toml`, the Management API lists it so, and a `check-code` POST with the legacy anon key in `apikey` alone, with no `Authorization` header, reached the function: status 200 and its own `{"status":"unknown"}`. With the key also as the Bearer header it answered the same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-11    | Through the session pooler, a statement timeout given as a startup option (`PGOPTIONS='-c statement_timeout=5s'`) did not reach the session: `show statement_timeout` returned `2min`. A `SET statement_timeout` in the same session took effect, and both bootstrap runs below ran under `5s`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-11    | On the throwaway project the bootstrap ran twice, each with status 0, and both runs left the same rows: one account, one project, one settings row, the two `storage_config` rows and one `deployment_settings` row (`1,1,1,2,1`), with `open_for_voters` and `behind_cloudflare` the same after each. The seed check that followed exited 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-11    | The throwaway project was bootstrapped with `behind_cloudflare` true and opened for voters; both values were read back from the database after each run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-11    | On the throwaway project the first administrator, given the project-scope `admin` grant by `grant-project-admin.sql` (`grants_on_project=1`), signed in with a password (status 200, publishable key). The token's `grants` claim holds exactly one object, `{"role":"admin","scope":"project","target_id":"00000000-0000-0000-0000-000000000001","target_type":null}`, the claim the access-token hook adds; the other claims are the auth service's own.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-11    | The `smoke` dataset was seeded on the throwaway project with the legacy service-role key (status 0, about 15 minutes), and an anonymous read of its nominations with the publishable key answered status 206 with `Content-Range: 0-0/1001`: 1001 rows readable without a session.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-11    | A sign-in mail from the served `account-access`, sent through SES on port `2587`, arrived: the function's witness read `sent` after 10 s, and the mail's `Date` header was one second after the request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-11    | The mail's `Authentication-Results` read `dkim=pass` for two signatures, `staging.openvaa.org` (aligned with the sender) and `amazonses.com`; `spf=pass` for the envelope domain `mail.staging.openvaa.org`; and `dmarc=pass` under the published policy `p=QUARANTINE`. Both copies of the sign-in link in the mail begin with `https://staging.openvaa.org/` and are the locale callback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-11    | While the send-email hook is on, a password-recovery request to the auth service (`POST /auth/v1/recover`, status 200) produced no mail within ten minutes. Two such requests made 22 s and 34 s after a link mail to the same user answered 429 with `over_email_send_rate_limit`; the one made 108 s after it answered 200. Wait more than 60 s after a link mail before a recovery request for the same user.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-11    | The verify endpoint (`GET /auth/v1/verify?token=…&type=magiclink&redirect_to=…`, no redirect followed) answered 303 with `error_code=otp_expired` for an unknown token, whether or not the target was admitted. An admitted target is the start of the location; a refused one sends the location to the site URL. Admitted: `/api/auth/callback`, `/en/api/auth/callback` and `/en/x/api/auth/callback` on the site's origin, so any path on the site URL's own origin is admitted and the allow list's single-segment pattern could not be told apart. Refused: the site's host on port 8443, and a foreign origin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-11    | With port `587` served in the auth settings and in the function secrets, and `account-access` redeployed afterwards, a link mail sent by the function was delivered: port 587 is open from a hosted Edge Function. The same sequence with port `2465` made the next send fail, which shows that the redeployed function uses the changed port.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-11    | With port `2465` served, a send from the served `account-access` failed: SES expects TLS first on that port and the function's transport speaks plain SMTP first. The function logged `account-access: a link could not be issued or mailed; its slot is given back {"name":"Error","code":"ETIMEDOUT"}`, its witness read `not-sent`, no link throttle row remained, and no mail arrived.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-11    | Straight after the apply that restored port `2587`, the auth settings still served `2465` and the next plan showed one in-place change of the settings resource (exit 2). About 20 seconds later the served port read `2587`, and a plan a minute after the apply read "No changes". The restore of the same change half an hour earlier showed no such delay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-11    | Before any fault was planted, the conformance probe of Step 23, with `postgres` as its catalog role (`postgres.<ref>` through the session pooler) and the publishable key as the anon key, printed `PASS` for all 22 checks on the throwaway project and exited 0. The project held the `smoke` dataset at the time. `no-seed` passed because it looks only for what `seed.sql` leaves behind (a user in the `openvaa.test` domain or with one of its two ids, a local address in `storage_config`, the demo key), and the `smoke` template creates none of these; no check of the probe looks for rows written by dev-seed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-11    | After the redirect fault was applied in the throwaway root (`supabase_settings.faults[0]` created), a read-only plan showed `module.supabase.supabase_settings.this` updated in place (exit 2): the provider refreshes the module's settings from the served values, so a planted value shows as drift of the module resource. The next fault plan, `-var fault_set=all`, therefore held both resources updated in place, `Plan: 0 to add, 2 to change, 0 to destroy.`, and was applied on the operator's ruling of the same day.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-11    | With the redirect fault alone planted and sign-up still closed, a request-link to the served `account-access`, after it was redeployed, was refused: the function logged `account-access: SITE_URL is not admitted by the auth redirect allowlist; no link issued`, and its witness read `not-sent` after 10 s.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-11    | With every fault of the batched break planted at once on the throwaway project, the conformance probe of Step 23 exited 1 with 21 `FAIL` lines, 1 `PASS` line and no `COULD NOT RUN` line. Each of the 21 findings named its own planted fault. `db.postgres-major` failed against an expectation of 16 set in the working tree's `config.toml` for that run only and put back afterwards, because a project's major version cannot be planted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-11    | In the same state, `functions.identity-callback-unverified` passed: `identity-callback`, listed by the Management API with `verify_jwt` true after a `PATCH` of its metadata (status 200, version unchanged), answered the probe's two calls without `Authorization`, made with the publishable key in `apikey`, with its own 405 and 500. Whether the gateway admits a publishable key without `Authorization`, or the `PATCH` does not reach the gateway, has not been told apart.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-11    | In the same state, with public sign-up open, a request-link to the served `account-access`, after it was redeployed, was refused: the function logged `account-access: public sign-up is not disabled on this deployment; no link issued`, and its witness read `not-sent` after 10 s.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-11-11    | With `identity-callback` still listed with `verify_jwt` true, a `GET` of it without `Authorization`, sent twice per shape, was refused by the gateway with 401 when it carried the legacy anon key in `apikey` and when it carried no header at all, and reached the function (its own 405) when it carried the publishable key in `apikey`. The gateway enforces the `verify_jwt` set by the metadata `PATCH`, and a publishable key in `apikey` alone passes its JWT check. The probe's `identity-callback` calls therefore carry no key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-11    | With every fault of the batched break still planted, the conformance probe, its `identity-callback` calls now made with no `apikey` and no `Authorization`, failed `functions.identity-callback-unverified`: the gateway answered 401 to the `GET` (expected the function's 405) and to the `POST {}` (expected its 500). With the red run before it, every check of the probe has been seen failing by its own planted fault on the throwaway. `db.postgres-major` passed in this run, which had no expectation override.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-11    | After the batched break, the revert plan of the scratch root with `-var fault_set=none -replace=module.supabase.supabase_settings.this` showed exactly the module settings resource replaced as requested and the fault resource destroyed (`Plan: 1 to add, 0 to change, 2 to destroy.`). Twenty seconds after its apply, the served settings read the declared values, and the second plan read "No changes".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-11    | The replaced settings resource left `oauth_server_enabled` and `oauth_server_allow_dynamic_registration` `true`, because the module sends neither key. A Management API update of `/config/auth` with both flags `false` and `oauth_server_authorization_path` answered 200, and 20 s later both flags read `false`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-11-11    | Deploying all three functions from the linked work directory set `identity-callback` back to `verify_jwt` false (version 6), and a `GET` of it with no key reached the function's own 405 at the first try. `send-email` was deployed again with `verify_jwt` true. `account-access` stayed at version 6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-11    | After the `private-assets` bucket had been deleted in the dashboard and its row inserted again with the migration's values, the drift check found `SCHEMA DRIFT`: the seven policies on `storage.objects` that name the bucket were missing, while the conformance probe passed. That the dashboard delete dropped them is likely but has not been measured on its own. Running the migration's seven `CREATE POLICY` statements in one transaction made the drift check clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-11    | After every fault of the batched break was reverted, the conformance probe passed all 22 checks and exited 0. With the seven bucket policies restored, the drift check exited 0. The throwaway project was seen green, then red by every planted fault, then green again.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-11    | With the persistent project in state, the first plan of this root since 2026-10-23 printed no import line: the root's `import` block planned nothing. The plan, with the `smtp` object and `public_project_id` set, showed exactly `module.supabase.supabase_settings.this` updated in place, `module.supabase.supabase_settings.smtp_secret[0]` and `module.supabase.supabase_edge_function_secrets.this[0]` created, and `Plan: 2 to add, 1 to change, 0 to destroy.`, with no line naming the database password.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-11    | On the persistent project, `psql` could not translate `db.<ref>.supabase.co` from a workstation (`s15_direct_exit=2`). The session pooler worked on port 5432 with the user `postgres.<ref>`. Its host was read from the Management API, `GET /v1/projects/<ref>/config/database/pooler` (status 200, field `db_host`): the session pooler host of shard `aws-0` in `eu-north-1`, the project's region.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-11    | Before any bootstrap, the seven logging settings of the persistent project read `ddl`, `-1`, `-1`, `none`, `off`, `10s` and `-1`, in the order of Step 19, the same values as on the throwaway project. A statement that succeeds is not logged with its parameters. A statement slower than 10 s would be, through `auto_explain.log_min_duration` and `auto_explain.log_parameter_max_length`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-11    | The persistent project issues the legacy `anon` and `service_role` keys, enabled (`/api-keys/legacy` answers 200 with `enabled` true), together with a publishable and a secret key, each named `default`. The dashboard shows the legacy keys as active, with the banner "Legacy API keys will be retired in early 2027", the same as on the throwaway project.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-11    | Before its first settings apply with `smtp` set, the persistent project served `smtp_port` as null, both hooks on, and `oauth_server_enabled` and `oauth_server_allow_dynamic_registration` both `false`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-11    | On the persistent project, `push-migrations.sh` pushed the frozen baseline `00001` (`push_status=0`), and the drift check after it was clean: the history equals the manifest and the diff is empty. A second run printed `push_up_to_date=yes`, pushed nothing and exited 0. Given the throwaway's ref with the persistent project's linked work directory, the wrapper refused with status 2 first. Run without a terminal, it refused with status 2 and pushed nothing; the push was confirmed from a terminal. Its connection path was printed as `unknown`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-11    | The persistent root's reviewed settings plan was applied whole on the first try (`Apply complete! Resources: 2 added, 1 changed, 0 destroyed.`), and the plan after it exited 0. The project serves the SMTP host, port `2587`, the sender address `noreply@staging.openvaa.org` and the sender name as declared, with an SMTP user name set, and the 34 auth and 3 API settings as sent; `oauth_server_enabled` and `oauth_server_allow_dynamic_registration` stayed `false`. The function secrets read back by name are exactly the seven the module sets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-11    | The three functions were deployed to the persistent project from its linked work directory with status 0, and the Management API lists `account-access`, `identity-callback` and `send-email` as `ACTIVE`, with `verify_jwt` false for the first two and true for `send-email`. A `GET` of `identity-callback` with no key reached the function's own 405.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-11    | After the push, the migration's buckets exist on the persistent project, in the database and through the Management API: `private-assets`, not public, and `public-assets`, public.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-11    | On the persistent project the bootstrap ran twice, each with status 0 and a 5 s statement timeout set in its own session through the session pooler, and both runs left the same rows: one account, one project, one settings row, the two `storage_config` rows and one `deployment_settings` row (`1,1,1,2,1`). Before the first run the only row was `deployment_settings`' default one, which the migration inserts. The seed check after the second run exited 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-11-11    | The persistent project was bootstrapped with `behind_cloudflare` true, from the throwaway's header record, and opened for voters; both values were read back from the database after each run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-11    | The persistent project's first administrator was not created in the dashboard as Step 21 item 1 says, because the operator was away: the Auth Admin API's `POST /auth/v1/admin/users` with the service-role key and `email_confirm: true` was used instead (status 200). The effect is the same: one user with the address, confirmed at creation, never invited, and no mail sent. Step 21 is unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-11    | On the persistent project the first administrator, given the project-scope `admin` grant by `grant-project-admin.sql` (`grants_on_project=1`), signed in with a password (status 200, publishable key). The token's `grants` claim holds exactly one object, the project-scope `admin` grant on the canonical project with `target_type` null, beside the auth service's own claims: the claims the access-token hook adds, the same as on the throwaway project.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-11    | The `smoke` dataset was seeded once on the persistent project with the legacy service-role key (status 0, about 5 minutes, against about 15 on the throwaway project), and an anonymous read of its nominations with the publishable key answered status 206 with `Content-Range: 0-0/1001`: 1001 rows readable without a session.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-11-11    | The conformance probe (Step 23) passed every check on the persistent project: status 0, twenty-two `PASS` lines, no `FAIL` and no `COULD NOT RUN`, with the publishable key, the catalog role `postgres` through the session pooler and no service-role key. Its note named the legacy anon and service-role keys, the default publishable and secret keys, and the legacy keys enabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-11    | The persistent project served every managed setting as declared, read back key by key as in Step 12 (both reads status 200): the 39 auth settings `managed_auth_keys` names, the SMTP host, port `2587`, sender address and sender name included, and the 3 API settings. `smtp_user` is not in `managed_auth_keys`, since its own settings resource sends it, and the project holds one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-12    | After its red and green probe runs and its header record, the throwaway project `begckvkapaopoztbreqc` was deleted by the operator in the dashboard, and the Management API then answered 404 for its ref. Its local state was removed with it: the scratch root's state files and `.terraform` directory, and its linked work directory. The scratch root's tracked files were kept for a later rehearsal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-11-14    | After the staging AWS root was destroyed (its runbook's Step 16), the persistent root's plan exited 0 with `No changes` and the conformance probe passed every check, status 0, 22 `PASS` lines, no `FAIL` and no `COULD NOT RUN`, through the session pooler: a teardown of the AWS root leaves the project, its data and its settings alone. A first probe run on the direct host from an IPv4-only network gave status 2 with `COULD NOT RUN catalog: psql exited 2 on the catalog query`, so Step 15 item 2 is needed whenever item 1 is not 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-15    | The smoke contestant was created on the persistent project at a sitting the operator approved (Step 22, items 3 to 13): one auth user through the Auth Admin API with the address confirmed (status 200), the `editor` grant on `smoke_cand_0000` and the terms-of-use acceptance (`grants=1`, `terms=1`), a password sign-in answering 200 with one entity editor grant in the token, the sign-out 204, and the seed check 0. The full deployed smoke run against `https://staging.openvaa.org` then passed with the service-role key unset and the contestant read from the keychain: five gate `PASS` lines, the voter walk to results and the contestant sign-in, complete home and sign-out (run directory `186-08-green-20261115T120003Z`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-17    | Step 18 was applied by hand to the persistent project (`R=staging`) by the operator, in the sitting of the pipeline's first green deploy and before its approval. The first plan exited 1: the provider answered 401 `Invalid access token` on `supabase_project.this`. A plan file left from an earlier sitting was found and removed unapplied, and the token was read again. The second plan exited 0 with one update in place of `module.supabase.supabase_settings.this` (`Plan: 0 to add, 1 to change, 0 to destroy.`), but its apply exited 1 with `Error: Project Services Unhealthy` (the services did not become active within the provider's timeout). The plan file was removed; `mailer_otp_length` still read `6` and `uri_allow_list` was unchanged, so nothing had been applied, and the eight services the provider waits on (auth, db, db_postgres_user, pg_bouncer, pooler, realtime, rest, storage) then read `ACTIVE_HEALTHY`. That this failure was transient has not been confirmed. The third plan showed the same single update: `mailer_otp_length` 6 to 10, and `uri_allow_list` from the two `/api/auth/callback` paths to `https://staging.openvaa.org/auth/confirm,https://staging.openvaa.org/*/auth/confirm`. The apply of the plan file whose sha256 the go-ahead named completed (`Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`), the plan after it read `No changes`, and the served auth settings (status 200) read `mailer_otp_length` 10 and that `uri_allow_list`. |
| 2026-11-19    | The deploy workflow's run 44491292876 on `deploy/staging`, commit `a7003b490`, pushed the appended migration `00023_invitation_caller_limit` to the persistent project under the `staging` review, before it deployed the functions. The dry run printed one pending version, `push_pending=00023`; the push was confirmed by the environment (`push_status=0`). The drift check after it read the manifest and the database's history both `00001` to `00023` and the schema diff empty, `drift_status=0`. The functions step then deployed `account-access`, `identity-callback` and `send-email` from the commit, each `ACTIVE` with `verify_jwt` as configured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-11-19    | The per-caller limit of migration `00023_invitation_caller_limit` was seen on the hosted `account-access` (attempt `20261119T095140Z.b5b5ecf9f`), every caller on `curl -4` with fresh unknown codes to `check-code`. AWS CloudShell was answered 200 thirty times and refused with 429 and `Retry-After: 593` at its 31st call (09:59:32Z). The workstation was answered 200 at 10:00:11Z, inside that window, was refused at its own 31st call with `Retry-After: 589` and the same body, `{"error":"too-many-requests"}`, and was answered 200 again at 10:10:18Z, after its window. Addresses were not recorded, and the throttle rows were left to expire.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-11-20    | At a read-only sitting the operator approved, the first probe run after the function deploy of 2026-11-19, the conformance probe (Step 23) passed every check on the persistent project: status 0, twenty-two `PASS` lines, no `FAIL` and no `COULD NOT RUN`, with the publishable key, the catalog role `postgres` through the session pooler (Step 15 item 2) and no service-role key. Among them `functions.verify-jwt` and `functions.identity-callback-unverified` passed, so the hosted `identity-callback` was deployed with `verify_jwt` as configured and, called with no key, answered 400 to a GET and 401 to a POST of an empty object. Its note again named the legacy keys enabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-20    | At the same sitting, through the session pooler, `select has_table_privilege('postgres', 'auth.users', 'UPDATE')` returned `t`: the role `postgres` held `UPDATE` on `auth.users` on the persistent project.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-11-20    | At a read-only sitting the operator approved, the persistent project answered the backups read of Step 24 (`R=staging`, read at 13:55Z) with status 200: region `eu-north-1`, PITR off (`pitr_enabled=false`), WAL-G archiving on (`walg_enabled=true`), and eight backups, all eight `COMPLETED`. The earliest and the latest physical backup times both printed `null`, so the answer gave no physical-backup range, and the read prints no backup dates, so the span of the eight is not known from it. No restore was started and nothing on the project changed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-21    | The deploy workflow's run 44939177207 on `deploy/staging`, commit `2ddc331d1`, the first with the settings stage. After the migrations step, which found none pending (`push_up_to_date=yes`, no `push_pending=` line) and read the manifest and the database's history both `00001` to `00024` with the schema diff empty (`drift_status=0`), the step "Check the deployment settings" ran `infra/scripts/check-deployment-settings.sql` against the persistent project through the session pooler and exited 0 (`settings_exit=0`): `private.deployment_settings` holds its row and `behind_cloudflare` reads true. The functions step then redeployed the three functions, each `ACTIVE`. The deployed smoke's caller-limit spec had thirty calls from the runner admitted by the hosted `account-access` (`caller_limit_admitted=30`) and the next refused with 429 and `Retry-After: 582` (`caller_limit_retry_after=582`). The runner's address was not recorded, and its throttle row was left to expire.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-11-25    | At a sitting the operator approved, the persistent project's database was reset to the restacked migrations and rebuilt (record `189.1.1-12-staging-rebuild`). `supabase db reset --linked --no-seed`, from a work directory holding only the migrations `00001` to `00004` and with `PGSSLMODE=verify-full` against the committed root, exited 0 with four migrations applied; the history then read `00001 00002 00003 00004`, where it had read `00001` to `00024`. The first bootstrap exited 3 and wrote nothing, because `infra/scripts/bootstrap.sql` cast an unset `BOOTSTRAP_ACCESS_CALLER_MAX` to `integer`; with that corrected the sitting resumed after the reset. The bootstrap (Step 20, `BOOTSTRAP_BEHIND_CLOUDFLARE=true`) exited 0 twice with counts `1,1,1,2,1`, `open_for_voters` and `behind_cloudflare` true, and the seed check 0. The `smoke` dataset was seeded (status 0; anonymous read 206, `Content-Range: 0-0/1001`) and the smoke contestant made again from the keychain item's address and password (create 200, `grants=1`, `terms=1`, sign-in 200, sign-out 204). `analytics.trackEvents` was set true by one statement and read true through the public REST API; `infra/scripts/check-deployment-settings.sql` exited 0. Not restored: every earlier auth user, the first administrator of Step 21 among them, and a setting made by hand (the candidate registration mode `identity_provider`). Staging served build `2ddc331d1` before and after.                                  |
| 2026-11-25    | The deploy workflow's runs 45586463676 and 45601966922 on `deploy/staging`, commits `be6fc2dd6` and `30316b108` (record `189.1.1-13-deploy`), each with `PGSSLMODE: verify-full` and the committed root `infra/certs/supabase-root-2021-ca.crt` on "Push the migrations" and "Check the deployment settings". Run 45586463676 printed one pending version, `push_pending=00005`, and pushed it (`push_status=0`): `public.invitation_caller_take` is dropped. The drift check read the manifest and the database's history both `00001` to `00005` and the schema diff empty (`drift_status=0`), the settings step exited 0 (`settings_exit=0`), and the three functions were deployed, each `ACTIVE`, `account-access` calling `access_caller_take`. Its smoke loaded no test: the entry imported a workspace package the deploy job does not build. Attempt 2 of run 45601966922, without that import, was green: nothing pending (`push_up_to_date=yes`), the same history, `drift_status=0`, `settings_exit=0`, three functions `ACTIVE`, `3 passed (51.7s)`. The caller-limit spec had thirty calls from the runner admitted (`caller_limit_admitted=30`) and the next refused with 429 and `Retry-After: 574`; the contestant spec signed in with the environment's contestant secrets as the smoke contestant made again at the rebuild. Both runs printed `push_connection=unknown`, so they do not show whether the CLI connected through the session pooler. The runner's throttle row was left to expire.      |
