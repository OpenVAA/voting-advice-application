# API Coverage — Supabase Management API, through the `supabase/supabase` Terraform provider 1.11.0

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

The surface below is the provider's own: its seven resources and four data sources as listed under `docs/` in `supabase/terraform-provider-supabase` at tag `v1.11.0` (read on 2026-10-11), with `supabase_project` and `supabase_settings` broken down by the operations and setting categories the research read from the provider's source. The last two rows are the two Management API reads the operator makes by hand to check what a project serves.

| capability | decision | reason |
|---|---|---|
| project.import | INTEGRATE | |
| project.create | OPT-OUT | explicitly out of scope: Terraform never creates the hosted project, because a destroy would then delete the database (ruling C2, REQUIREMENTS Out of Scope) |
| project.destroy | OPT-OUT | explicitly out of scope: the project block carries `prevent_destroy`, by the same ruling |
| project.update-database-password | OPT-OUT | not wanted: the operator sets the password at creation and Terraform ignores changes to it, so an apply after an import cannot reset it (A-04) |
| project.instance-size | OPT-OUT | not needed: left undeclared so that no apply triggers a compute change |
| settings.api | INTEGRATE | |
| settings.auth | INTEGRATE | |
| settings.database | OPT-OUT | not needed: no requirement of this milestone names a hosted Postgres setting |
| settings.network | OPT-OUT | not needed yet: network restrictions are in no requirement of this milestone |
| settings.pooler | OPT-OUT | not needed yet: the pooler is a fallback that phase 184 measures before anything configures it |
| settings.storage | OPT-OUT | not needed: the two buckets are created by the migration (SUPA-04), not by a storage setting |
| settings.ssl-enforcement | OPT-OUT | not needed yet: in no requirement of this milestone; what the project serves is measured in phase 184 |
| edge-function-secrets | OPT-OUT | not needed yet: written in phase 184 with the function deploy (D-04) |
| edge-function | OPT-OUT | not needed yet: the three functions are deployed in phase 184 (SUPA-05), which decides the means |
| apikey | OPT-OUT | not needed: the deployment stays on legacy keys if they work (ruling C5); the key model is measured in phase 184 (SUPA-13) |
| branch | OPT-OUT | explicitly out of scope: preview branches (REQUIREMENTS Out of Scope) |
| third-party-auth | OPT-OUT | not needed: every third-party auth provider is disabled in the local configuration |
| data.apikeys | OPT-OUT | not needed yet: no root of this phase reads a key; phases 184 and 185 decide how keys reach the frontend |
| data.branch | OPT-OUT | explicitly out of scope: preview branches |
| data.network-bans | OPT-OUT | not needed: no requirement reads network bans |
| data.pooler | OPT-OUT | not needed yet: the pooler is measured in phase 184 |
| management-api.read-auth-config | INTEGRATE | |
| management-api.read-postgrest-config | INTEGRATE | |

AWS is not a row here. The phase does not wrap an AWS API; it declares AWS resources one by one through the `hashicorp/aws` provider, and each plan lists the resources it adds under "Artifacts this phase produces". Within `settings.auth`, which keys are managed, which are compared with the local configuration and which are deliberately not compared is decided key by key in the parity guard's classification table (plan 183-10), not here.
