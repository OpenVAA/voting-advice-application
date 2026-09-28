# Phase 155 — Signicat subject-claim stability: the citation behind REVIEW-EDGE-04

**Requirement:** REVIEW-EDGE-04 — *"No identity is matched on a field that is not unique per person,
and that claim rests on cited provider documentation rather than on assumption."*

**What this record is for.** `identity-callback/claimConfig.ts` keys both providers on the OIDC `sub`
claim, and `identity-callback/index.ts` turns that value into **both** the
`app_metadata.identity_match_value` lookup key **and** the local part of the placeholder email the
Supabase auth user is created with. Two people whose `sub` values collide therefore resolve to ONE
Supabase account, and the second to authenticate is handed a session for the first. The code is
correct today. What was missing was the evidence that the provider's `sub` actually has the property
the code depends on. This file is that evidence, recorded so a later reader can **re-derive** the
verdict from the same sources rather than re-judge it.

**Verdict: CONFIRMED — stable per person for a given Signicat organisation.**
D-D1's escalation branch did **not** fire. No code value was changed.

**Checked by:** Phase 155 Plan 03, Task 2. **Retrieval date for every source below: 2026-08-29.**

---

## Method, so the fetch is reproducible

A plain `curl` returns 404 for these pages; a request carrying a browser user agent returns 200, and
appending `.md` to the path yields the provider's own markdown source rather than the rendered page.
The three sources below were fetched exactly this way:

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
curl -sS -A "$UA" -L "https://developer.signicat.com/docs/eid-hub/concepts/subject.md"
curl -sS -A "$UA" -L "https://developer.signicat.com/identity-methods/ftn/attributes-reference.md"
curl -sS -A "$UA" -L "https://developer.signicat.com/identity-methods/ftn/integration-guide/oidc-ftn.md"
```

SHA-256 of the bytes retrieved on 2026-08-29, so a later reader can tell a re-fetch apart from a
re-quote:

| Source | SHA-256 |
|---|---|
| `subject.md` | `2299064a8eab81f5ed00a6eacc43a2e2e8995273cfc6138e69d14c02c7cac440` |
| `ftn-attributes.md` | `73e4e108d9fab0933b5b123b0556d8ce5cfaa0e360e00a3de91440fcc0706f3f` |
| `ftn-oidc.md` | `46ffebe9e4a51b89ad2a8bcfd2756a06d8a5f3435d5b1f555baa50b842589494` |

---

## Source 1 — the Subject concept page, where the apparent contradiction lives and is resolved

**URL:** <https://developer.signicat.com/docs/eid-hub/concepts/subject>
**Retrieved:** 2026-08-29

### The sentence that appears to fail the criterion

Under *Subject types*, verbatim:

> - **Persistent**: An eID always supplies the exact same value to identify a specific end-user across sessions.
> - **Transient**: The subject varies across authentication sessions. For example, Finnish Trust Network (FTN) provides a different subject identifier for each new session.

Read alone, that sentence names our exact eID — Finnish Trust Network — as **Transient**, and a
transient subject is precisely the thing REVIEW-EDGE-04 forbids keying an account on. **The naive
reading is wrong**, and it is worth stating why rather than leaving the next reader to rediscover it
and panic.

### The next section on the same page, which is what saves the criterion

Under *Raw subject and the idpId attribute*, verbatim:

> We apply the following logic to generate the `idpId` attribute that we send you:
>
> - If an eID returns a **Persistent** subject identifier to Signicat, we use this value as the `idpId` to generate the hashed subject.
> - If an eID returns a **Transient** subject or does not return any subject identifier to Signicat, we try to generate a persistent hashed subject from another attribute. The criteria to choose an attribute is that it must be unique and consistent to identify a specific end-user. For example, we may select the National Identity Number (`nin`) as the `idpId`.

So the transience is **upstream of us**. FTN hands Signicat a Transient subject; Signicat does not pass
it through. It substitutes a unique-and-consistent attribute and derives a persistent hashed subject
from that. What reaches our Edge Function in the `sub` claim is the hashed, persistent value — not the
per-session one the *Subject types* table describes.

**"Transient" and "persistent" appear in the same section above on purpose**: the contradiction is the
whole difficulty of this criterion, and eliding either half would leave the record easier to read and
useless to check.

### The hash definition, which supplies caveat 2

Verbatim, from *Hashing algorithm* on the same page:

> ```
> Hashed_Subject = Replace(Base64(Sha256(output_of_proprietary_algorithm)))
> ```
>
> - `idp`: Signicat-specific code to indicate the eID used for authentication. For example, `nbid` for Norwegian BankID.
> - `idpId`: Raw subject, as provided by the eID (identity provider).
> - `organizationId`: Uniquer identifier of your organisation, as registered in the Signicat Dashboard.

(`Uniquer` is the provider's own typo, quoted as found.)

---

## Source 2 — the FTN attributes reference, which shows what was substituted, and warns off one claim

**URL:** <https://developer.signicat.com/identity-methods/ftn/attributes-reference>
**Retrieved:** 2026-08-29

The OIDC claims table, verbatim, on the claim a future maintainer is most likely to reach for:

> | `ftn_sub` | `uuidbd9ab4e7-019c-1ac1-b750-da3c51b092a9` | A unique identifier returned by the bank. **Note**: Do not use this attribute as a permanent identifier for the end-user, as it may be transient and is not guaranteed to be globally unique. |

And the REST/SAML response example, showing the hashed subject beside the raw one it was derived from:

> ```json
> "subject": {
> 	"id": "tPrysd7qtFvlSEBh7sYG0R8LXYYIgnZ5RmlR-Vl9IEs=",
> 	"idpId": "070770-905D",
> ```

`070770-905D` is the HETU shape. The `idpId` — the raw subject Signicat hashed — **is the national
identity number**, which is exactly the substitution Source 1 described in the abstract.

---

## Source 3 — the FTN OIDC integration guide, which ties the two together in an ID token

**URL:** <https://developer.signicat.com/identity-methods/ftn/integration-guide/oidc-ftn>
**Retrieved:** 2026-08-29

The decoded ID-token payload example, verbatim (excerpted):

> ```json
> {
>   "iss": "https://<YOUR_SIGNICAT_DOMAIN>/auth/open",
>   "aud": "<OIDC_CLIENT_ID>",
>   "sub": "2uwfL96EEeJCQSqGbrWwTr5S3sCK9SibSlv2-EAf7A8=",
>   "idp": "ftn",
>   "idp_id": "070770-905D",
>   "ftn_hetu": "070770-905D",
>   "ftn_sub": "uuidbd81b3dc-019c-1db6-8e83-f58d59c71301",
> ```

Three claims, three different values, in one token: `sub` is the hashed persistent subject we key on,
`idp_id` is the raw substituted attribute (the HETU), and `ftn_sub` is the bank's own identifier the
provider explicitly tells us not to use. They are visibly distinct, which is the point.

---

## The three caveats — operational facts, not code defects

**Caveat 1 — the stability is manufactured, not intrinsic, and its input is the HETU.**
FTN's own subject is transient; the persistence is Signicat's construction, built by substituting the
national identity number and hashing it (Sources 1 and 2). If Signicat ever changes which attribute it
substitutes for FTN, every stored `identity_match_value` in our database is invalidated at once, and
every returning candidate looks like a new person.

**Caveat 2 — `organizationId` is an input to the hash, so a Signicat organisation change re-keys every
user.** The hash definition in Source 1 lists `organizationId` alongside `idp` and `idpId`. Migrating
to a different Signicat organisation therefore changes every `sub` we have ever stored. That is a data
migration event with a planned re-key, not a configuration change, and treating it as the latter would
silently orphan every existing candidate account.

**Caveat 3 — `ftn_sub` is a different claim and must never be substituted for `sub`.**
The provider's own warning is quoted verbatim in Source 2: *"Do not use this attribute as a permanent
identifier for the end-user, as it may be transient and is not guaranteed to be globally unique."*
Our code uses the OIDC `sub` claim. A future reader "improving" `identityMatchProp` onto the
more-specific-looking `ftn_sub` would reintroduce exactly the collision class Phase 142.1 removed when
it rekeyed Signicat off `birthdate`. This is the single most valuable sentence on this page, which is
why a condensed form of it now sits in `claimConfig.ts`'s `PROVIDER_CONFIGS` docstring — the file
somebody opens immediately before making that change.

---

## The honest limitation: how these pages tie to *this* deployment

The pages quoted above are Signicat's **eID Hub** documentation. Nothing in them names OpenVAA. The
tie is a shared authentication path segment, and it is offered as evidence for a reader to judge rather
than asserted as proof:

| | Value |
|---|---|
| Our configured issuer (`.env.example:62`) | `IDENTITY_PROVIDER_ISSUER=https://openvaa.sandbox.signicat.com/auth/open` |
| Our configured JWKS URI (`.env.example:57`) | `https://openvaa.sandbox.signicat.com/auth/open/.well-known/openid-configuration/jwks` |
| The issuer in Signicat's own FTN ID-token example (Source 3) | `"iss": "https://<YOUR_SIGNICAT_DOMAIN>/auth/open"` |

The `/auth/open` path segment matches, with our sandbox host in the position of the placeholder domain.
I regard the tie as sound but **not airtight**: it is an inference from a URL shape, not a statement by
the provider about our tenant. The way to make it airtight is to decode a real ID token from
`openvaa.sandbox.signicat.com` and observe a `sub` of the hashed shape above, which the opt-in
`PLAYWRIGHT_BANK_AUTH` suite is positioned to do and which no run has yet done.

## One further product-specific note, affecting metadata rather than the key

Source 3 documents an OIDC client setting, verbatim:

> 3. Navigate to the **Advanced > Security** tab and edit the **ID Token User data**. You can choose between:
>     - **Standard Scopes** (default): Returns the standard OIDC scopes.
>     - **All**: Returns all claims.
>     - **Minimal**: Returns only `sub`.

and Source 2 adds: *"To return `nin`, ensure you have set **ID Token User data** to **All**"*.

This does **not** threaten the criterion — `sub` is returned under every one of the three settings,
including **Minimal**. It does mean that if the OpenVAA client is configured **Minimal**, the
`extractClaims` metadata (`birthdate`, and `hetu` on the Idura config) silently yields nothing. That is
a metadata gap, not an identity defect, and it is a Dashboard setting rather than a code change.

*(Attribution correction against `155-RESEARCH.md`: measured on 2026-08-29, the `nin`-requires-**All**
warning is on the attributes-reference page and the Standard/All/Minimal enumeration is on the OIDC
integration guide. RESEARCH attributed both to the integration guide. The wording of each is unchanged;
only which page carries which differs.)*

---

## Disposition

**REVIEW-EDGE-04 is closed on evidence.** `identityMatchProp: 'sub'` is correct for both providers,
unchanged by this plan, and locked by `claimConfig.test.ts`. Should a future re-check find that the
substitution paragraph in Source 1 has been removed or narrowed to exclude the configured product line,
D-D1 makes that a **decision checkpoint for the operator**, not something an executor absorbs: do not
change `identityMatchProp` on your own judgement.
