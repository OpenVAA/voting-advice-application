# Identity Provider Key Generation

## Overview

OpenVAA's identity provider integration requires two RSA key pairs:

1. **Signing key pair** -- Used for JWT Authorization Requests (JAR) and `private_key_jwt` client authentication when using the Idura provider. The private key signs JWTs sent to the identity provider; the public key is registered in the provider's dashboard.

2. **Encryption key pair** -- Used for JWE decryption of id_tokens returned by the identity provider. The private key decrypts incoming JWE tokens; the public key is registered in the provider's dashboard so it can encrypt tokens for your application.

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

Each invocation prints two JSON blocks to stdout: the private JWK (paste into the env var) and the public JWK (register in the provider dashboard). Redirect to files or a password manager as needed.

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

## Step 3: Create JWKS for Environment Variables

Environment variables expect a JSON array of JWK objects.

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

## Step 4: Register Public Keys

Public keys must be registered with the identity provider so it can verify your signed requests and encrypt tokens for your application.

### Idura

1. Log in to the Idura Dashboard
2. Navigate to Application > OpenID Connect > Client JWKS
3. Register both public keys (signing + encryption) as a JWKS:

```json
{
  "keys": [
    {"kty":"RSA","kid":"openvaa-signing-1","use":"sig","alg":"RS256","n":"...","e":"..."},
    {"kty":"RSA","kid":"openvaa-encryption-1","use":"enc","alg":"RSA-OAEP-256","n":"...","e":"..."}
  ]
}
```

### Signicat

1. Log in to the Signicat Dashboard
2. Navigate to OIDC Clients > your client > Public Keys
3. Upload the encryption public key (Signicat manages signing keys server-side)

## Security Notes

- **Never commit private keys** to version control. Store them as environment variables or secrets.
- **Supabase deployments**: Store JWKS as Supabase secrets (`supabase secrets set IDURA_SIGNING_JWKS='...'`).
- **SvelteKit**: Private keys are accessed via `$env/dynamic/private` which ensures they are never exposed to the client.
- **Key rotation**: When rotating keys, generate new key pairs with incremented KIDs (e.g., `openvaa-signing-2`), register the new public keys, update env vars, then remove old keys from the provider dashboard.
- **Minimum key size**: RSA 2048-bit per Traficom 213/2023 Finnish Trust Network specification. Using 4096-bit provides additional security margin at the cost of slightly slower operations. Override the default via `--size 4096` on the `keygen` script.
- **PEM files**: Step 1a avoids writing PEMs to disk at all. If you go through Step 1b, delete the `.pem` files after converting to JWK format. The repo's `.gitignore` excludes `*.pem` so stray files will not be committed by accident, but they are still sensitive secrets on disk.
