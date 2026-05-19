FROM node:22-alpine AS base

WORKDIR /opt

# Setup env variable for yarn
ENV YARN_VERSION=4.13.0

# install and use yarn 4.x
RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

# Skip Husky installation in Docker
ENV HUSKY=0

COPY package.json yarn.lock .yarnrc.yml turbo.json ./
COPY .yarn ./.yarn
# To be able to use --immutable, we need to copy all the packages in the workspace
COPY apps apps
COPY packages packages
RUN yarn install --immutable

FROM base AS shared

WORKDIR /opt

# Build all shared modules
RUN yarn build

FROM base AS frontend

WORKDIR /opt

# Copy only the packages we need
COPY --from=shared /opt/packages packages
COPY --from=shared /opt/apps/frontend apps/frontend

FROM frontend AS development

WORKDIR /opt

EXPOSE 5173
CMD yarn workspace @openvaa/frontend dev --host

FROM frontend AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt

RUN yarn workspace @openvaa/frontend build

EXPOSE 3000
CMD node ./apps/frontend/build/index.js