#!/usr/bin/env bash
# Commit the spike-026 fixture into the LOCAL database so PostgREST can see it, and write the ids the
# HTTP bench needs to ids.json. Undo with `yarn db:reset` (done at the end of the spike).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PG="${PG:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
{ printf '%s\n' 'BEGIN;'; cat "$HERE/fixture.sql"; cat <<SQL
\o $HERE/ids.json
SELECT json_build_object(
  'm', (SELECT id FROM spk_proj WHERE tag='M'), 'me', (SELECT election FROM spk_proj WHERE tag='M'),
  'mc1', (SELECT id FROM spk_const WHERE proj='M' AND idx=1),
  'r', (SELECT id FROM spk_proj WHERE tag='R'), 're', (SELECT election FROM spk_proj WHERE tag='R'),
  'rc1', (SELECT id FROM spk_const WHERE proj='R' AND idx=1),
  'mycand', (SELECT id FROM spk_cand WHERE proj='M' AND const_idx=1 AND k=7));
\o
COMMIT;
SQL
} | psql "$PG" -X -q -At -v ON_ERROR_STOP=1
cat "$HERE/ids.json"
