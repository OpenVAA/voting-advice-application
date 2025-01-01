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

FROM base AS frontend

WORKDIR /opt

# Copy only the packages we need
COPY --from=shared /opt/packages packages
COPY --from=shared /opt/frontend frontend

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
CMD node ./frontend/build/index.js