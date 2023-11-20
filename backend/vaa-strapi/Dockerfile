FROM node:18-alpine3.18 as base
WORKDIR /opt/

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

WORKDIR /opt/strapi-plugin-import-export-entries/
RUN yarn install
RUN yarn build

WORKDIR /opt/

FROM base as development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337
RUN npm run build -- --ignore-prompts
CMD npm run dev -- --ignore-prompts

FROM base as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337

RUN npm run build -- --ignore-prompts
CMD npm run start
