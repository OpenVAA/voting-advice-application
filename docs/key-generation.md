# Identity Provider Key Generation

## Overview

OpenVAA's identity provider integration requires two RSA key pairs:

1. **Signing key pair** -- Used for JWT Authorization Requests (JAR) and `private_key_jwt` client authentication when using the Idura provider. The private key signs JWTs sent to the identity provider; the public key is registered in the provider's dashboard.

2. **Encryption key pair** -- Used for JWE decryption of id_tokens returned by the identity provider. The private key decrypts incoming JWE tokens; the public key is registered in the provider's dashboard so it can encrypt tokens for your application.

Both key pairs must be RSA 2048-bit or larger, per Traficom 213/2023 Finnish Trust Network specification.

## Prerequisites

- **openssl** (included in macOS and most Linux distributions)
- **Node.js** (v18+) with the `jose` library (`npm install jose`)

## Step 1: Generate Signing Key Pair

The signing key pair is used by the Idura provider for:
- Signing JWT Authorization Requests (JAR, RFC 9101)
- Creating `private_key_jwt` client assertions for token exchange (RFC 7523)

```bash
# Generate RSA 2048-bit private key
openssl genrsa -out signing-private.pem 2048

# Extract the public key
openssl rsa -in signing-private.pem -pubout -out signing-public.pem
```

### Convert to JWK Format

Use this Node.js script to convert the PEM private key to JWK format:

```javascript
import * as jose from 'jose';
import { readFileSync } from 'node:fs';

const pem = readFileSync('signing-private.pem', 'utf8');
const key = await jose.importPKCS8(pem, 'RS256');
const jwk = await jose.exportJWK(key);

// Add required metadata
jwk.kid = 'openvaa-signing-1';
jwk.use = 'sig';
jwk.alg = 'RS256';

console.log('Private JWK (for IDURA_SIGNING_JWKS env var):');
console.log(JSON.stringify(jwk, null, 2));
```

For the public key (to register in the provider dashboard):

```javascript
import * as jose from 'jose';
import { readFileSync } from 'node:fs';

const pem = readFileSync('signing-public.pem', 'utf8');
const key = await jose.importSPKI(pem, 'RS256');
const jwk = await jose.exportJWK(key);

jwk.kid = 'openvaa-signing-1';
jwk.use = 'sig';
jwk.alg = 'RS256';

console.log('Public JWK (for provider dashboard registration):');
console.log(JSON.stringify(jwk, null, 2));
```

## Step 2: Generate Encryption Key Pair

The encryption key pair is used by both providers for:
- Decrypting JWE-encrypted id_tokens returned by the identity provider

```bash
# Generate RSA 2048-bit private key
openssl genrsa -out encryption-private.pem 2048

# Extract the public key
openssl rsa -in encryption-private.pem -pubout -out encryption-public.pem
```

### Convert to JWK Format

```javascript
import * as jose from 'jose';
import { readFileSync } from 'node:fs';

const pem = readFileSync('encryption-private.pem', 'utf8');
const key = await jose.importPKCS8(pem, 'RSA-OAEP-256');
const jwk = await jose.exportJWK(key);

// Add required metadata
jwk.kid = 'openvaa-encryption-1';
jwk.use = 'enc';
jwk.alg = 'RSA-OAEP-256';

console.log('Private JWK (for IDENTITY_PROVIDER_DECRYPTION_JWKS env var):');
console.log(JSON.stringify(jwk, null, 2));
```

For the public key:

```javascript
import * as jose from 'jose';
import { readFileSync } from 'node:fs';

const pem = readFileSync('encryption-public.pem', 'utf8');
const key = await jose.importSPKI(pem, 'RSA-OAEP-256');
const jwk = await jose.exportJWK(key);

jwk.kid = 'openvaa-encryption-1';
jwk.use = 'enc';
jwk.alg = 'RSA-OAEP-256';

console.log('Public JWK (for provider dashboard registration):');
console.log(JSON.stringify(jwk, null, 2));
```

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
- **Minimum key size**: RSA 2048-bit per Traficom 213/2023 Finnish Trust Network specification. Using 4096-bit provides additional security margin at the cost of slightly slower operations.
- **PEM files**: Delete the `.pem` files after converting to JWK format and storing in environment variables. Do not leave them on disk.
