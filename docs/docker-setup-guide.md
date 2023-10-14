# Setting up the application for local development using Docker

Using Docker is the simplest way to set up the application for local development, as it combines the frontend and 
backend into a single image that can be built with just a few commands.

## Requirements

- Docker
- Node.js (if running the app outside of Docker; version 16.18.0 is recommended)
- Ports 1337, 5173 and 5432 should be free for the application if using default settings
  -  These ports can be changed in the `.env` file if desired.

## Getting started

To build the development Docker image, go to the project root folder make a copy of the `.env.example` file and rename 
the copy as `.env`. Then run `yarn install` and `yarn dev` or `npm install` and `npm run dev` in the project root folder. 
These commands will create a Docker image that has the frontend, the backend and a database in a single bundle.

**When running the project in Docker, only use the `.env` file in project root. You usually
don't have to touch the separate .env files for frontend and backend.**

If you'd like to have the Strapi backend to be filled with mock data e.g. previewing app functionality or frontend 
development, set the `GENERATE_MOCK_DATA_ON_INITIALISE` variable as true.
- You can optionally set `GENERATE_MOCK_DATA_ON_RESTART` to true. This will generate new mock data on every time the 
Strapi instance is restarted. This feature is only enabled in development builds.
- You can find more detailed info about the mock data in the [backend](../backend/vaa-strapi/README.md)

### Setting up the backend

After the build is successful, go to the backend URL (`http://localhost:1337` by default) in your browser. The 
**page will take a while to load as Strapi is building its codebase**. When it's loaded, go to the Strapi admin panel, 
register there and [create an access token](https://www.youtube.com/watch?v=dVQKqZYWyv4) with read permissions 
(remember to click i18n permissions manually). After creating the access token, copy and paste it to the new `.env` file 
and save it.

### Setting up the frontend

Once the backend is set up, you may need to [stop the containers](#stop-the-containers). Once the containers are stopped
you must run `yarn dev` or `npm run dev` again in the project root and the frontend will now be regenerated with
permissions to make calls to the backend. You can access the frontend at the following URL `http://localhost:5173`.

### Hot reloading

Development Docker images will listen to changes in the files and allow hot reloading, meaning the Docker images don't 
need to be re-generated after making changes to the codebase. Hot reloading is enabled by default in the frontend, but for backend
this can be enabled by adding the volume `- ./:/opt` as a mounted point in [docker-compose.dev.yml](../backend/vaa-strapi/docker-compose.dev.yml)
and re-building the Docker container. However, this can make the development process slow at times, so it is not recommended to keep that on
unless doing direct development on the backend source code.

## Stop The Containers

To stop the containers, you can either go back to the terminal where you ran the `yarn dev` or `npm run dev` command and
press <kbd>command</kbd> + <kbd>c</kbd>. Another option is to open a new terminal and run `yarn dev:down` or 
`npm run dev:down` in the project root folder. This will stop all services associated with a Docker Compose configuration.

# Creating a production build of the application
## Build from Dockerimage
Run `npm run prod` in the project root. This will create a production-ready build of the app in Docker and create containers
for both backend and frontend which are ready to use by themselves. Frontend is accessible from port 80 by default.

## Building the frontend separately
To build the frontend separately for production, run `yarn build` in the `frontend` directory. This will build the frontend into JavaScript
files contained in the `build` directory. You can then copy the contents of the `build` folder into a Node server along with
the `package.json` and `yarn.lock` files and can start the frontend by running `node index.js` in the directory. The frontend
will use port 3000 by default.

Don't forget to run `yarn install --production` before starting the frontend.

## Building the backend separately
To build the backend separately, run `npm run build` and `npm run start` in the `backend/vaa-strapi` directory. 
This will build Strapi and start it in port 1337.
