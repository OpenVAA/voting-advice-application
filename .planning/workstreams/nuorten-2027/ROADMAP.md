# Roadmap: Nuorten vaalikone 2027 deployment

A separate deployment of OpenVAA for the 2027 Nuorten vaalikone, at `https://nuortenvaalikone.openvaa.org`, from the private repository `OpenVAA/deploy-nuorten-vaalikone-2027`, in OpenVAA's AWS account `471112560111` with a Supabase project of its own.

## Decisions (exploration, 2026-11-23)

- **Repository:** a private non-fork mirror (a public repository cannot have a private fork) with an `upstream` remote on `OpenVAA/voting-advice-application`. It diverges only by **added** files; an upstream file it would have to edit is a missing upstream seam, fixed upstream.
- **Sync:** while the deployment stack is being restacked, the downstream commits are moved with `git rebase --onto <new-upstream> <old-upstream>`; once the stack is on `main`, downstream merges `main` and never rebases again.
- **AWS:** same account; the OIDC provider, state bucket, image registry and budget are shared through the multi-deployment bootstrap (deployment workstream, Phase 190). Upstream owns and applies `infra/bootstrap`; this deployment is one entry in its map.
- **Customisation:** config and settings only, through an instance overlay (Phase 191); no code changes are expected downstream.
- **DNS:** `nuortenvaalikone.openvaa.org` is a delegated zone, as `staging.openvaa.org` is, its name servers added at the parent zone by hand.

## Phases

- [ ] **Phase 191: Instance overlay (upstream)** - An instance layer deep-merged over `staticSettings` at build time, with static assets (logo, favicon, fonts) and translation overrides, so a downstream repository customises by adding files under one directory. With no instance present, the build is unchanged.
- [ ] **Phase 192: Downstream repository and sync** - The private repository exists with its base and `upstream` remote, a sync script for both sync modes, and a CI guard that fails when the downstream diff touches a path outside the allowlist.
- [ ] **Phase 193: Instance infrastructure** - The bootstrap entry upstream, and downstream roots `infra/envs/nuorten-2027/{dns-mail,supabase,aws}` copied from `infra/envs/example`: the delegated zone, the mail identity, the new Supabase project imported with its hosted settings, and the AWS stack applied by hand once.
- [ ] **Phase 194: Instance configuration** - The overlay's settings, branding, locales and copy for Nuorten vaalikone 2027, and the project's dynamic settings and bootstrap rows.
- [ ] **Phase 195: Pipeline and first tested deploy** - The downstream repository's GitHub environments and the unedited upstream workflows deploy it, and the deployed smoke run (`yarn test:e2e:deployed`) is green against `https://nuortenvaalikone.openvaa.org`.

## Phase Details

### Phase 191: Instance overlay (upstream)

**Goal:** a downstream repository customises an instance by adding files only.
**Depends on:** nothing; can be built now on a branch off the deployment stack, and shipped as upstream PR 2.
**Success criteria:**
1. Overlay files under one instance directory replace values of `staticSettings` by deep merge, validated against `StaticSettings` at build time.
2. Static assets and translation overrides in the instance directory take precedence over the frontend's own.
3. With no instance directory, the built output is the same as today's, and the existing unit and E2E suites pass unchanged.

**Plans:** 1/6 plans executed

Plans:
- [x] 191-01-PLAN.md — app-shared: strict StaticSettings schema, resolveStaticSettings, tsup onLoad overlay plugin, turbo inputs
- [ ] 191-02-PLAN.md — frontend theme seam (app.css transform from staticSettings) and AppLogo static fallback
- [ ] 191-03-PLAN.md — instance/static over apps/frontend/static through a merged kit.files.assets
- [ ] 191-04-PLAN.md — instance/messages/<locale>.json overrides through a generated inlang project, with validation
- [ ] 191-05-PLAN.md — turbo/Docker seams, instance/README.md, docs, fixture-instance and Docker proofs
- [ ] 191-06-PLAN.md — phase gate: build identity vs 8f2bb68a7, unit/lint/format, full E2E run

### Phase 192: Downstream repository and sync

**Goal:** pulling upstream changes into the downstream repository is one command and cannot silently edit an upstream file.
**Depends on:** the operator creating `OpenVAA/deploy-nuorten-vaalikone-2027`. The sync script and the guard can be written and tested here before then, against a local bare repository.
**Success criteria:**
1. The repository holds the upstream base and the downstream commits, with `upstream` configured.
2. `scripts/sync-upstream.sh` (downstream) does the `rebase --onto` mode and the merge mode, and refuses to run on a dirty tree.
3. CI fails when the diff against the upstream base touches a path outside the allowlist (`instance/`, `infra/envs/nuorten-2027/`, the repository's own docs and workflow configuration).

### Phase 193: Instance infrastructure

**Goal:** the instance's zone, mail, Supabase project and AWS stack exist, applied by hand from the upstream runbooks.
**Depends on:** deployment Phase 190 (multi-deployment bootstrap) on `main`, Phase 192.

### Phase 194: Instance configuration

**Goal:** the deployed instance looks and reads as Nuorten vaalikone 2027.
**Depends on:** Phase 191, Phase 193.

### Phase 195: Pipeline and first tested deploy

**Goal:** a push to the downstream deploy branch deploys the instance, and the run goes red when the build, the rollout or the smoke run fails.
**Depends on:** Phase 193, Phase 194, and the parameterised workflows of deployment Phase 190.
