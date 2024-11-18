FROM node:18-alpine AS base

WORKDIR /opt

# Skip Husky installation in Docker
ENV HUSKY=0

# Install packages and cache the results
# so we don't have to install everything when source code changes
COPY package.json .
COPY yarn.lock .
# The shared-config contains devDependencies which are needed for install
COPY packages/shared-config ./packages/shared-config
RUN yarn install --frozen-lockfile

FROM base AS shared

WORKDIR /opt

# Install all shared modules used by the frontend
# If changing these, remember to edit the copy commands in `production` as well
COPY packages/app-shared ./packages/app-shared
COPY packages/core ./packages/core
COPY packages/data ./packages/data
COPY packages/filters ./packages/filters
COPY packages/matching ./packages/matching
RUN yarn install --frozen-lockfile
RUN yarn workspaces run build

FROM base AS frontend

WORKDIR /opt

# Copy all shared modules used by the frontend
COPY --from=shared /opt/packages/ ./packages
COPY frontend/ ./frontend
RUN yarn workspace @openvaa/frontend install --frozen-lockfile

FROM frontend AS development

WORKDIR /opt

EXPOSE 5173
CMD yarn workspace @openvaa/frontend dev --host

FROM frontend AS build

RUN yarn workspace @openvaa/frontend build

FROM node:18-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt

# Copy all shared modules used by the frontend
COPY --from=build ./opt/packages/app-shared/build ./packages/app-shared/build
COPY --from=build ./opt/packages/app-shared/package.json ./packages/app-shared
COPY --from=build ./opt/packages/core/build ./packages/build
COPY --from=build ./opt/packages/core/package.json ./packages/core
COPY --from=build ./opt/packages/data/build ./packages/build
COPY --from=build ./opt/packages/data/package.json ./packages/core
COPY --from=build ./opt/packages/filters/build ./packages/build
COPY --from=build ./opt/packages/filters/package.json ./packages/core
COPY --from=build ./opt/packages/matching/build ./packages/build
COPY --from=build ./opt/packages/matching/package.json ./packages/core

RUN yarn workspace @openvaa/frontend install --production --frozen-lockfile

EXPOSE 3000
CMD node ./frontend/build/index.js
