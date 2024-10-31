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

# Install all shared modules used by the frontend
# If adding more, remember to copy them below in both places
COPY vaa-app-shared/ ./vaa-app-shared
RUN yarn workspace vaa-app-shared install --frozen-lockfile
RUN yarn workspace vaa-app-shared build
COPY vaa-core/ ./vaa-core
RUN yarn workspace vaa-core install --frozen-lockfile
RUN yarn workspace vaa-core build
COPY vaa-data/ ./vaa-data
RUN yarn workspace vaa-data install --frozen-lockfile
RUN yarn workspace vaa-data build
COPY vaa-filters/ ./vaa-filters
RUN yarn workspace vaa-filters install --frozen-lockfile
RUN yarn workspace vaa-filters build
COPY vaa-matching/ ./vaa-matching
RUN yarn workspace vaa-matching install --frozen-lockfile
RUN yarn workspace vaa-matching build

FROM base AS frontend

WORKDIR /opt

# Copy all shared modules used by the frontend
COPY --from=shared /opt/vaa-app-shared ./vaa-app-shared
COPY --from=shared /opt/vaa-core ./vaa-core
COPY --from=shared /opt/vaa-data ./vaa-data
COPY --from=shared /opt/vaa-filters ./vaa-filters
COPY --from=shared /opt/vaa-matching ./vaa-matching
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

# Copy all shared modules used by the frontend
COPY --from=build ./opt/vaa-app-shared/build/esm ./vaa-app-shared/build/esm
COPY --from=build ./opt/vaa-app-shared/package.json ./vaa-app-shared
COPY --from=build ./opt/vaa-core ./vaa-core
COPY --from=build ./opt/vaa-core/package.json ./vaa-core
COPY --from=build ./opt/vaa-data ./vaa-data
COPY --from=build ./opt/vaa-data/package.json ./vaa-data
COPY --from=build ./opt/vaa-filters ./vaa-filters
COPY --from=build ./opt/vaa-filters/package.json ./vaa-filters
COPY --from=build ./opt/vaa-matching ./vaa-matching
COPY --from=build ./opt/vaa-matching/package.json ./vaa-matching

COPY --from=build ./opt/frontend/build ./frontend/build
COPY --from=build ./opt/frontend/package.json ./frontend
COPY --from=build ./opt/yarn.lock .
COPY --from=build ./opt/package.json .

RUN yarn workspace vaa-frontend install --production --frozen-lockfile

EXPOSE 3000
CMD node ./frontend/build/index.js
