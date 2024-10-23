# Setting up the application for local development using Docker

Using Docker is the simplest way to set up the application for local development, as it combines the frontend and 
backend into a single image that can be built with just a few commands.

## Requirements

- Docker
- Node.js (if running the app outside of Docker; version 18.20.4 is recommended)
- Ports 1337, 5173 and 5432 should be free for the application if using default settings
  -  These ports can be changed in the `.env` file if desired.

## Getting started

Backend module contains `strapi-plugin-import-export-entries` directory which is a separate git repository. In order to initialise it you need to run:

```bash
git submodule update --init --recursive
```

Then install dependencies for all workspaces:

```bash
yarn install
```

To build and run development Docker images for the entire stack (frontend, backend and DB), in the project's root directory:

- Make a copy of the `.env.example` file and rename the copy as `.env`
- Run `yarn dev`

To bring down the Docker stack properly (delete all containers, images and named volumes which include backend DB volume with potentially seeded mock data) run:

```bash
yarn dev:down
```

**When running the project in Docker, only use the `.env` file in project root. You usually
don't have to touch the separate .env files for frontend and backend.**

If you want to seed backend DB with mock data (e.g. for demostration, development or testing purposes purposes), please follow the instructions [here](../backend/vaa-strapi/README.md#mock-data).

### Setting up the backend

After the build is successful, go to the backend URL (`http://localhost:1337` by default) in your browser. The 
**page will take a while to load as Strapi is building its codebase**. When it's loaded, go to the Strapi admin panel and register an admin account there for yourself. However, if you're running the development setup and have mock data generation enabled, a default Admin user is created with the email `admin@example.com` and password `admin`.

After setting up the backend, you can access the frontend at the following URL `http://localhost:5173`.

### Hot reloading

Development Docker images will listen to changes in the files and allow hot reloading, meaning the Docker images don't 
need to be re-generated after making changes to the codebase. Hot reloading is enabled by default in the frontend, but for backend
this can be enabled by adding the volume `- ./:/opt` as a mounted point in [docker-compose.dev.yml](../backend/vaa-strapi/docker-compose.dev.yml)
and re-building the Docker container. However, this can make the development process slow at times, so it is not recommended to keep that on
unless doing direct development on the backend source code.

Note that changes in `vaa-shared` module are not going to be picked up by frontend's or backend's hot reloading capabilities and their Docker images need to be rebuilt in order for the changes to take effect.

## Stop The Containers

To stop the containers, you can either go back to the terminal where you ran the `yarn dev` command and
press <kbd>command</kbd> + <kbd>c</kbd>. Another option is to open a new terminal and run `yarn dev:down` in the project root folder. This will stop all services associated with a Docker Compose configuration.

# Creating a production build of the application
## Build from Dockerimage
Run `yarn prod` in the project root. This will create a production-ready build of the app in Docker and create containers
for both backend and frontend which are ready to use by themselves. Frontend is accessible from port 80 by default.

## Building the frontend separately
To build the frontend separately for production, run `yarn build` in the `frontend` directory. This will build the frontend into JavaScript
files contained in the `build` directory. You can then copy the contents of the `build` folder into a Node server along with
the `package.json` and `yarn.lock` files and can start the frontend by running `node index.js` in the directory. The frontend
will use port 3000 by default.

Don't forget to run `yarn install --production` before starting the frontend.

## Building the backend separately
To build the backend separately, run `yarn build` and `yarn start` in the `backend/vaa-strapi` directory. 
This will build Strapi and start it in port 1337.
