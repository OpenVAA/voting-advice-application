# The backend sits alone in this file because the bucket it names is created by this very root.
# The first apply therefore runs with local state: either an untracked `backend_override.tf` replaces
# this block, or this one file is moved aside for that apply. Either way no other block is touched,
# and once the bucket exists the state is migrated into it with `terraform init -migrate-state`.
#
# Literal on purpose: no variable, no partial configuration and no -backend-config, so that this
# root can never be paired with another root's state key. The key sits under hand/: this root is
# applied by hand with administrator rights, never by the pipeline.
terraform {
  backend "s3" {
    bucket       = "openvaa-tfstate-471112560111"
    key          = "hand/bootstrap/terraform.tfstate"
    region       = "eu-north-1"
    encrypt      = true
    use_lockfile = true
  }
}
