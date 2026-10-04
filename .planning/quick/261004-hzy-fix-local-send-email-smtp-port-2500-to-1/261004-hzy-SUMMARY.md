---
quick_id: 261004-hzy
status: complete
commit: 04a6fd021
---

# Summary — local send-email SMTP_PORT 2500 → 1025 (Mailpit)

**Commit:** `04a6fd021` fix(supabase): point local send-email at Mailpit's SMTP port 1025

Changed `SMTP_PORT=2500` → `1025` in `.env.example`, `apps/supabase/supabase/functions/.env.example` and the
email docs page; the template comments now say Mailpit, reached by its `inbucket` alias on its in-network port
(not the host-mapped `smtp_port` 54325).

## Verification (observed)

- `docker inspect supabase_inbucket_openvaa-local`: alias `inbucket` on `supabase_network_openvaa-local`; image
  `mailpit:v1.30.2` exposes `1025/tcp` (SMTP), `1110`, `8025` — no 2500.
- `busybox nc inbucket 1025` on that network → `220 … Mailpit ESMTP Service ready`; `nc inbucket 2500` → refused.
- `git grep SMTP_PORT=2500` → only historical `.planning/` records remain.

## Not done

- The gitignored local `.env` and `apps/supabase/supabase/functions/.env` were not read or edited (secret-read
  guard). Operators who copied the old template must set `SMTP_PORT=1025` there themselves, then restart
  `supabase functions serve` / the stack.
- No end-to-end `send-email` invocation: the function has no live caller (Phase 155/169 notes); the Phase 169
  probe already observed delivery on 1025.
