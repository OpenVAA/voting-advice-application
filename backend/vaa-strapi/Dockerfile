FROM node:18-alpine3.18 as base

RUN apk add --no-cache python3 make g++ yarn

WORKDIR /opt/

FROM base as import-export

WORKDIR /opt/strapi-plugin-import-export-entries/

COPY backend/vaa-strapi/strapi-plugin-import-export-entries/ .
RUN yarn install
RUN yarn build

FROM base as strapi

WORKDIR /opt/

COPY backend/vaa-strapi/package* .
COPY backend/vaa-strapi/yarn* .
COPY --from=import-export /opt/strapi-plugin-import-export-entries /opt/strapi-plugin-import-export-entries
RUN yarn install
COPY backend/vaa-strapi/ .
COPY shared src/shared/

FROM strapi as development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_DISABLE_REMOTE_DATA_TRANSFER=true

EXPOSE 1337
RUN yarn build --ignore-prompts
CMD yarn dev --ignore-prompts

FROM strapi as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_DISABLE_REMOTE_DATA_TRANSFER=true

EXPOSE 1337

RUN yarn build --ignore-prompts
CMD yarn start
