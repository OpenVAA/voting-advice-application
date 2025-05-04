FROM node:20.18.1-alpine AS base

WORKDIR /opt

# Setup env variable for yarn
ENV YARN_VERSION=4.6

# install and use yarn 4.x
RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

# Skip Husky installation in Docker
ENV HUSKY=0

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
# To be able to use --immutable, we need to copy all the packages in the workspace
COPY backend backend
COPY frontend frontend
COPY packages packages
RUN yarn install --immutable

FROM base AS shared

WORKDIR /opt

# Build all shared modules
RUN yarn build:shared

FROM base AS strapi

WORKDIR /opt

# Copy only the packages we need
COPY --from=shared /opt/packages/app-shared ./packages/app-shared
COPY --from=shared /opt/packages/core ./packages/core
COPY --from=shared /opt/packages/llm ./packages/llm
COPY --from=shared /opt/packages/data ./packages/data
COPY --from=shared /opt/packages/argument-condensation ./packages/argument-condensation
COPY --from=shared /opt/packages/factor-analysis ./packages/factor-analysis
COPY --from=shared /opt/backend/vaa-strapi ./backend/vaa-strapi

FROM strapi AS development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337

RUN yarn workspace @openvaa/strapi build
CMD yarn workspace @openvaa/strapi dev

FROM strapi AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337

RUN yarn workspace @openvaa/strapi build
CMD yarn workspace @openvaa/strapi start
