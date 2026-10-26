output "project_ref" {
  description = "Reference of the imported project."
  value       = supabase_project.this.id
}

output "managed_auth_keys" {
  description = "Names of the auth settings this module sends, sorted. Key names only, no values."
  value       = sort(keys(local.auth))
}

output "managed_api_keys" {
  description = "Names of the API settings this module sends, sorted. Key names only, no values."
  value       = sort(keys(local.api))
}

output "managed_function_secret_names" {
  description = "Names of the Edge Function secrets this module sets, sorted; empty while public_project_id is null. Names only, no values."
  value       = var.public_project_id == null ? [] : sort(local.function_secret_names)
}
