# 188-06 local refusal run (C-01, RELAY-09)

Date: 2026-11-18, 19:06:27Z to 19:06:35Z (UTC).

What ran: `infra/scripts/relay-refusals.sh --base-url http://localhost:5274 --probe p188c01l20261118T190629Z` against a dev server of this checkout (`yarn workspace @openvaa/frontend dev`), started in the background with `FRONTEND_PORT=5274 ANALYTICS_PROVIDER=log ANALYTICS_FLUSH_INTERVAL_MS=2000` (the flush interval set to its default explicitly, so the 5-second wait did not depend on the unread root `.env`). Tree: HEAD `ab480fb82` plus the uncommitted `infra/scripts/relay-refusals.sh` committed with this file. `GET /api/health` answered 200 after 3 s. Before the timed cases one warm-up POST with `Sec-Fetch-Site: cross-site` and body `{}` compiled the usage route; it answered 403 and carries no event.

The provider side was read from the dev server's own output: the log provider writes one JSON line per kept event. Counted after a 5-second wait for the timer flush, by `grep -cF '"questionId":"<id>"'`, so a suffixed id is not counted as the control's.

## The script's lines

```
c01_cross_site status=403 expected=403 result=PASS
c01_foreign_origin status=403 expected=403 result=PASS
c01_declared_33k status=413 expected=413 result=PASS
c01_chunked_33k status=413 expected=413 result=PASS
c01_envelope_destination status=400 expected=400 result=PASS
c01_envelope_host status=400 expected=400 result=PASS
c01_event_url status=204 expected=204 result=PASS
c01_event_host status=204 expected=204 result=PASS
c01_control status=204 expected=204 result=PASS
c01_summary cases=9 failed=0
```

## The named results

LOCAL_SCRIPT_EXIT=0
LOCAL_CONTROL_LINES=1
LOCAL_URL_EVENT_LINES=0
LOCAL_HOST_EVENT_LINES=0
LOCAL_REFUSED_REQUEST_EVENT_LINES=0
LOCAL_PROBE_SUBSTRING_LINES=1
LOCAL_DEV_SERVER_STOPPED=yes

- `LOCAL_REFUSED_REQUEST_EVENT_LINES` sums the lines of the four refused requests' event ids (`<probe>c`, `<probe>o`, `<probe>d`, `<probe>e`).
- `LOCAL_PROBE_SUBSTRING_LINES` counts every line holding the probe id at all, suffixed or not: one, the control's.
- The one line, as the log provider wrote it:
  `{"level":30,"severityText":"INFO","time":1795028789962,"msg":"answer","attributes":{"questionId":"p188c01l20261118T190629Z","value":1,"openvaa.app":"voter"}}`
- `lsof -i :5274` exited 1 after the server was stopped.

## What this does and does not show

- Each refusal comes from the relay itself, with a provider active (research Pitfall 8): every case's body is a valid envelope except where the body is the case, so the 403s and 400s are the origin and envelope rules, not a malformed body.
- The chunked case was sent with `Transfer-Encoding: chunked` and no `Content-Length` (seen at a loopback listener: `transfer-encoding: chunked`, 33792 bytes received, no content-length), so locally its 413 is the streamed-body check. On staging a CDN may forward the body declared (Pitfall 6); the deployed line will not tell the two apart.
- The two `event_` cases' 204s are not the evidence that the events were dropped; the zero line counts are.
