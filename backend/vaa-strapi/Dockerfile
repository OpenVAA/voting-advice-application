FROM node:20.18.1-alpine AS base

WORKDIR /opt

# Skip Husky installation in Docker
ENV HUSKY=0

COPY package.json .
COPY yarn.lock .
# The shared-config contains devDependencies which are needed for install
COPY packages/shared-config/ ./packages/shared-config
RUN yarn install --frozen-lockfile

FROM base AS import-export

WORKDIR /opt/strapi-plugin-import-export-entries

COPY backend/vaa-strapi/strapi-plugin-import-export-entries/ .
RUN yarn install --frozen-lockfile
RUN yarn build

FROM base AS shared

WORKDIR /opt

# Install all shared modules used by the backend
# If changing these, remember to edit the copy commands in `production` as well
COPY packages/app-shared/ ./packages/app-shared
COPY packages/core ./packages/core
COPY packages/data ./packages/data
RUN yarn install --frozen-lockfile
RUN yarn workspace @openvaa/core build
RUN yarn workspace @openvaa/data build
RUN yarn workspace @openvaa/app-shared build

FROM base AS strapi

WORKDIR /opt

COPY --from=import-export /opt/strapi-plugin-import-export-entries ./backend/vaa-strapi/strapi-plugin-import-export-entries
COPY --from=shared /opt/packages ./packages
COPY backend/vaa-strapi/ ./backend/vaa-strapi
RUN yarn workspace @openvaa/strapi install --frozen-lockfile

FROM strapi AS development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_DISABLE_REMOTE_DATA_TRANSFER=true

EXPOSE 1337

RUN yarn workspace @openvaa/strapi build
CMD yarn workspace @openvaa/strapi dev --ignore-prompts

FROM strapi AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_DISABLE_REMOTE_DATA_TRANSFER=true

EXPOSE 1337

RUN yarn workspace @openvaa/strapi build
CMD yarn workspace @openvaa/strapi start
