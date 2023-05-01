# --- Copy source files to Docker ---
FROM node:18-alpine as base
WORKDIR /usr/src/app

# Install packages and cache the results
# so we don't have to install everything when source code changes
COPY package*.json .
RUN yarn install

# Copy files from project root to Docker image
COPY . .

FROM base as development
EXPOSE 5173

CMD yarn dev -- --host

FROM base as build
RUN yarn build

# --- Run built site in nginx ---
FROM nginx as production
WORKDIR /usr/share/nginx/html

COPY --from=build ./usr/src/app/build .
EXPOSE 80