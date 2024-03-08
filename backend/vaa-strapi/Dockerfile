FROM node:18-alpine3.18 as base

RUN apk add --no-cache python3 make g++

WORKDIR /opt/
COPY . .

WORKDIR /opt/strapi-plugin-import-export-entries/
RUN yarn install
RUN yarn build

WORKDIR /opt/
RUN yarn install

FROM base as development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337
RUN yarn build -- --ignore-prompts
CMD yarn dev --ignore-prompts

FROM base as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337

RUN yarn build -- --ignore-prompts
CMD yarn start
