# Deferred items: phase 185

## From plan 185-03

- **A server log record is written over several lines.** `configureLogger` in `apps/frontend/src/hooks.server.ts` sets no `sink`, so `@openvaa/app-shared`'s default writes `console.error(record)` (level 40 and above) or `console.info(record)`, and Node prints the record as a multi-line inspected object. The built server's shutdown line came out as 12 lines on standard error (see `evidence/185-03-built-server.md`). A line-based log driver such as the ECS `awslogs` driver would store each line as its own event, so a hosted observation that searches for the shutdown line finds `msg: 'The server is exiting after its stop.'` on one event and its fields on others. Out of scope for 185-03 (its files do not include the logger or its sink). Remedy for whichever plan reads the hosted log: a server-side sink that writes one `JSON.stringify(record)` line per record, or a log query that matches the message line alone.
