# Running the backend separately

0. You should be running Strapi with the Node version specified under `engines` in the root [package.json](https://github.com/OpenVAA/voting-advice-application/blob/main/package.json). Use of nvm is encouraged. **Additionally, you need Docker!**
1. Install dependencies by running `yarn install`.
2. Copy or rename the `.env.example` to `.env` before running any of the commands.
3. Run `docker compose -f docker-compose.dev.yml up postgres` to start Postgres container.
4. Run `yarn dev` or `yarn start` to run the Strapi server directly.
