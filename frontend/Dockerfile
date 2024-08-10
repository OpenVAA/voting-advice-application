# --- Copy source files to Docker ---
FROM node:18-alpine AS base
WORKDIR /opt

# Install packages and cache the results
# so we don't have to install everything when source code changes
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile

FROM base AS shared

WORKDIR /opt

COPY shared/ ./shared
RUN yarn workspace vaa-shared install --frozen-lockfile
RUN yarn workspace vaa-shared build

FROM base AS frontend

WORKDIR /opt

COPY --from=shared /opt/shared ./shared
COPY frontend/ ./frontend
RUN yarn workspace vaa-frontend install --frozen-lockfile

FROM frontend AS development

WORKDIR /opt

EXPOSE 5173
CMD yarn workspace vaa-frontend dev --host

FROM frontend AS build

RUN yarn workspace vaa-frontend build

FROM node:18-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt

COPY --from=build ./opt/shared/build/esm ./shared/build/esm
COPY --from=build ./opt/shared/package.json ./shared
COPY --from=build ./opt/frontend/build ./frontend/build
COPY --from=build ./opt/frontend/package.json ./frontend
COPY --from=build ./opt/yarn.lock .
COPY --from=build ./opt/package.json .

RUN yarn workspace vaa-frontend install --production --frozen-lockfile

EXPOSE 3000
CMD node ./frontend/build/index.js
