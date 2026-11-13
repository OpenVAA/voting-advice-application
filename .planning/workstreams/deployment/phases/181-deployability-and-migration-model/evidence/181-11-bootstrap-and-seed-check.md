MISSING_VAR_EXIT=3
MALFORMED_ID_EXIT=3
RUN1_EXIT=0
RUN2_EXIT=0
ROWS_AFTER_RUN2=accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1
SECOND_RUN_KEEPS_OPEN_FOR_VOTERS=yes
ROTATED_KEY_APPLIED=yes
KEY_STORED_UNQUOTED=yes
KEY_OCCURRENCES_IN_SERVER_LOG=0
SEED_CHECK_BOOTSTRAPPED_EXIT=0
MISSING_VAR_WROTE_NOTHING_AND_NAMED_IT=yes
MALFORMED_ID_WROTE_NOTHING=yes
MALFORMED_BOOLEAN_STATUS=3
MALFORMED_BOOLEAN_ROLLED_BACK=yes
EMPTY_VAR_STATUS=3
EMPTY_VAR_WROTE_NOTHING_AND_NAMED_BOTH=yes
OUTSIDE_VARIABLE_STATUS=3
OUTSIDE_VARIABLE_DISCARDED=yes
ROWS_AFTER_RUN1=accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1
ROWS_SAME_AFTER_BOTH_RUNS=yes
OPEN_FOR_VOTERS_AFTER_RUN2=f
BEHIND_CLOUDFLARE_AFTER_RUN2=t
STORAGE_CONFIG_KEYS_AFTER_RUN2=service_role_key,supabase_url
RUN3_STATUS=0
ADMIN_CHANGES_KEPT=yes
RUN4_STATUS=0
RUN5_STATUS=0
CORRECTED_ADDRESS_AND_FLAG_APPLIED=yes
KEY_STATEMENT_FAILED_STATUS=3
FAILED_STATEMENT_TEXT_IN_SERVER_LOG=1
KEY_OCCURRENCES_IN_PSQL_OUTPUT=0
UNBOUND_COPY_STATUS=3
KEY_OCCURRENCES_IN_SERVER_LOG_UNBOUND_COPY=1
PARAMETER_LOGGING_ASKED_STATUS=3
KEY_OCCURRENCES_WITH_PARAMETER_LOGGING_ASKED=0
NO_SET_COPY_STATUS=3
KEY_OCCURRENCES_IN_SERVER_LOG_NO_SET_COPY=1
KEY_OCCURRENCES_IN_PSQL_OUTPUT_NO_SET_COPY=1
BOOTSTRAP_INCLUDED_WITHOUT_ON_ERROR_STOP_STATUS=0
BOOTSTRAP_INCLUDED_WITH_ON_ERROR_STOP_STATUS=3

# The bootstrap script and the seed check, shown on isolated instances

Part 1 is the bootstrap on a database with no seed (Task 2 of plan 181-11). Part 2, further down, is the seed check on a seeded database (Task 3).

## How to read the lines above

The first ten lines are the ones the plan names, in the plan's order. The lines after them were added by this plan; none of their names ends in `_EXIT` except those the plan names.

Every line was written by the driver script from a command's own status (`$?`, never through a pipe) or from a comparison the script made. None was typed. The driver is `tmp/181-11/task2.sh` (ignored by git); the transcript it wrote is quoted whole in "Transcript" below.

| Line | What it says |
|------|--------------|
| `MISSING_VAR_EXIT=3` | Control 1. `BOOTSTRAP_STORAGE_URL` not given, the other three given: psql exits 3 |
| `MALFORMED_ID_EXIT=3` | Control 2. `PUBLIC_PROJECT_ID=not-a-uuid`: psql exits 3 |
| `RUN1_EXIT=0`, `RUN2_EXIT=0` | The two green runs with one environment |
| `ROWS_AFTER_RUN2` | The five counts after run 2, as `psql -X -At` returned them |
| `SECOND_RUN_KEEPS_OPEN_FOR_VOTERS=yes` | Control 4. The column was set to true by an `UPDATE`; run 3 with `BOOTSTRAP_OPEN_FOR_VOTERS=false` exited 0 and the column is still true |
| `ROTATED_KEY_APPLIED=yes` | Control 5. Before run 4 the stored value equals the first key and not the second; after it, the second and not the first |
| `KEY_STORED_UNQUOTED=yes` | Control 6. The first and the last stored character are not quote characters and `length(value)` equals the variable's length |
| `KEY_OCCURRENCES_IN_SERVER_LOG=0` | Control 7. The sum of four counts over the container's log, taken after the key statement was made to fail: the three keys used up to then, and any made-up key by its shape |
| `SEED_CHECK_BOOTSTRAPPED_EXIT=0` | Control 8. The seed check on the bootstrapped database |
| `MISSING_VAR_WROTE_NOTHING_AND_NAMED_IT` | After control 1 the counts of `accounts`, `projects`, `app_settings` and `storage_config` are 0, standard error names `BOOTSTRAP_STORAGE_URL`, and names no other required variable |
| `MALFORMED_ID_WROTE_NOTHING` | After control 2 the same four counts are 0 |
| `MALFORMED_BOOLEAN_STATUS`, `MALFORMED_BOOLEAN_ROLLED_BACK` | Added. `BOOTSTRAP_BEHIND_CLOUDFLARE=perhaps` is refused by the last statement of the transaction, after five inserts had run; the four counts are 0 afterwards |
| `EMPTY_VAR_STATUS`, `EMPTY_VAR_WROTE_NOTHING_AND_NAMED_BOTH` | Added. An empty key and an address of three spaces count as not set |
| `OUTSIDE_VARIABLE_STATUS`, `OUTSIDE_VARIABLE_DISCARDED` | Added. psql variables named `service_role_key` and `storage_url`, set before the script runs, are not used |
| `ROWS_AFTER_RUN1`, `ROWS_SAME_AFTER_BOTH_RUNS` | The counts after run 1, and whether the counts and the seven detail lines are identical after both runs (`cmp`) |
| `OPEN_FOR_VOTERS_AFTER_RUN2`, `BEHIND_CLOUDFLARE_AFTER_RUN2`, `STORAGE_CONFIG_KEYS_AFTER_RUN2` | The three values the plan asks for beside the counts |
| `RUN3_STATUS`, `ADMIN_CHANGES_KEPT` | Run 3 of control 4. Beside `open_for_voters`, the account's name, the project's name and locale, and the settings row were changed by hand and are unchanged by run 3 |
| `RUN4_STATUS` | The run of control 5 |
| `RUN5_STATUS`, `CORRECTED_ADDRESS_AND_FLAG_APPLIED` | Added. A second address and `BOOTSTRAP_BEHIND_CLOUDFLARE=false` replace the stored ones |
| `KEY_STATEMENT_FAILED_STATUS` | The status of the run of control 7 |
| `FAILED_STATEMENT_TEXT_IN_SERVER_LOG` | Lines of the same log that hold the failed statement's text with its `$1`. It is 1, so the log did record the failure, and the 0 above is not the 0 of an empty log |
| `KEY_OCCURRENCES_IN_PSQL_OUTPUT` | Lines of psql's own output in control 7 that hold the key |
| `UNBOUND_COPY_STATUS`, `KEY_OCCURRENCES_IN_SERVER_LOG_UNBOUND_COPY` | Added red control. A copy of the script with the key in the statement's text, under the same trigger: its key is in the log |
| `PARAMETER_LOGGING_ASKED_STATUS`, `KEY_OCCURRENCES_WITH_PARAMETER_LOGGING_ASKED` | Added. The script as committed, on a connection that sets `log_parameter_max_length_on_error=-1`: the sum of the key's lines in the server log and in psql's output |
| `NO_SET_COPY_STATUS`, `KEY_OCCURRENCES_IN_SERVER_LOG_NO_SET_COPY`, `KEY_OCCURRENCES_IN_PSQL_OUTPUT_NO_SET_COPY` | Added red control. A copy without the script's `SET` line on the same kind of connection: its key is in the log and in psql's output |
| `BOOTSTRAP_INCLUDED_WITHOUT_ON_ERROR_STOP_STATUS`, `BOOTSTRAP_INCLUDED_WITH_ON_ERROR_STOP_STATUS` | Added. The status psql gives when a failing bootstrap is run through `\i` from another script |

## What was run on

| Item | Value |
|------|-------|
| Commit | `821cf36b7ca90c9fd9a7665f033973c90e2315cf`, no tracked change in the worktree |
| Time | 2026-10-12, 20:01:07Z to 20:01:30Z |
| Instance | `boot`, `isolated-instance.sh start --name boot --mode db --port-base 55700 --migrations apps/supabase/supabase/migrations`, no seed. One container, `supabase_db_openvaa-iso-boot`, publishing 55701 |
| Port base | 55700, not the harness default the plan's frontmatter names (55400). The dispatch of this plan orders a base outside 55400 to 55409 and 55500 to 55509, which the equivalence check uses |
| Tools | psql 17.6 on the host, Node v24.21.0, Supabase CLI 2.118.0 |
| Connection | the libpq variables `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE` and `PGPASSWORD`, taken from the harness's `env` subcommand by `eval` and never displayed. Connected as `postgres`, which is not a superuser on this image and owns all five tables |
| The command | `psql -X -f infra/scripts/bootstrap.sql` and `psql -X -f infra/scripts/check-seed.sql`, with nothing else on the command line, in every run of the committed scripts. Counts and values were read with `psql -X -At -v ON_ERROR_STOP=1 -c <query>` |

Two scratch drivers had been run before, against a first instance of the same name, while the two scripts were being written (before commit `821cf36b7`). That instance was stopped and removed before this one was started, and nothing of it is quoted here.

## The keys

Six made-up values were used, each held in a shell variable of the driver and in no file. None is a JWT. Five are a fixed 19-character prefix followed by 32 random hexadecimal digits (51 characters). The second one, used for the rotation, was given another prefix and 40 digits (57 characters), because two values of the same length and the same first 19 characters could not be told apart by the comparison the plan orders.

"The stored key equals the variable" is three comparisons made by the driver: `length(value)`, `left(value, 19)` and `md5(value)` against the same three of the variable. Neither a value nor a digest was printed.

A count of a key in a file is `grep -c -F -f <(printf '%s\n' "$KEY") <file>`, so the key is not on a command line either.

When the driver ended it searched every file it kept for all six values: 0 found. The container's log and the output of the two red-control copies did hold a key and were removed by the driver (the transcript says where).

## What the controls show

**Nothing is written when a run is refused.** Controls 1 and 2 and three added ones end with status 3 and leave `accounts`, `projects`, `app_settings` and `storage_config` empty. `private.deployment_settings` holds one row before any run, the migration's own, with `behind_cloudflare` false, and it is still false after controls 1 and 2 and after the malformed boolean (it was not read after the other two). The added control with a malformed boolean is the stronger form of control 2: five inserts had succeeded inside the transaction when the sixth statement failed, and none remained.

**Two runs, the same rows.** Run 1 prints `INSERT 0 1` six times. Run 2 prints `INSERT 0 0` for the account, the project and the settings row, and `INSERT 0 1` for the three rows that are overwritten. The counts and the seven detail lines are identical after both.

**A second run does not undo an administrator's change.** Run 3 was given `BOOTSTRAP_OPEN_FOR_VOTERS=false` and three other optional values that differ from what the rows held. All seven detail lines are the same before and after.

**The key is not in the server log, and that 0 can be told from an empty log.** The failed statement is in the log with its text, placeholder included, once. The same failure with the key written into the statement's text puts the key in the log once.

## Three findings beyond the plan

1. **Bound parameters are safe from the log only while the server does not log parameters.** On this image `log_parameter_max_length_on_error` is 0 and can be set by any user. With it at -1 a failed statement's parameters are written to the server log, in the error's context line, and the key is also in psql's own output, so it would be on the operator's terminal (the last red control: 1 line in the log, 1 line in psql's output). The script therefore sets `log_parameter_max_length_on_error = 0` for its session as its first statement. With that line and the same connection setting, the key is in neither place.
   What the script cannot change, because the settings are for superusers: a server that logs statements that succeed (`log_statement` at `mod` or `all`, or `log_min_duration_statement`, with `log_parameter_max_length` other than 0), `pgaudit.log` with `pgaudit.log_parameter` on, and `auto_explain`. The values of this image are in the transcript: `log_statement = ddl`, `pgaudit.log = none`, and `auto_explain.log_min_duration = 10000` with `auto_explain.log_parameter_max_length = -1`. By those two values, a statement of the script that ran for more than ten seconds would have its parameters logged. That was not produced here; it is read from the two settings and from what `auto_explain` is documented to do.
2. **Through `\i` the status is not the script's.** A failing bootstrap run by itself exits 3. Included by a script that holds only the `\i` line, psql exits 0. Included by a script that sets `ON_ERROR_STOP` before the `\i` line, it exits 3. The bootstrap's header says to run it by itself. The seed check's case is in part 2.
3. **An empty value counts as not set.** The plan orders a test of whether a variable is defined. An environment file with a blank `SUPABASE_SERVICE_ROLE_KEY=` line defines the variable, and the script would have stored an empty key and exited 0. The script treats an empty or whitespace-only required value as not set, and an empty optional value as its default.

## Not measured

- A hosted project. Everything here ran against a local database container of the Supabase CLI. Whether `postgres` owns the five tables on Supabase Cloud, and what the hosted server's logging settings are, is for phase 184.
- A statement that succeeds on a server that logs parameters (`log_statement = all`). No setting of the instance was changed for it.
- A key that holds a newline. One with a space, both quote characters, a backslash, a colon, `$1` and a semicolon was stored as given in a trial before the commit; that trial is not part of this record.
- `BOOTSTRAP_OPEN_FOR_VOTERS=true` on a first run.
- Two bootstrap runs at the same moment.

## The shared stack

`docker ps --format '{{.Names}} {{.ID}}'`, sorted, before the first instance of the plan and after this instance was stopped: `diff` exits 0 over all 24 containers, and `cmp` exits 0 over the 13 whose name ends `_openvaa-local`. No container, volume or network with `openvaa-iso-` in its name is left.

## Transcript

Written by the driver. Indented lines are a command's output, unchanged.

```text
HEAD: 821cf36b7ca90c9fd9a7665f033973c90e2315cf
tracked changes: 0
started: 2026-10-12T20:01:07Z
psql: psql (PostgreSQL) 17.6 (Homebrew)
node: v24.21.0; supabase CLI: 2.118.0

## start --name boot --mode db --port-base 55700 --migrations apps/supabase/supabase/migrations (no seed)
status: 0, 15 s
database container: supabase_db_openvaa-iso-boot, port 55701

## The database before any run
accounts:0 projects:0 app_settings:0 storage_config:0
private.deployment_settings rows: 1, behind_cloudflare=f (the migration's own row)
auth.users rows: 0
connected as: postgres, superuser: f
owners of the five tables: private.deployment_settings=postgres public.accounts=postgres public.app_settings=postgres public.projects=postgres public.storage_config=postgres
server settings that decide whether a parameter is logged:
    auto_explain.log_min_duration = 10000 (context superuser)
    auto_explain.log_parameter_max_length = -1 (context superuser)
    log_destination = stderr (context sighup)
    log_min_duration_statement = -1 (context superuser)
    log_min_error_statement = error (context superuser)
    log_parameter_max_length = -1 (context superuser)
    log_parameter_max_length_on_error = 0 (context user)
    log_statement = ddl (context superuser)
    logging_collector = off (context postmaster)
    pgaudit.log = none (context superuser)
    pgaudit.log_parameter = off (context superuser)

## Control 1: BOOTSTRAP_STORAGE_URL not given (the other three required variables given)
status: 3
standard output:
    SET
standard error:
    bootstrap: BOOTSTRAP_STORAGE_URL is not set
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/bootstrap.sql:130: ERROR:  bootstrap: required environment variables are not set, and nothing was written
    CONTEXT:  PL/pgSQL function inline_code_block line 1 at RAISE
afterwards: accounts:0 projects:0 app_settings:0 storage_config:0, behind_cloudflare=f
lines of standard error naming BOOTSTRAP_STORAGE_URL: 1; naming another required variable: 0

## Control 2: PUBLIC_PROJECT_ID=not-a-uuid (all four given)
status: 3
standard output:
    SET
    BEGIN
    INSERT 0 1
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/bootstrap.sql:150: ERROR:  invalid input syntax for type uuid: "not-a-uuid"
    LINE 3:   'not-a-uuid'::uuid,
              ^
afterwards: accounts:0 projects:0 app_settings:0 storage_config:0, behind_cloudflare=f

## Added control: BOOTSTRAP_BEHIND_CLOUDFLARE=perhaps (refused by the last statement of the transaction, after five inserts)
status: 3
standard output:
    SET
    BEGIN
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/bootstrap.sql:167: ERROR:  invalid input syntax for type boolean: "perhaps"
    LINE 2: VALUES (true, 'perhaps'::boolean)
                          ^
afterwards: accounts:0 projects:0 app_settings:0 storage_config:0, behind_cloudflare=f

## Added control: SUPABASE_SERVICE_ROLE_KEY given as the empty string, BOOTSTRAP_STORAGE_URL as three spaces
status: 3
standard error:
    bootstrap: BOOTSTRAP_STORAGE_URL is not set
    bootstrap: SUPABASE_SERVICE_ROLE_KEY is not set
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/bootstrap.sql:130: ERROR:  bootstrap: required environment variables are not set, and nothing was written
    CONTEXT:  PL/pgSQL function inline_code_block line 1 at RAISE
afterwards: accounts:0 projects:0 app_settings:0 storage_config:0

## Added control: two psql variables set from outside, their environment variables not given
The including script holds three lines: \set ON_ERROR_STOP on, \set service_role_key <a made-up word>, \set storage_url <a made-up word>, then \i of the bootstrap. Command: psql -X -f <that file>.
status: 3
standard error:
    bootstrap: BOOTSTRAP_STORAGE_URL is not set
    bootstrap: SUPABASE_SERVICE_ROLE_KEY is not set
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/bootstrap.sql:130: ERROR:  bootstrap: required environment variables are not set, and nothing was written
    CONTEXT:  PL/pgSQL function inline_code_block line 1 at RAISE
afterwards: accounts:0 projects:0 app_settings:0 storage_config:0

## Run 1 (PUBLIC_PROJECT_ID=00000000-0000-0000-0000-00000000b007, BOOTSTRAP_STORAGE_URL=https://bootstrap-check.example.test, a made-up key of 51 characters, BOOTSTRAP_BEHIND_CLOUDFLARE=true; no optional variable)
status: 0
standard output:
    SET
    BEGIN
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    COMMIT
standard error (0 bytes):
afterwards: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1
    accounts: id=00000000-0000-0000-0000-000000000001 name=Default Account
    projects: id=00000000-0000-0000-0000-00000000b007 account_id=00000000-0000-0000-0000-000000000001 name=Default Project default_locale=en open_for_voters=false
    app_settings: project_id=00000000-0000-0000-0000-00000000b007 settings={}
    storage_config: key=service_role_key length(value)=51
    storage_config: key=supabase_url length(value)=36
    storage_config: supabase_url value=https://bootstrap-check.example.test
    deployment_settings: singleton=true behind_cloudflare=true
the stored key equals the variable (length, first 19 characters, digest): yes

## Run 2 (the same environment)
status: 0
standard output:
    SET
    BEGIN
    INSERT 0 0
    INSERT 0 0
    INSERT 0 0
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    COMMIT
standard error (0 bytes):
afterwards: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1
    accounts: id=00000000-0000-0000-0000-000000000001 name=Default Account
    projects: id=00000000-0000-0000-0000-00000000b007 account_id=00000000-0000-0000-0000-000000000001 name=Default Project default_locale=en open_for_voters=false
    app_settings: project_id=00000000-0000-0000-0000-00000000b007 settings={}
    storage_config: key=service_role_key length(value)=51
    storage_config: key=supabase_url length(value)=36
    storage_config: supabase_url value=https://bootstrap-check.example.test
    deployment_settings: singleton=true behind_cloudflare=true
the detail lines after run 2 compared with those after run 1 (cmp): status 0
open_for_voters=f behind_cloudflare=t storage_config keys=service_role_key,supabase_url

## Control 4: what an administrator changed survives a run
UPDATE 1
UPDATE 1
UPDATE 1
before run 3:
    accounts: id=00000000-0000-0000-0000-000000000001 name=Renamed account
    projects: id=00000000-0000-0000-0000-00000000b007 account_id=00000000-0000-0000-0000-000000000001 name=Renamed by an administrator default_locale=fi open_for_voters=true
    app_settings: project_id=00000000-0000-0000-0000-00000000b007 settings={"probe": true}
    storage_config: key=service_role_key length(value)=51
    storage_config: key=supabase_url length(value)=36
    storage_config: supabase_url value=https://bootstrap-check.example.test
    deployment_settings: singleton=true behind_cloudflare=true
run 3: BOOTSTRAP_OPEN_FOR_VOTERS=false, BOOTSTRAP_PROJECT_NAME='Another Name', BOOTSTRAP_ACCOUNT_NAME='Another Account', BOOTSTRAP_DEFAULT_LOCALE=sv, the rest as in run 1
status: 0
standard output:
    SET
    BEGIN
    INSERT 0 0
    INSERT 0 0
    INSERT 0 0
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    COMMIT
after run 3:
    accounts: id=00000000-0000-0000-0000-000000000001 name=Renamed account
    projects: id=00000000-0000-0000-0000-00000000b007 account_id=00000000-0000-0000-0000-000000000001 name=Renamed by an administrator default_locale=fi open_for_voters=true
    app_settings: project_id=00000000-0000-0000-0000-00000000b007 settings={"probe": true}
    storage_config: key=service_role_key length(value)=51
    storage_config: key=supabase_url length(value)=36
    storage_config: supabase_url value=https://bootstrap-check.example.test
    deployment_settings: singleton=true behind_cloudflare=true
cmp of the detail lines before and after run 3: status 0; open_for_voters=t

## Control 5: a rotated key is applied
The second made-up key has another length (57 characters) and other first 19 characters than the first (51 characters), so the comparison can tell them apart.
before run 4: stored equals the first key: yes; equals the second: no; length(value)=51
run 4 status: 0
standard output:
    SET
    BEGIN
    INSERT 0 0
    INSERT 0 0
    INSERT 0 0
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    COMMIT
after run 4: stored equals the first key: no; equals the second: yes; length(value)=57; rows: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1

## Control 6: the key is stored without quote characters
first character is a quote character: f; last: f; length(value)=57, length of the variable=57

## Added: a corrected address and a changed Cloudflare value are applied
run 5 (BOOTSTRAP_STORAGE_URL=https://bootstrap-check-2.example.test, BOOTSTRAP_BEHIND_CLOUDFLARE=false) status: 0; supabase_url=https://bootstrap-check-2.example.test behind_cloudflare=f; rows: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1
run 6 (the environment of run 4 again) status: 0; supabase_url=https://bootstrap-check.example.test behind_cloudflare=t

## Control 7: the key statement made to fail, and the server log searched
A trigger on public.storage_config, BEFORE INSERT OR UPDATE, FOR EACH ROW WHEN (new.key = 'service_role_key'), raises 'probe: a write of the service_role_key row is refused'. The condition lets the supabase_url statement pass, so the statement that fails is the one that carries the key.
CREATE FUNCTION
CREATE TRIGGER
status: 3
standard output:
    SET
    BEGIN
    INSERT 0 0
    INSERT 0 0
    INSERT 0 0
    INSERT 0 1
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/bootstrap.sql:163: ERROR:  probe: a write of the service_role_key row is refused
    CONTEXT:  PL/pgSQL function bootstrap_probe_refuse() line 1 at RAISE
the container's log (docker logs, standard output and standard error together): 8733 lines
lines holding the key of runs 1 to 3: 0; the key of runs 4 to 6: 0; the key of the failed run: 0; any made-up key by its shape: 0
lines holding the probe's error: 1; lines holding the failed statement's text with its placeholder: 1
lines of psql's own output holding the key of the failed run: 0
the stored key is still the one of run 4: yes; rows: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1

## Added red control: a copy of the script with the key in the statement's text
The copy differs in one statement: VALUES ('service_role_key', :'service_role_key') ... ; in place of the bound parameter. It is a file under the ignored tmp/ directory and is removed below.
diff of the copy against the script: 4 changed lines
status: 3; lines of the server log holding this run's key: 1

## Added control: the script as it is, on a connection that asks for the parameters of failed statements
PGOPTIONS='-c log_parameter_max_length_on_error=-1' in the environment of psql; the command is unchanged.
status: 3; lines of the server log holding this run's key: 0; lines of psql's output holding it: 0

## Added red control: a copy without the line SET log_parameter_max_length_on_error = 0, on the same kind of connection
lines the copy lacks: 1
status: 3; lines of the server log holding this run's key: 1; lines of psql's output holding it: 1
the log line that holds it, with the key removed:
    	unnamed portal with parameters: $1 = '<the made-up key>'

DROP TRIGGER
DROP FUNCTION
trigger and function dropped; triggers left on public.storage_config: 0
the whole log once more, after every run: key of runs 1 to 3: 0; of runs 4 to 6: 0; of control 7: 0; of the unbound copy: 1; of the run with parameter logging asked: 0; of the copy without the SET line: 1
the log file, the two copies and the output of the two copies' runs were removed
the stored key is still the one of run 4: yes; rows: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1

## Control 8: the seed check on this bootstrapped database
    accounts: id=00000000-0000-0000-0000-000000000001 name=Renamed account
    projects: id=00000000-0000-0000-0000-00000000b007 account_id=00000000-0000-0000-0000-000000000001 name=Renamed by an administrator default_locale=fi open_for_voters=true
    app_settings: project_id=00000000-0000-0000-0000-00000000b007 settings={"probe": true}
    storage_config: key=service_role_key length(value)=57
    storage_config: key=supabase_url length(value)=36
    storage_config: supabase_url value=https://bootstrap-check.example.test
    deployment_settings: singleton=true behind_cloudflare=true
auth.users rows: 0
psql -X -f infra/scripts/check-seed.sql: status 0
standard output:
    DO
standard error (0 bytes):

## Added: the bootstrap included from another script (no variable given, so it fails)
by itself: status 3; included by a one-line script (\i only): status 0; included by a script that sets ON_ERROR_STOP first: status 3

## stop --name boot
status: 0; instances listed afterwards: 0; containers named openvaa-iso-: 0
finished: 2026-10-12T20:01:30Z
```

SEED_CHECK_SEEDED_EXIT=3
SEED_CHECK_NAMES_USER=yes
SEED_CHECK_NAMES_LOCAL_URL=yes
SEED_CHECK_NAMES_DEMO_KEY=yes
SEED_CHECK_URL_ONLY_EXIT=3
SEED_CHECK_AFTER_CLEANUP_EXIT=0
SEED_CHECK_OUTPUT_HOLDS_A_KEY=no
SEED_CHECK_USERS_DELETED_NAMES_USER=no
SEED_CHECK_USERS_DELETED_NAMES_LOCAL_URL=yes
SEED_CHECK_USERS_DELETED_NAMES_DEMO_KEY=yes
SEED_CHECK_LOCAL_URL_ALONE_STATUS=3
SEED_CHECK_LOCAL_URL_ALONE_NAMES_ONLY_IT=yes
SEED_CHECK_REFUSED_ADDRESSES=6 of 6
SEED_CHECK_ACCEPTED_ADDRESSES=2 of 2
SEED_CHECK_URL_ROW_ABSENT_STATUS=3
SEED_CHECK_DEMO_KEY_ALONE_STATUS=3
SEED_CHECK_DEMO_KEY_ALONE_NAMES_ONLY_IT=yes
SEED_CHECK_OTHER_ISSUER_STATUS=0
SEED_CHECK_UNDECODABLE_TOKEN_STATUS=0
SEED_CHECK_USERS_ALONE_STATUS=3
SEED_CHECK_USERS_ALONE_NAMES_ONLY_THEM=yes
SEED_CHECK_USER_BY_ID_STATUS=3
SEED_CHECK_USER_BY_ID_NAMED_WITHOUT_ADDRESS=yes
SEED_CHECK_INCLUDED_WITHOUT_ON_ERROR_STOP_STATUS=0
SEED_CHECK_INCLUDED_WITH_ON_ERROR_STOP_STATUS=3

# Part 2: the seed check on a seeded database

The lines directly above are this part's verdict lines. The first six are the ones the plan names; the rest were added by this plan. They were written by the driver `tmp/181-11/task3.sh` (ignored by git) from each command's own status and from searches of the check's standard error, never typed and never read through a pipe.

| Line | What it says |
|------|--------------|
| `SEED_CHECK_SEEDED_EXIT=3` | The check on a database with `seed.sql` applied: psql exits 3 |
| `SEED_CHECK_NAMES_USER`, `SEED_CHECK_NAMES_LOCAL_URL`, `SEED_CHECK_NAMES_DEMO_KEY` | Whether that run's standard error holds `@openvaa.test`, `http://kong:8000` and the demo-key finding |
| `SEED_CHECK_URL_ONLY_EXIT=3` | The plan's first further control: the two seed users deleted, the check run again |
| `SEED_CHECK_AFTER_CLEANUP_EXIT=0` | The plan's second further control: with the users deleted, the bootstrap run with a non-local `https://` address and a made-up key, the check run again |
| `SEED_CHECK_OUTPUT_HOLDS_A_KEY` | Whether any line of the check's output on the seeded database holds the demo key or a JWT-shaped string |
| `SEED_CHECK_USERS_DELETED_NAMES_*` | What the message of the first further control names |
| `SEED_CHECK_LOCAL_URL_ALONE_*`, `SEED_CHECK_DEMO_KEY_ALONE_*`, `SEED_CHECK_USERS_ALONE_*` | Added. Each of the three findings on a database that holds only that one |
| `SEED_CHECK_REFUSED_ADDRESSES`, `SEED_CHECK_ACCEPTED_ADDRESSES`, `SEED_CHECK_URL_ROW_ABSENT_STATUS` | Added. Six addresses the check must refuse and two it must not, and the row deleted |
| `SEED_CHECK_OTHER_ISSUER_STATUS`, `SEED_CHECK_UNDECODABLE_TOKEN_STATUS` | Added. Two stored values of three dot-separated segments that are not the demo key |
| `SEED_CHECK_USER_BY_ID_*` | Added. A seed user whose address was changed is still found by its id, and the changed address is not printed |
| `SEED_CHECK_INCLUDED_*` | Added. The status psql gives when the check, with a finding to report, is run through `\i` from another script |

## What was run on

| Item | Value |
|------|-------|
| Commit | `5a4ec714e7c31d2a59106b23a81934a50b302b62`, no tracked change in the worktree. `infra/scripts/` is as in `821cf36b7`, the commit of part 1 |
| Time | 2026-10-12, 20:04:52Z to 20:05:14Z |
| Instance | `boot-seeded`, `isolated-instance.sh start --name boot-seeded --mode db --port-base 55800 --migrations apps/supabase/supabase/migrations --seed apps/supabase/supabase/seed.sql`. One container, publishing 55801. The CLI's output names the seed: "Seeding data from supabase/seed.sql..." |
| Port base | 55800, not the 55500 the plan names, for the reason given in part 1 |
| Where the seed went | Into this isolated local instance only, once by the CLI at the start and once more by `psql` for one added control. Nothing was run against a hosted database or against the shared stack |

## The message on the seeded database

psql's standard error, whole. It holds no key: the driver counted the demo key and JWT-shaped strings in the check's output before quoting it, and found none.

```text
psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/check-seed.sql:99: ERROR:  check-seed: 3 finding(s)
  - seed user: auth.users holds 2 row(s) of the local seed, the first 2 being: admin@openvaa.test (id 00000000-0000-0000-0000-000000000010), candidate@openvaa.test (id 00000000-0000-0000-0000-000000000011)
  - local address: the supabase_url row of public.storage_config does not begin with https:// (http://kong:8000)
  - demo key: the service_role_key row of public.storage_config holds the public demo key of a local stack (a JWT whose issuer is supabase-demo)
CONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE
```

It names both seed users with their `openvaa.test` addresses, the address `http://kong:8000`, and the demo key as a finding without its value.

## One place where the result differs from the plan's words

The plan says of the first further control: "the status is still 3 and the message names the URL only". The status is 3. The message names the address **and the demo key**, because deleting the users leaves the seed's key in `public.storage_config` (`SEED_CHECK_USERS_DELETED_NAMES_DEMO_KEY=yes`). It no longer names a user. `SEED_CHECK_URL_ONLY_EXIT=3` is the status of that run as the plan defines it.

The address was then seen as the only finding in an added control: the bootstrap was run with the local stack's own address and a made-up key, and the check exits 3 with one finding (`SEED_CHECK_LOCAL_URL_ALONE_NAMES_ONLY_IT=yes`). The demo key alone and the seed users alone were each seen in the same way.

## What the added controls show

- **Each finding is independent.** Three databases that hold exactly one of the three each give status 3 and a message with that one finding.
- **The address rule.** Refused: a host `kong`, a host with `kong` as a whole word (`supabase_kong_openvaa-local`), `localhost`, `127.0.0.1`, `host.docker.internal`, any address that does not begin with `https://`, and an absent row. Not refused: `https://hongkong-vaa.example.test`, where `kong` is part of a longer word, and an address whose scheme is written in capitals. The plan's wording is "contains `kong`"; the script matches a whole word, so that a real host is not refused for four letters inside its name.
- **The demo key is found by its issuer, not by its text.** The check decodes the second segment of a stored JWT and compares the `iss` member. A made-up token with another issuer and a value whose second segment does not decode both pass.
- **A seed user is found by id as well as by address.** With the address of the seed's admin changed to one outside the domain, the check still exits 3, names the id, and does not print the changed address.
- **Through `\i` the status is not the check's**, as for the bootstrap: 3 by itself, 0 when included by a script that holds only the `\i` line, 3 when that script sets `ON_ERROR_STOP` first.

## Not measured

- A hosted project. Whether the role phase 184 connects with can read `auth.users` there is not known from this.
- More than ten seed users (the message lists ten and gives the count).
- A `service_role_key` row that is absent. The check does not report that case; the bootstrap writes both rows in one transaction.
- A database that holds seeded content other than the three things the check reads: the seed's candidate row, its grant rows and its project are not looked at. After the seed users are deleted and the bootstrap is run, the check is green while the seed's account and project remain (`SEED_CHECK_AFTER_CLEANUP_EXIT=0`, and the row counts of that step in the transcript).

## The shared stack

`docker ps --format '{{.Names}} {{.ID}}'`, sorted, before the first instance of the plan and after `boot-seeded` was stopped: `diff` exits 0 over all 24 containers, and `cmp` exits 0 over the 13 whose name ends `_openvaa-local`, by name and by container id. No container, volume or network with `openvaa-iso-` in its name is left, and the harness lists no instance.

## Transcript of part 2

Written by the driver. Indented lines are a command's output, unchanged.

```text
HEAD: 5a4ec714e7c31d2a59106b23a81934a50b302b62
tracked changes: 0
started: 2026-10-12T20:04:52Z
demo key taken from seed.sql: 164 characters, 2 dots

## start --name boot-seeded --mode db --port-base 55800 --migrations apps/supabase/supabase/migrations --seed apps/supabase/supabase/seed.sql
status: 0, 16 s
database container: supabase_db_openvaa-iso-boot-seeded, port 55801
lines of the CLI's output (start.log) that name a migration or the seed:
    Seeding globals from roles.sql...
    Applying migration 00001_initial_schema.sql...
    Seeding data from supabase/seed.sql...

## The seeded database
    auth.users: id=00000000-0000-0000-0000-000000000010 email=admin@openvaa.test
    auth.users: id=00000000-0000-0000-0000-000000000011 email=candidate@openvaa.test
    auth.users rows: 2
    storage_config: supabase_url value=http://kong:8000
    storage_config: service_role_key length(value)=164
    storage_config: the service_role_key value is the demo key of seed.sql: yes
rows: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1

## The seed check on the seeded database
psql -X -f infra/scripts/check-seed.sql: status 3; lines of its output holding a key: 0
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/check-seed.sql:99: ERROR:  check-seed: 3 finding(s)
      - seed user: auth.users holds 2 row(s) of the local seed, the first 2 being: admin@openvaa.test (id 00000000-0000-0000-0000-000000000010), candidate@openvaa.test (id 00000000-0000-0000-0000-000000000011)
      - local address: the supabase_url row of public.storage_config does not begin with https:// (http://kong:8000)
      - demo key: the service_role_key row of public.storage_config holds the public demo key of a local stack (a JWT whose issuer is supabase-demo)
    CONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE

## Control: the seed users deleted
DELETE 2
    auth.users rows: 0
    storage_config: supabase_url value=http://kong:8000
    storage_config: service_role_key length(value)=164
    storage_config: the service_role_key value is the demo key of seed.sql: yes
psql -X -f infra/scripts/check-seed.sql: status 3; lines of its output holding a key: 0
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/check-seed.sql:99: ERROR:  check-seed: 2 finding(s)
      - local address: the supabase_url row of public.storage_config does not begin with https:// (http://kong:8000)
      - demo key: the service_role_key row of public.storage_config holds the public demo key of a local stack (a JWT whose issuer is supabase-demo)
    CONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE

## Added control: the local address alone (users deleted; the bootstrap run with the local stack's own address and a made-up key)
bootstrap status: 0
    auth.users rows: 0
    storage_config: supabase_url value=http://kong:8000
    storage_config: service_role_key length(value)=51
    storage_config: the service_role_key value is the demo key of seed.sql: no
psql -X -f infra/scripts/check-seed.sql: status 3; lines of its output holding a key: 0
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/check-seed.sql:99: ERROR:  check-seed: 1 finding(s)
      - local address: the supabase_url row of public.storage_config does not begin with https:// (http://kong:8000)
    CONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE

## Control: users deleted, then the bootstrap with a non-local https:// address and a made-up key
bootstrap status: 0
standard output:
    SET
    BEGIN
    INSERT 0 0
    INSERT 0 0
    INSERT 0 0
    INSERT 0 1
    INSERT 0 1
    INSERT 0 1
    COMMIT
    auth.users rows: 0
    storage_config: supabase_url value=https://bootstrap-check.example.test
    storage_config: service_role_key length(value)=51
    storage_config: the service_role_key value is the demo key of seed.sql: no
rows: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1; behind_cloudflare=t; the seed project's open_for_voters=t (the seed's value, left alone by the bootstrap)
psql -X -f infra/scripts/check-seed.sql: status 0; lines of its output holding a key: 0
standard error:

## Added controls: each way an address is refused, and two that are not (no seed user, a made-up key)
https://kong:8443 -> bootstrap 0, check 3
      - local address: the supabase_url row of public.storage_config names a local host (https://kong:8443)
https://supabase_kong_openvaa-local:8000 -> bootstrap 0, check 3
      - local address: the supabase_url row of public.storage_config names a local host (https://supabase_kong_openvaa-local:8000)
https://localhost:54321 -> bootstrap 0, check 3
      - local address: the supabase_url row of public.storage_config names a local host (https://localhost:54321)
https://127.0.0.1:54321 -> bootstrap 0, check 3
      - local address: the supabase_url row of public.storage_config names a local host (https://127.0.0.1:54321)
https://host.docker.internal:54321 -> bootstrap 0, check 3
      - local address: the supabase_url row of public.storage_config names a local host (https://host.docker.internal:54321)
http://bootstrap-check.example.test -> bootstrap 0, check 3
      - local address: the supabase_url row of public.storage_config does not begin with https:// (http://bootstrap-check.example.test)
https://hongkong-vaa.example.test -> bootstrap 0, check 0
HTTPS://Bootstrap-Check.Example.Test -> bootstrap 0, check 0
DELETE 1
the supabase_url row deleted -> check 3
      - local address: public.storage_config has no supabase_url row, so no deployment address has been written
address restored by the bootstrap -> check 0

## Added control: the demo key alone (no seed user, a non-local https:// address, the demo key given to the bootstrap)
bootstrap status: 0
    auth.users rows: 0
    storage_config: supabase_url value=https://bootstrap-check.example.test
    storage_config: service_role_key length(value)=164
    storage_config: the service_role_key value is the demo key of seed.sql: yes
psql -X -f infra/scripts/check-seed.sql: status 3; lines of its output holding a key: 0
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/check-seed.sql:99: ERROR:  check-seed: 1 finding(s)
      - demo key: the service_role_key row of public.storage_config holds the public demo key of a local stack (a JWT whose issuer is supabase-demo)
    CONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE
a made-up token of three base64url segments whose issuer is another one -> bootstrap 0, check 0
a value of three segments whose second does not decode -> bootstrap 0, check 0

## Added control: the seed users alone (seed.sql applied again with psql, then the bootstrap with a non-local address and a made-up key)
psql -X -v ON_ERROR_STOP=1 -f apps/supabase/supabase/seed.sql: status 0
bootstrap status: 0
    auth.users: id=00000000-0000-0000-0000-000000000010 email=admin@openvaa.test
    auth.users: id=00000000-0000-0000-0000-000000000011 email=candidate@openvaa.test
    auth.users rows: 2
    storage_config: supabase_url value=https://bootstrap-check.example.test
    storage_config: service_role_key length(value)=51
    storage_config: the service_role_key value is the demo key of seed.sql: no
psql -X -f infra/scripts/check-seed.sql: status 3; lines of its output holding a key: 0
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/check-seed.sql:99: ERROR:  check-seed: 1 finding(s)
      - seed user: auth.users holds 2 row(s) of the local seed, the first 2 being: admin@openvaa.test (id 00000000-0000-0000-0000-000000000010), candidate@openvaa.test (id 00000000-0000-0000-0000-000000000011)
    CONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE

## Added control: a seed user found by its id, its address changed to one outside the seed's domain
UPDATE 1
DELETE 1
psql -X -f infra/scripts/check-seed.sql: status 3; lines of its output holding a key: 0
standard error:
    psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/infra/scripts/check-seed.sql:99: ERROR:  check-seed: 1 finding(s)
      - seed user: auth.users holds 1 row(s) of the local seed, the first 1 being: id 00000000-0000-0000-0000-000000000010 (its address is outside the seed domain and is not shown)
    CONTEXT:  PL/pgSQL function inline_code_block line 76 at RAISE

## Added: the seed check included from another script (the database still holds a finding)
by itself: status 3; included by a one-line script (\i only): status 0; included by a script that sets ON_ERROR_STOP first: status 3

## Added: the check wrote nothing
rows at the end: accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1; auth.users rows: 1

## stop --name boot-seeded
status: 0; instances listed afterwards: 0; containers named openvaa-iso-: 0
finished: 2026-10-12T20:05:14Z
```
