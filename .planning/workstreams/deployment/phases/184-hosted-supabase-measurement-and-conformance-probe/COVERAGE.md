# API Coverage — Supabase: Management API, CLI, provider 1.11.0 and the project's public APIs

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

The surface is what this phase touches of Supabase: the Management API endpoints the probe and the operator's sittings read or call, the CLI commands that deploy, the Terraform resources the module adds, and the public endpoints of a project that the probe and the measurements call. The rows of phase 183's matrix that phase 184 was named for (`edge-function-secrets`, `edge-function`, `apikey`, `data.pooler`) are decided again here.

| capability | decision | reason |
|---|---|---|
| management-api.get-project | INTEGRATE | |
| management-api.read-auth-config | INTEGRATE | |
| management-api.read-postgrest-config | INTEGRATE | |
| management-api.list-functions | INTEGRATE | |
| management-api.update-function-verify-jwt | INTEGRATE | |
| management-api.list-secrets | INTEGRATE | |
| management-api.list-api-keys | INTEGRATE | |
| management-api.read-legacy-api-keys | INTEGRATE | |
| management-api.list-storage-buckets | INTEGRATE | |
| management-api.create-cli-login-role | INTEGRATE | |
| management-api.write-auth-or-postgrest-config | OPT-OUT | explicitly out of scope: Terraform's `supabase_settings` is the only writer of hosted settings (C4, 183 D-15) |
| management-api.run-sql-query | OPT-OUT | not needed: SQL runs over psql, whose connection the drift check and the probe already guard by ref |
| management-api.branches | OPT-OUT | explicitly out of scope: preview branches (REQUIREMENTS Out of Scope) |
| management-api.network-and-ssl | OPT-OUT | not needed: in no requirement of this milestone |
| management-api.delete-project | OPT-OUT | explicitly out of scope for code: the throwaway is deleted by the operator in the dashboard (D-23), and Terraform never deletes a project (C2) |
| provider.edge-function-secrets | INTEGRATE | |
| provider.edge-function | OPT-OUT | not needed: function code ships with the CLI, which reads `verify_jwt` from config.toml (carried ruling, C7) |
| provider.apikey | OPT-OUT | not needed: the deployment stays on legacy keys if they work (C5); the move is FUT-02 |
| provider.data.pooler | OPT-OUT | not needed: the session pooler's host is read from the dashboard's Connect dialog in the one sitting that needs it (D-03) |
| cli.link | INTEGRATE | |
| cli.db-push | INTEGRATE | |
| cli.db-diff | INTEGRATE | |
| cli.functions-deploy | INTEGRATE | |
| cli.functions-delete | INTEGRATE | |
| cli.config-push | OPT-OUT | explicitly out of scope: the parity guard's one-writer rule refuses it (C4) |
| cli.secrets-set | OPT-OUT | not wanted: a second writer of the function secrets beside Terraform (C7) |
| cli.db-pull | OPT-OUT | not needed: the schema's source is the frozen migrations (SUPA-10) |
| public.auth-settings | INTEGRATE | |
| public.auth-token-password | INTEGRATE | |
| public.auth-verify | INTEGRATE | |
| public.auth-recover | INTEGRATE | |
| public.rest-read | INTEGRATE | |
| public.rest-rpc | INTEGRATE | |
| public.functions-invoke | INTEGRATE | |
| public.storage | OPT-OUT | not needed: buckets are read through the Management API or the catalog, and uploads are dev-seed's |
| public.realtime | OPT-OUT | not needed: the application uses no realtime channel |

Within `public.functions-invoke`, which call shapes are measured (the anon key alone, with a Bearer header, the publishable key) is decided in plan 184-12. Within `management-api.read-auth-config`, which keys the probe compares is decided by `infra/modules/supabase/hosted-settings.json` and the target root's tfvars, not here.
