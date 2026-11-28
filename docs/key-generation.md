# Identity Provider Key Generation

## Overview

Bank authentication uses up to two RSA key pairs of your own. They work in opposite directions, which is why there are two private-key variables:

| Key pair | Which provider needs it | What it does | Private half goes to | Public half goes to |
| --- | --- | --- | --- | --- |
| **Signing** | Idura only | Your server signs the authorization request (JAR) and the `private_key_jwt` client assertion, so the provider knows a request came from your client. | `IDURA_SIGNING_JWKS`, read by the frontend server only | The provider's dashboard, which verifies your signatures with it |
| **Encryption** | Idura and Signicat | The provider encrypts the ID token to you (a JWE), so only you can read the identity it carries. | `IDENTITY_PROVIDER_DECRYPTION_JWKS`, read by the frontend server and by the `identity-callback` Edge Function, which both decrypt the token | The provider's dashboard, which encrypts tokens for you with it |

Signicat authenticates your client with a client secret (`IDENTITY_PROVIDER_CLIENT_SECRET`) instead of a signed assertion, so a Signicat deployment generates only the encryption key pair and has no `IDURA_SIGNING_JWKS`.

The two pairs are kept separate rather than one key doing both jobs: each JWK carries a single `use` (`sig` or `enc`), the provider looks each one up by its `kid`, and either can be rotated without touching the other.

The **public** halves are not secret and go into no variable and no file of the repository: you register them with the provider (Step 3), and that is their only use. The **private** halves are secrets and go into the variables of Step 2, stored as Step 4 describes.

Both key pairs must be RSA 2048-bit or larger, per Traficom 213/2023 Finnish Trust Network specification.

## Prerequisites

- **Node.js** 22+ and Yarn 4 (already required by the monorepo)
- `yarn install` has been run at the repo root

The scripts referenced below live in the `@openvaa/dev-tools` workspace (`packages/dev-tools`) and are thin CLIs over the [`jose`](https://github.com/panva/jose) library. OpenSSL is only needed if you prefer to manage PEM files manually (Step 1b).

## Step 1a (Recommended): Generate Key Pair In Memory

This path never writes PEM files to disk. It generates the key pair, prints the private JWK already wrapped in the `[...]` shape the env var expects, and prints the public JWK ready for the provider dashboard.

```bash
# Signing key pair (Idura JAR + private_key_jwt)
yarn workspace @openvaa/dev-tools keygen \
  --type signing \
  --kid openvaa-signing-1

# Encryption key pair (Idura -- RSA-OAEP-256 by default)
yarn workspace @openvaa/dev-tools keygen \
  --type encryption \
  --kid openvaa-encryption-1

# Encryption key pair for Signicat (RSA-OAEP)
yarn workspace @openvaa/dev-tools keygen \
  --type encryption \
  --kid my-signicat-enc-1 \
  --alg RSA-OAEP
```

Each invocation prints two JSON blocks to stdout: the private JWK (for the variable, Step 2) and the public JWK (for the provider dashboard, Step 3). Redirect to files or a password manager as needed.

## Step 1b (Alternative): Convert Existing PEM Files

Use this when you already have PEM-encoded keys (e.g., issued by your org's PKI) and need to convert them to JWK format.

```bash
# Generate PEMs (standard OpenSSL; one-time, per pair)
openssl genrsa -out signing-private.pem 2048
openssl rsa -in signing-private.pem -pubout -out signing-public.pem

# Convert private PEM -> private JWK (for env var)
yarn workspace @openvaa/dev-tools pem-to-jwk \
  --in "$PWD/signing-private.pem" \
  --type signing \
  --kid openvaa-signing-1

# Convert public PEM -> public JWK (for provider dashboard)
yarn workspace @openvaa/dev-tools pem-to-jwk \
  --in "$PWD/signing-public.pem" \
  --type signing \
  --kid openvaa-signing-1
```

For encryption keys, replace `--type signing` with `--type encryption`. Pass `--alg RSA-OAEP` when generating a Signicat encryption key.

The `pem-to-jwk` script auto-detects private vs public from the PEM header. Pass `--help` for full usage:

```bash
yarn workspace @openvaa/dev-tools pem-to-jwk --help
yarn workspace @openvaa/dev-tools keygen --help
```

> **Note:** paths passed to `pem-to-jwk` are resolved relative to `packages/dev-tools`, so use `$PWD/...` or absolute paths when running from the repo root.

## Step 2: Format the Private Keys for the Variables

The variables expect a JSON array of private JWK objects. The `keygen` output's first block is already in this shape; the second block, the public JWK, is for Step 3 only.

### IDURA_SIGNING_JWKS

Wrap the private signing JWK in an array:

```bash
# Format: JSON array with one key
IDURA_SIGNING_JWKS='[{"kty":"RSA","kid":"openvaa-signing-1","use":"sig","alg":"RS256","n":"...","e":"...","d":"...","p":"...","q":"...","dp":"...","dq":"...","qi":"..."}]'
```

### IDENTITY_PROVIDER_DECRYPTION_JWKS

Wrap the private encryption JWK in an array:

```bash
# For Idura (RSA-OAEP-256):
IDENTITY_PROVIDER_DECRYPTION_JWKS='[{"kty":"RSA","kid":"openvaa-encryption-1","use":"enc","alg":"RSA-OAEP-256","n":"...","e":"...","d":"...","p":"...","q":"...","dp":"...","dq":"...","qi":"..."}]'

# For Signicat (RSA-OAEP):
IDENTITY_PROVIDER_DECRYPTION_JWKS='[{"kty":"RSA","kid":"{key_id}","use":"enc","alg":"RSA-OAEP","n":"...","e":"...","d":"...","p":"...","q":"...","dp":"...","dq":"...","qi":"..."}]'
```

Note the algorithm difference: Signicat uses `RSA-OAEP`, Idura uses `RSA-OAEP-256`. The `jose` library handles both transparently via `compactDecrypt()`.

### IDURA_SIGNING_KEY_KID

Set this to match the `kid` field of the signing key:

```bash
IDURA_SIGNING_KEY_KID=openvaa-signing-1
```

## Step 3: Register the Public Keys with the Provider

The second JSON block that `keygen` prints, under `# Public JWK — register in the provider dashboard`, goes into the identity provider's dashboard, nowhere else. The provider uses it to verify what you sign and to encrypt the ID token for you. It is not secret, but there is no variable for it: keep a copy next to the private key in your password manager so that you can register it again. A public JWK can also be recovered from the private one by dropping its private fields (`d`, `p`, `q`, `dp`, `dq` and `qi`).

### Idura

1. Log in to the Idura Dashboard.
2. Navigate to Application > OpenID Connect > Client JWKS.
3. Register both public keys, signing and encryption, as one JWKS: put the two public JWKs into the `keys` array of a single document.

```json
{
  "keys": [
    {"kty":"RSA","kid":"openvaa-signing-1","use":"sig","alg":"RS256","n":"...","e":"..."},
    {"kty":"RSA","kid":"openvaa-encryption-1","use":"enc","alg":"RSA-OAEP-256","n":"...","e":"..."}
  ]
}
```

### Signicat

1. Log in to the Signicat Dashboard.
2. Navigate to OIDC Clients > your client > Public Keys.
3. Upload the encryption public key. There is no signing key to register: Signicat authenticates the client with its client secret.

## Step 4: Store the Private Keys

Where the private keys and the other secrets go depends on where the application runs. In every case they stay out of version control.

| Where | `IDURA_SIGNING_JWKS` (Idura) | `IDENTITY_PROVIDER_DECRYPTION_JWKS` |
| --- | --- | --- |
| Local development | The root `.env`, which git ignores | The root `.env`, and `apps/supabase/supabase/functions/.env` for `identity-callback` |
| AWS deployment, frontend task | An SSM SecureString parameter under the AWS root's `parameter_path` | An SSM SecureString parameter under the same path |
| AWS deployment, `identity-callback` | Not needed: the function never signs | `TF_VAR_identity_provider_decryption_jwks`, exported in the shell that plans and applies the Supabase root |

The deployment guide's [Identity provider settings](https://openvaa.org/developers-guide/deployment#identity-provider-settings) section gives the commands for the AWS path.

## Security Notes

- **Never commit private keys** to version control. Store them as environment variables or secrets.
- **Supabase deployments**: `identity-callback` reads only `IDENTITY_PROVIDER_DECRYPTION_JWKS` of the two key sets. On the AWS path the Supabase root sends it as a function secret; never give the function `IDURA_SIGNING_JWKS`, which it does not use.
- **SvelteKit**: Private keys are accessed via `$env/dynamic/private` which ensures they are never exposed to the client.
- **Key rotation**: When rotating keys, generate new key pairs with incremented KIDs (e.g., `openvaa-signing-2`), register the new public keys, update env vars, then remove old keys from the provider dashboard.
- **Minimum key size**: RSA 2048-bit per Traficom 213/2023 Finnish Trust Network specification. Using 4096-bit provides additional security margin at the cost of slightly slower operations. Override the default via `--size 4096` on the `keygen` script.
- **PEM files**: Step 1a avoids writing PEMs to disk at all. If you go through Step 1b, delete the `.pem` files after converting to JWK format. The repo's `.gitignore` excludes `*.pem` so stray files will not be committed by accident, but they are still sensitive secrets on disk.
