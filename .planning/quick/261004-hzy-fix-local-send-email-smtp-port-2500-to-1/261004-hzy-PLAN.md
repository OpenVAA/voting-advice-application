---
quick_id: 261004-hzy
type: quick
---

# Fix local send-email SMTP_PORT 2500 → 1025 (Mailpit)

Closes the Phase 169 deferred item (`.planning/phases/169-dependency-bump-to-latest-safe-versions/deferred-items.md`):
the local `inbucket` service is now Mailpit, which listens for SMTP on 1025 inside the stack network, while both
`.env.example` templates still set the old Inbucket port 2500 (connection refused).

## Task 1 — set SMTP_PORT=1025 in templates and docs

- `.env.example` — `SMTP_PORT=1025`, comment names Mailpit + the in-network port
- `apps/supabase/supabase/functions/.env.example` — same
- `apps/docs/.../developers-guide/backend/email/+page.md` — example block

`SMTP_HOST=inbucket` stays: it is Mailpit's network alias on `supabase_network_openvaa-local`.

**Verify:** from a container on the stack network, `inbucket:1025` answers with Mailpit's ESMTP banner and
`inbucket:2500` is refused; no `SMTP_PORT=2500` left in tracked non-`.planning` files.
