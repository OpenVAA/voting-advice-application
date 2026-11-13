# API Coverage — Supabase Auth (GoTrue v2.197.0) admin and public API, as integrated by Phase 174

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
>
> Scope: the new Edge Function `account-access`, the auth callback, the two login actions and the data
> writer. The surface is the GoTrue admin API (`auth.admin.*` in supabase-js 2.117.2) and the public auth
> endpoints this phase's flow touches or deliberately closes. Behaviour cited as measured is from
> `174-RESEARCH.md` § RQ-1 to RQ-7.
>
> How three integrated capabilities are used (174-05): `GET /settings` is asked before any link is issued
> and its positive answer is believed for at most 60 seconds, never for a worker's lifetime; the redirect
> question (`GET /verify` with an invalid token) is asked per callback URL and its positive answer is
> believed for at most ten minutes; both run before the database is asked about the address. The two
> `generateLink` calls run only after the database has returned an eligible address, and a failure of either
> gives the address's throttle slot back. No capability of the auth service guards `claim_invitations`
> itself: on a project that allows public sign-up the claim is forgeable, which is why `POST /signup` is
> closed by configuration and stated as a hosted obligation.

| capability | decision | reason |
|---|---|---|
| admin.generateLink type=invite | INTEGRATE | |
| admin.generateLink type=magiclink | INTEGRATE | |
| admin.generateLink type=signup | OPT-OUT | needs a password at issue; no flow of this phase sets a password before the user does, and public sign-up is disabled |
| admin.generateLink type=recovery | OPT-OUT | the recovery mail stays the auth service's own until Phase 178 moves it into the function (FIX-01, 178-C5) |
| admin.generateLink type=email_change_current | OPT-OUT | no email-change flow exists in v2.16 |
| admin.generateLink type=email_change_new | OPT-OUT | no email-change flow exists in v2.16 |
| admin.createUser | OPT-OUT | gives a new user a generated password (measured); the function creates users through the invite-then-magiclink recipe instead; the existing callers (identity-callback, the E2E fixture) are unchanged |
| admin.inviteUserByEmail | OPT-OUT | removed by this phase: it pre-creates the user at invite time and mails the auth service's non-PKCE link (D-02, D-13) |
| admin.deleteUser | OPT-OUT | not needed in the product; used only by E2E cleanup and the probes |
| admin.listUsers | OPT-OUT | not needed: the function never reads users; the one address it needs comes from a SQL helper |
| admin.getUserById | OPT-OUT | not needed, for the same reason |
| admin.updateUserById | OPT-OUT | not needed: nothing in this phase changes a user on their behalf |
| admin.signOut | OPT-OUT | not needed: sessions are ended by the user's own client |
| admin.mfa (listFactors, deleteFactor) | OPT-OUT | explicitly out of scope: the product has no multi-factor authentication |
| GET /settings | INTEGRATE | |
| GET /verify (redirect question against the allowlist) | INTEGRATE | |
| POST /verify (verifyOtp with token_hash) | INTEGRATE | |
| POST /token grant_type=password (signInWithPassword) | INTEGRATE | |
| POST /token grant_type=refresh_token (refreshSession) | INTEGRATE | |
| setSession (client-side adoption of issued tokens) | INTEGRATE | |
| PUT /user password (updateUser) | INTEGRATE | |
| POST /signup | OPT-OUT | deliberately disabled by configuration in this phase (`[auth] enable_signup = false`): it yields a confirmed address with no mail round-trip (measured) |
| POST /otp (signInWithOtp) | OPT-OUT | not called by the product; user creation through it is disabled by the same switch; its answer still tells a registered address from an unregistered one — residual recorded, todo for Phase 178 |
| POST /recover (resetPasswordForEmail) | OPT-OUT | unchanged by this phase; the existing forgot-password page keeps using it until Phase 178 |
| PUT /user email (email change) | OPT-OUT | no email-change flow exists in v2.16; measured to stay pending until the new address clicks |
| send-email hook | OPT-OUT | not needed yet — Phase 178 can use it to switch the auth service's own mail off (measured to work) |
| rate-limit header configuration | OPT-OUT | explicitly not relied on: no limit of this phase is keyed on a request header (D-18) |
| captcha on auth endpoints | OPT-OUT | not needed yet — named in the todo on the missing per-caller limit |
