# Bank authentication (OIDC)

Candidates and parties can register by identifying themselves with a bank identity. The Contestant App talks to an OpenID Connect (OIDC) identity provider, and the `identity-callback` Edge Function turns the verified identity into an account and the entity it registers: a candidate or a party. The account then gives the email address it will sign in with, and the address becomes the account's when the link mailed to it is opened.

Two providers are implemented, both for the Finnish Trust Network:

| Provider type  | Provider | Authorization request                                    | Token exchange                     | Callback proof                           |
| -------------- | -------- | -------------------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| `idura-ftn`    | Idura    | a signed request object (JAR), built on the server       | `private_key_jwt` client assertion | `state`, kept in a cookie                |
| `signicat-ftn` | Signicat | PKCE, with the verifier and challenge made on the server | client secret                      | the PKCE code verifier, kept in a cookie |

The frontend picks the provider from `PUBLIC_IDENTITY_PROVIDER_TYPE`, and the Edge Function from `IDENTITY_PROVIDER_TYPE`. The two must name the same provider. The provider modules live in [`lib/api/utils/auth/providers`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/api/utils/auth/providers).

## When it is offered

Registration with the identity provider is offered for each entity type the project serves whose row of the `contestantApp.registrationModes` app setting contains `identity_provider`. `identityProviderEntityTypes(settings)` in [`registrationOffer.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/registrationOffer.ts) lists those types, candidate first, and `listedRegistrationModes` lists the provider's mode exactly when that list is not empty. While `access.answersLocked` is on, nothing is listed. See [Registration](/developers-guide/contestant-app/registration#what-lists-a-registration-mode).

The setting alone decides what is offered: when it allows the mode and the identity provider is not configured, the flow fails closed at `/api/oidc/authorize`.

## The registration screen

The identity provider is one option of the registration screen, `/contestant/register`, and its panel is a form:

- **One type allowed.** The panel's sentence names the type, and nothing is asked.
- **Several types allowed.** The panel asks "What would you like to register?" with one radio button for each type: "Myself, as a candidate" and "A party or constituency association". No type is chosen on arrival, so nobody registers a party by leaving a default. Continue with none chosen sends nothing and says, under the options, that a choice is needed.

Continue posts the chosen type, and nothing else, to the server route `/api/oidc/authorize`, and keeps its loading form until the browser has left for the provider. When the user comes back to the page with the browser's Back, Continue is available again. The error screen's Try again leads back to this screen with the provider's option open, and the type is chosen again.

## The flow

Every step that handles a token runs on the server: in a SvelteKit server route or in the Edge Function. The browser only starts the flow and follows redirects.

1. **Start.** The route `/api/oidc/authorize` reads the app settings and refuses (`403`, `mode_not_allowed`) a type the registration matrix does not allow for the identity provider; an absent type is taken only when exactly one served type allows it, and a failed settings read is a `503`. The registration screen sends a refusal of the type to the error screen with `mode_not_allowed`, and any other failure with `registration_failed`. The route then builds the callback URL from its own origin, whatever the browser sends, and asks the active provider for an authorization URL:
   - Idura: the server signs the request object with the signing key, and stores the request's `state` and `nonce` in `httpOnly` cookies for ten minutes. The signing key never reaches the browser.
   - Signicat: the server makes the PKCE code verifier and challenge, gives the challenge to the provider, and stores the verifier in the `httpOnly` `oidc_code_verifier` cookie for the callback.

   The chosen type is stored in the `httpOnly` `oidc_entity_type` cookie with the same attributes. It only selects which type is registered: every reader checks the matrix again, and the callback deletes it on every path. The browser then goes to the provider.

2. **Callback.** The provider redirects to the server route `/api/oidc/callback` with an authorization code, or with an error. The route:
   1. maps an error the provider reports to a code first: its cancel to `cancelled`, every other value to `provider_error`. A callback with neither a code nor an error is `missing_code`;
   2. checks the browser-bound proof the provider declares: the returned `state` must equal the `oidc_state` cookie (Idura), or the `oidc_code_verifier` cookie must be present (Signicat). Without it, the code is not redeemed (`invalid_state`);
   3. exchanges the code for an ID token at the provider (`token_exchange_failed` when that fails);
   4. decrypts and verifies the ID token (below; `invalid_token` when it is rejected);
   5. reads and deletes the `oidc_entity_type` cookie and checks the type against the registration matrix again, over the app settings read as the authorize route reads them and with the same function, `identityProviderEntityType`, so every type is refused while answers are locked: a refused type is `mode_not_allowed`, and a failed settings read `registration_failed`;
   6. invokes the `identity-callback` Edge Function with the ID token, the project the application is scoped to (`PUBLIC_PROJECT_ID`) and the type, and with the server's secret `IDENTITY_CALLBACK_SERVER_SECRET` in the `x-identity-callback-secret` header. An unset or malformed project, and an unset secret, are `configuration_error`, and nothing is invoked. The ID token never reaches the browser;
   7. establishes the Supabase session with `verifyOtp` over the sign-in token the function answers with, which stores the session in cookies;
   8. sets the `httpOnly` `identity_provider_arrival` cookie for ten minutes, `created` when the function made the account's entity and `existing` when it found one, and redirects to the Contestant App's root.

   Each failure redirects to the error screen with one closed code (see [The error screen](#the-error-screen)); a failed answer of the function is mapped to one of the same codes. The route deletes the `oidc_nonce` cookie, but does not compare the nonce with the token's `nonce` claim.

3. **The address.** At the app root, the protected layout shows the identity provider's success view in place of any page while the account needs it (see [The success view](#the-success-view)). The user gives the address they will sign in with, and the address's confirmation link is mailed. The user goes straight on to the terms of use and the entity's home, with no wait for the link and no password. Until the link is opened, the user signs in with the identity provider.
4. **Confirmation.** The mailed link lands on `/api/auth/callback`, which verifies it: the address becomes the account's sign-in address. An account with a proved address and no password is then asked to set one before any protected page, also when its first sign-in after that is by an emailed sign-in link. Two accounts may wait for the same address; the first to open its link takes it. The other's link then fails: in a browser where that account is signed in, it is back on the success view asking for an address, told that the address is now used by another account; in a browser with no session, the login page says so. See [The auth callback](/developers-guide/contestant-app/login-and-password-reset#the-auth-callback).

### Verifying the ID token in the frontend

[`decryptAndVerifyIdToken.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts) is the one decrypt and verify path in the frontend; both providers' `getIdTokenClaims` call it.

1. It decrypts the token (a JWE) with the private key from `IDENTITY_PROVIDER_DECRYPTION_JWKS` whose `kid` matches the token's header.
2. It verifies the inner token's signature against the provider's public keys at `IDENTITY_PROVIDER_JWKS_URI`.
3. It requires the audience `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` and the issuer `IDENTITY_PROVIDER_ISSUER`. A missing audience, issuer, key set or key-set URI is an error, not a skipped check.

The Idura provider module also extracts the token's personal identity code and birth date. They are kept in memory only and stored nowhere.

## What `identity-callback` does

[`identity-callback/index.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/identity-callback/index.ts) runs with the service-role key. It answers the frontend server alone, and otherwise trusts only the token it verifies.

1. It refuses a request without the `x-identity-callback-secret` header, or with a value other than its own `IDENTITY_CALLBACK_SERVER_SECRET`, with `refused` (`401`), before it reads the body, its configuration or the token. So a stolen or replayed ID token presented to the function directly gets nothing. An unset secret answers `configuration` (`500`).
2. It reads the provider configuration for `IDENTITY_PROVIDER_TYPE`. An unknown type answers `configuration`.
3. It reads the request: `id_token`, `project_id` (required, a uuid) and `entity_type` (`candidate`, `organization`, or absent when exactly one served type allows the identity provider). The function reads no project from its environment. A request it cannot read answers `bad_request` (`400`).
4. It decrypts the token if it is a JWE (five parts) with `IDENTITY_PROVIDER_DECRYPTION_JWKS`, and verifies the signature against `IDENTITY_PROVIDER_JWKS_URI` with the audience `IDENTITY_PROVIDER_CLIENT_ID` and the issuer `IDENTITY_PROVIDER_ISSUER`. A token that fails decryption, verification or claim extraction answers `invalid_token` (`401`).
5. It reads the claims: `sub` identifies the person, `given_name` and `family_name` give the name.
6. It reads the project's settings and decides the entity type by the registration matrix, before it touches any account or row. A type the matrix does not allow for the identity provider answers `mode_not_allowed` (`403`). This is the authority on the decision: the frontend's own checks only select.
7. It looks for an auth user whose `app_metadata.identity_match_value` is the `sub` value. If there is none, it creates one by invitation, with no password, on the placeholder address `<sub>@bank-auth.placeholder`, and confirms that placeholder. No address the user types is ever written to the account by the function.
8. It looks for the identity's own entity of the type in the project through the record in the account's `app_metadata`, confirmed by a live editor grant. With no record it creates the entity — a confirmed candidate with the name from the token, or an unconfirmed party with no name — writes the editor grant and the record, and answers `created`; a found entity answers `found`, and a record whose grant is gone answers `no_entity` and creates nothing, so identifying again does not undo an administrator's removal of the grant. If a write fails, an entity created here is deleted again.
9. It generates a sign-in link for the account's current address and answers with the link's token. The entity and its grant are written first, so the session the callback establishes already carries the grant.

Every answer is one closed `result`: `created`, `found` and `no_entity` (`200`) carry the sign-in token, and `refused`, `mode_not_allowed`, `invalid_token`, `bad_request`, `configuration` and `unavailable` (`503`, an outage) carry nothing else. No answer carries a message the function caught.

### What the account's `app_metadata` holds

| Key                    | Value                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `identity_provider`    | the provider type, for example `idura-ftn`                                           |
| `identity_match_prop`  | the claim the account is matched on, `sub`                                           |
| `identity_match_value` | the provider's persistent subject identifier                                         |
| `registered_entities`  | `{ "<project id>": { "<entity type>": "<entity id>" } }`: the entities it registered |

`app_metadata` rides in every access token, and the auth cookies that hold the token can be read by script on the page, so it holds no identity claim beyond the identifier the account is matched on: no personal identity code, no birth date and no name. Every write sends `hetu` and `birthdate` as null, which removes them from an older account that still holds them. An account the identity provider created claims no invitation: `claim_invitations` reads no address for it.

## The success view

The success view, [`IdentityProviderGate.svelte`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte), is the gate `identityProvider` of the protected layout, between the set-password gate and the terms of use (see [The set-password gate](/developers-guide/contestant-app/registration#the-set-password-gate)). It has no address of its own: the layout renders it in place of whatever page was asked for. Its predicate reads the user-level data and two facts of the request, never an entity.

**The address states.** `getBasicUserData` tells each account's address state from the verified user alone, in `addressStateOf` ([`identityProviderAccount.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts)):

| State     | The account                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `none`    | an identity-provider account that holds only its placeholder and has no address awaiting confirmation |
| `pending` | an identity-provider account that holds only its placeholder, with an address awaiting confirmation   |
| `proved`  | any other account, whose address is its holder's own                                                  |

A pending address that another account has meanwhile taken reads as `none`, so its holder is asked for an address again. The placeholder address is never shown, never sent to a password manager and never handed on as the account's `email`.

**When the view is shown**, any one of three reasons is enough: the address state is `none`; the identity's own party has no name and answers are not locked; or the arrival cookie says `existing` and the account has given an address, which shows the view once.

| Variant                | When                                                      | The view shows                                                                                                      |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| new                    | `none`, no `existing` arrival                             | "Complete your registration" and the address form; for a party with no name, its name and abbreviation fields first |
| returning, no address  | `none`, arrival `existing`                                | "You have already registered" and the address form                                                                  |
| returning, pending     | `pending`, arrival `existing`                             | the address under "Awaiting confirmation", Send again, Use another email address, and Continue                      |
| returning, proved      | `proved`, arrival `existing`                              | the address under "Your sign-in email address", the advice to sign in with it next time, and Continue               |
| the party's name alone | an address given, the own party unnamed, answers unlocked | the party's name and abbreviation fields                                                                            |

Continue saves through one server endpoint, `/api/contestant/identity-provider` ([`identityProviderRegistration.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/server/contestant/identityProviderRegistration.ts)). Its intents are `save` (the party's names, the address, or both; the names first, so a later failure leaves them saved), `resend` (the pending address's link again) and `acknowledge` (the arrival cookie cleared). The names are written only to the party the account's record names, and only while it is unconfirmed. An address another account holds is answered at the address field: "This email address is already used by another account." Any other failure, a placeholder address or a spent limit among them, says only that the details could not be saved. A save that succeeds clears the arrival cookie and reruns the loads, so the terms of use, the entity's home or the requested page replaces the view.

**After the view.** While the address is pending, the first row of the entity's task list on its home is the task of confirming it: a link, with a mail icon and a label that names the address, to the settings page. It is not one of the entity's tasks and closes nothing. The settings page shows the pending address with Send again and "Use another email address", which asks for a new one. Send again is available on arrival; once pressed, it is available again 65 seconds later, as on the "email sent" screen.

## The confirmation mail

The endpoint hands the address to the `confirm-address` operation of the [`account-access`](/developers-guide/backend/edge-functions#account-access) Edge Function, with the user's own access token:

1. It reads the account from the token and refuses one whose `app_metadata` names no identity provider or whose address is no longer the placeholder, a project the account registered no entity in, and an address on the placeholder domain.
2. It takes two slots through `address_confirmation_request`, neither of them per project: the account's (ten requests in fifteen minutes) and the address's (one mail in 60 seconds, apart from the sign-in and recovery mails' slot). Without both it answers `refused`.
3. It asks the database whether an open invitation of the project holds the typed address. One that does answers `in-use`, and the address's slot is given back: an account the identity provider created claims no invitation, so the invited person signs in with the invited address by email instead.
4. It asks the auth service for the two links of a change of address, from the placeholder to the typed address. An address another account holds answers `in-use`, and the address's slot is given back.
5. It verifies the placeholder's link itself, which leaves the typed address awaiting confirmation on the account, and mails the typed address's link, `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=email_change`, in one of seven locales. It answers `sent`.

The mail says what opening the link does and tells anyone who did not register to ignore it; it states no name, no duration and no account. Only the newest link works. The typed address becomes the account's only when the link is opened: nothing writes it to the account directly. The recipe relies on the auth service's "Secure email change" setting; without it, confirming the placeholder's side completes the change at once, and the operation puts the placeholder back, mails nothing and answers `refused` (see [Auth settings of a hosted project](/developers-guide/deployment#auth-settings-of-a-hosted-project)).

The auth service itself answers a signed-in account's own address-change request for an address another account holds with `email_exists`, outside these slots, so any signed-in account can learn whether an address has an account; this is accepted as a residual risk, because an account is needed first, nothing can be taken over, and a hosted project limits `/auth/v1/user` requests by address of origin.

## The error screen

Every failure of the flow lands on the error screen, `/contestant/register/identity-provider/error`, with one code in its `error` search parameter. The codes are a closed set in [`oidcError.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/oidcError.ts): no value the provider or the function sends passes through. The page's server load maps the code to one of three classes and hands the page the class alone, so the page never shows the code; it is for the operator, on the address bar.

| Code                    | Class       | What failed                                                                                    |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `cancelled`             | `cancelled` | the user cancelled at the provider                                                             |
| `provider_error`        | `retry`     | the provider answered any other error                                                          |
| `missing_code`          | `retry`     | the callback arrived with neither a code nor an error                                          |
| `invalid_state`         | `retry`     | the browser-bound proof was missing or did not match                                           |
| `token_exchange_failed` | `retry`     | the code could not be exchanged for a token                                                    |
| `registration_failed`   | `retry`     | `identity-callback` was unavailable or gave no usable answer, or the session could not be made |
| `invalid_token`         | `noRetry`   | the ID token was rejected                                                                      |
| `mode_not_allowed`      | `noRetry`   | the project does not allow registration with the identity provider for the type                |
| `configuration_error`   | `noRetry`   | the server or `identity-callback` is not configured, or the function refused the server        |

A value that is not a code is shown as `retry`. Each class has its own title and sentence: "Identification cancelled", "Identification did not succeed" and "Registration is not possible right now". The first two lead with Try again, and the third with Contact support, because trying again will not help. Each class offers support once: in the first two the words "contact support" in the sentence below Try again are themselves the link to the support section of the Help page (`ContactSupport` with `sentence`), and the third has a Contact support button with no icon (`icon={null}`) and no such sentence. A signed-in visitor is sent to the app root.

## Configuration

Set the variable names below; the values come from the identity provider and from the keys you generate. [`docs/key-generation.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/key-generation.md) describes how to generate the key pairs, how to format them as JWK sets for these variables and which public keys to register with the provider. Never commit the values.

The frontend reads these from the repo-root `.env` (see [Environment variables](/developers-guide/configuration/environmental-variables)):

| Variable                                          | Used for                                                                      |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `PUBLIC_IDENTITY_PROVIDER_TYPE`                   | the provider: `idura-ftn` or `signicat-ftn`                                   |
| `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`              | the client id, and the audience of the ID token                               |
| `IDENTITY_PROVIDER_DECRYPTION_JWKS`               | the private keys that decrypt the ID token                                    |
| `IDENTITY_PROVIDER_JWKS_URI`                      | the provider's public signing keys                                            |
| `IDENTITY_PROVIDER_ISSUER`                        | the expected issuer of the ID token                                           |
| `IDENTITY_CALLBACK_SERVER_SECRET`                 | the secret the callback sends to `identity-callback`                          |
| `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` | Signicat: the authorization endpoint                                          |
| `IDENTITY_PROVIDER_TOKEN_ENDPOINT`                | Signicat: the token endpoint                                                  |
| `IDENTITY_PROVIDER_CLIENT_SECRET`                 | Signicat: the client secret                                                   |
| `IDURA_DOMAIN`                                    | Idura: the tenant domain                                                      |
| `IDURA_SIGNING_JWKS`                              | Idura: the private key that signs the request object and the client assertion |
| `IDURA_SIGNING_KEY_KID`                           | Idura: which key in `IDURA_SIGNING_JWKS` to use                               |

Only the `PUBLIC_` variables reach the browser; the others are read by the server routes only.

The `identity-callback` Edge Function reads its own environment: `IDENTITY_CALLBACK_SERVER_SECRET`, `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID` and `IDENTITY_PROVIDER_ISSUER`, each required. Locally, its template is [`apps/supabase/supabase/functions/.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/.env.example); see [Edge Functions](/developers-guide/backend/edge-functions) for how the local runtime reads it. `IDENTITY_PROVIDER_TYPE` and `IDENTITY_PROVIDER_CLIENT_ID` must have the same values as their `PUBLIC_` twins in the root `.env`. To compare the two files by name, run:

```bash
yarn check:env-local
```

`IDENTITY_CALLBACK_SERVER_SECRET` is one random value of at least 32 bytes, for example from `openssl rand -hex 32`, and the frontend server and the function must hold the same value: in a hosted deployment, a private environment variable of the frontend service and a secret of the function. Without it on the frontend server every identification ends on `configuration_error`, and without it on the function the function answers `configuration`. The confirmation mail is sent by `account-access`, which needs its own `SITE_URL` and `SMTP_*` variables.

## Testing

- The identity-provider E2E projects run in every E2E run. `bank-auth` calls `identity-callback` directly with tokens built from committed test keys, and `contestant-identity-provider` walks a browser through the registration screen, a mock OIDC issuer, the callback, the success view, the confirmation mail and the error screen. `tests/scripts/e2e-run.sh` serves the function with a test environment and a secret generated for the run, points the dev server at the mock issuer, and restores the local stack afterwards.
- [`tests/IDURA-TEST-RUNBOOK.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/IDURA-TEST-RUNBOOK.md) walks through a manual end-to-end test against an Idura test tenant.
