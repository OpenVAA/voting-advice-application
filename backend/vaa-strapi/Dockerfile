FROM node:18-alpine AS base

WORKDIR /opt

COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile

FROM base AS import-export

WORKDIR /opt/strapi-plugin-import-export-entries

COPY backend/vaa-strapi/strapi-plugin-import-export-entries/ .
RUN yarn install --frozen-lockfile
RUN yarn build

FROM base AS shared

WORKDIR /opt

COPY vaa-app-shared/ ./vaa-app-shared
RUN yarn workspace vaa-app-shared install --frozen-lockfile
RUN yarn workspace vaa-app-shared build

FROM base AS strapi

WORKDIR /opt

COPY --from=import-export /opt/strapi-plugin-import-export-entries ./backend/vaa-strapi/strapi-plugin-import-export-entries
COPY --from=shared /opt/vaa-app-shared ./vaa-app-shared
COPY backend/vaa-strapi/ ./backend/vaa-strapi
RUN yarn workspace vaa-strapi install --frozen-lockfile

FROM strapi AS development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_DISABLE_REMOTE_DATA_TRANSFER=true

EXPOSE 1337

RUN yarn workspace vaa-strapi build
CMD yarn workspace vaa-strapi dev --ignore-prompts

FROM strapi AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_DISABLE_REMOTE_DATA_TRANSFER=true

EXPOSE 1337

RUN yarn workspace vaa-strapi build
CMD yarn workspace vaa-strapi start
