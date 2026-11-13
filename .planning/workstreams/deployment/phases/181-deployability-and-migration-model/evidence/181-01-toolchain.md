ATTEMPT=20261012T155306Z.d00e93b8b92f
HEAD=d00e93b8b92fff62d9fbbbea91d24f54c2d01803
TREE_CLEAN_BEFORE_INSTALL=yes
TREE_CLEAN_AFTER_INSTALL=yes
HEAD_AFTER_INSTALL=d00e93b8b92fff62d9fbbbea91d24f54c2d01803
NODE=v24.21.0
YARN=4.18.1
SUPABASE_CLI=2.118.0
PSQL=psql (PostgreSQL) 17.6 (Homebrew)
PG_DUMP=pg_dump (PostgreSQL) 17.6 (Homebrew)
DOCKER=Docker version 29.7.2, build a7dcaa6
CURL=curl 8.7.1 (x86_64-apple-darwin25.0) libcurl/8.7.1 (SecureTransport) LibreSSL/3.3.6 zlib/1.2.12 nghttp2/1.68.1
INSTALL_EXIT=0
DATE=2026-10-12T15:55:30Z

Notes
- Command: yarn install --immutable, from the repository root, with $HOME/.nvm/versions/node/v24.21.0/bin first in PATH.
- psql major version: 17. It is 16 or newer, so the client has the \bind meta-command that the bootstrap script of a later plan needs.
- The yarn shim on PATH is the corepack shim of another nvm Node (v24.14.1); it runs under the Node that is first in PATH. yarn node --version printed v24.21.0.
- Both tree samples are a whole-tree git status --porcelain --untracked-files=no with empty output.
- Present and executable after the install: node_modules/.bin/supabase, vitest, turbo, prettier.
- The Supabase CLI was run only as --version. It also printed an update notice (a newer CLI release exists); the lockfile pins 2.118.0 and nothing was updated.
- The install ended with "Done with warnings". The warning lines, verbatim:
    ➤ YN0002: │ root-workspace-0b6124@workspace:. doesn't provide playwright-core (p8618b2), requested by @axe-core/playwright.
    ➤ YN0086: │ Some peer dependencies are incorrectly met by your project; run yarn explain peer-requirements <hash> for details, where <hash> is the six-letter p-prefixed code.
- Last line of the install output:
    ➤ YN0000: · Done with warnings in 5s 398ms
