# Development troubleshooting

## Commit error: ’Husky not found’

Try running `npx husky install`.

If that doesn't work, you may need to add these lines to the start of the untracked `/.husky/_/husky.sh` file:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

## Commit error: ’TypeError: Cannot read properties of undefined (reading 'font')’ error when running `/generateTranslationKeyType.ts`

Try running `yarn workspace vaa-app-shared build` first.

## Docker error related to `frozen lockfile` when running `yarn dev`

Try deleting `/yarn.lock` and rerunning the command. You may also:

- check that you’re using the correct Node version (see [Docker Setup: Requirements](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/docker-setup-guide.md#requirements)).
- follow the steps in [Docker error: ”No space left on device” error](#docker-no-space-left-on-device-error) below.

## Docker error: Load metadata for docker.io/library/node:foo

Docker needs to be connected to the internet to load the base Docker images.

## Docker error: ’No space left on device’ error

Docker has some issues handling disk usage when spun up multiple times. They may result in errors, such as `Error response from daemon [...] no space left on device`, or similar ones in the logs of the (Postgres) container. To fix these some or all of the steps below may be needed:

1. Clear the Docker cache (see [full guide](https://www.blacksmith.sh/blog/a-guide-to-disk-space-management-with-docker-how-to-clear-your-cache))
   - **Warning!** If you have containers, volumes or images you want to keep, do not run the commands below.
   - Run `docker system df` to see Docker disk usage
   - Stop all containers and prune them: `docker stop $(docker ps -q) && docker container prune`
   - Prune all unused images `docker image prune --all`
   - Prune all unused volumes `docker volume prune`
   - Clear the build cache `docker builder prune`
2. On Mac you may need to remove the Docker raw file with `rm ~/Library/Containers/com.docker.docker/Data/vms/0/data/Docker.raw`
3. Restart your computer to clear any temp files possibly bloated by Docker.

Note also that there are two commands that can be used to stop the containers:

1. `yarn dev:down`: This command will remove the unused volumes
2. `yarn dev:stop`: This command stops the containers but keeps the volumes

## Docker error: Service "foo" can't be used with `extends` as it declare `depends_on`

Update your Docker engine to a more recent version.

## Frontend: Candidate registration fails with ’Bad Request’ error

The `email` property is required for a `Candidate`. If it is not set, registration will result in a ’Bad Request’ error.

## Frontend: Changes to the content in Strapi not updated in the frontend

If you’re adding the content manually in Strapi, make sure to `Publish` all changes to content types that require publishing, such as `Candidate`s.

## Frontend: Server error when trying to access frontend

It takes a while for Strapi to kick up even after the Docker container is running, so if you just started it, wait a few minutes.

If that's not the issue, open Docker and check the `frontend` and `strapi` containers' logs for possible clues.

## Frontend: Strapi relations are not populated

The REST api query syntax can be a bit tricky, notably `*` only goes one-level deep.

Another possible cause is that the access control policy does not allow populating the relations. The policy is defined for each API route in [`backend/vaa-strapi/src/api/<schema>/routes/<schema>.ts`](../backend/vaa-strapi/src/api). For more information, see [Security](./security.md).

## Playwright: `TimeoutError` when locating elements and running the tests locally

Elements are currently located mostly by their translated labels with hardcoded locales, which match those in the mock data. If, however, the `supportedLocales` you have set in [staticSettings.ts](../vaa-app-shared/src/settings/staticSettings.ts) differ from the ones used by the tests, many of them will fail.

## Strapi: Content model is reset after restart

Any changes to the content model are not reflected on local files by default. If you can't see any changes in your local files when editing the content types using Strapi's web UI, check that you have [hot reloading enabled](./docker-setup-guide.md#hot-reloading).

## Strapi error: ’Relation already exists’ error on restart after editing the content model

If Strapi gives an error dealing with creating a table with the message that a relation or table already exists, such as the example below, it may be due to [a name that is longer than 63 characters](https://forum.strapi.io/t/create-index-already-exists/16835/7). To fix, shorten the name of the component or its parent. If the name cannot be easily shortened, you can only edit the internal names. For an example, see [this commit](https://github.com/OpenVAA/voting-advice-application/pull/577/commits/a9689458045ee1ebb9e2d00243d2befa5d571574).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              |
|   error: create table "public"."components_settings_entity_details_show_missing_election_symbols" ("id" serial primary key, "candidate" boolean      |
|   null, "party" boolean null) - relation                                     |
|   "components_settings_entity_details_show_missing_election_symbol"          |
|   already exists                                                             |
|   at Parser.parseErrorMessage                                                |
|   (/opt/node_modules/pg-protocol/dist/parser.js:283:98)                      |
|   at Parser.handlePacket                                                     |
|   (/opt/node_modules/pg-protocol/dist/parser.js:122:29)                      |
|   at Parser.parse (/opt/node_modules/pg-protocol/dist/parser.js:35:38)       |
|   at Socket.<anonymous>                                                      |
|   (/opt/node_modules/pg-protocol/dist/index.js:11:42)                        |
|   at Socket.emit (node:events:517:28)                                        |
|   at Socket.emit (node:domain:489:12)                                        |
|   at addChunk (node:internal/streams/readable:368:12)                        |
|   at readableAddChunk (node:internal/streams/readable:341:9)                 |
|   at Readable.push (node:internal/streams/readable:278:10)                   |
|   at TCP.onStreamRead (node:internal/stream_base_commons:190:23)             |
|                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```
