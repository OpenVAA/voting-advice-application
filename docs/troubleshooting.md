# Development troubleshooting

## Commit error: Husky not found

Try running `npx husky install`.

If that doesn't work, you may need to add these lines to the start of the untracked `/.husky/_/husky.sh` file:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

## Docker error: No space left on device

If Docker produces an error akin to `Error response from daemon [...] no space left on device`
running `docker system prune` may help.

You may also try to run `docker volume prune` but be careful because it may delete local database data.

Source: [Remarkablemark](https://remarkablemark.org/blog/2021/08/05/docker-error-no-space-left-on-device/)

Note also that there are two commands that can be used to stop the containers:

1. `yarn dev:down`: This command will remove the unused volumes
2. `yarn dev:stop`: This command stops the containers but keeps the volumes

## Docker error: Load metadata for docker.io/library/node:foo

Docker needs to be connected to the internet to load the base Docker images.

## Server error when trying to access frontend

It takes a while for Strapi to kick up even after the Docker container is running, so if you just started it, wait a few minutes.

If that's not the issue, open Docker and check the `frontend` and `strapi` containers' logs for possible clues.

## Strapi's content model is reset after restart

Any changes to the content model are not reflected on local files by default. If you can't see any changes in your local files when editing the content types using Strapi's web UI, check that you have [hot reloading enabled](./docker-setup-guide.md#hot-reloading).

## Strapi does not populate relations

The REST api query syntax can be a bit tricky, notably `*` only goes one-level deep.

Another common case is that the Content Types that are not populated have been added to the schema after creating the API token. To allow reading them, edit the API token and change it from `Custom` to `Read-Only` and back (and check that locale listing is still allowed).

## Candidate registration fails

The `email` property is required for a `Candidate`. If it is not set, regisration will result in a 'Bad Request' error.