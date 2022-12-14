FROM node:18-alpine
WORKDIR /usr/src/app

# Install packages and cache the results
# so we don't have to install everything when source code changes
COPY package*.json .
RUN npm install

# Copy files from project root to Docker image
COPY . .

EXPOSE 5173