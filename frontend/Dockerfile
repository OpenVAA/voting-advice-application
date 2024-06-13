# --- Copy source files to Docker ---
FROM node:18-alpine as base
WORKDIR /usr/src/app

# Install packages and cache the results
# so we don't have to install everything when source code changes
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn

# Copy files from project root to Docker image
COPY frontend .
COPY shared /usr/src/app/src/shared

FROM base as development
EXPOSE 5173

CMD yarn dev --host

FROM base as build
RUN yarn build

FROM node:18-alpine as production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app

COPY --from=build ./usr/src/app/package.json .
COPY --from=build ./usr/src/app/yarn.lock .
COPY --from=build ./usr/src/app/build .

RUN yarn install --production

EXPOSE 3000
CMD node index.js
