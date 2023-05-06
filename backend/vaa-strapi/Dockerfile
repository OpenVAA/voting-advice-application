FROM node:16-alpine as base
WORKDIR /opt/

COPY package*.json ./
RUN npm install

COPY . .

FROM base as development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337
RUN npm run build
CMD npm run dev

FROM base as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

EXPOSE 1337

RUN npm run build
CMD npm run start
