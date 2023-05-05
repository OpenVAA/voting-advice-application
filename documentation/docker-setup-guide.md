# Setting up the application for local development using Docker

Using Docker is the simplest way to set up the application for local development, as it combines the frontend and backend into a single image that can be built with just a few commands.

## Requirements

- Docker
- Node.js (if running the app outside of Docker; version 16.18.0 is recommended)
- Ports 1337, 5173 and 5432 should be free for the application if using default settings

## Getting started

To build the development Docker image, go to the project root folder copy `.env.example` file, rename the copy as `.env` and run `npm run dev` in the project root folder. This will create a Docker image that has the frontend, the backend and a database.

### Setting up the backend

After the build is successful, go to the backend URL (`http://localhost:1337` by default) in your browser. The **page will take a while to load as Strapi is building its codebase**. When it's loaded, go to Strapi admin panel, register there and [create an access token](https://www.youtube.com/watch?v=dVQKqZYWyv4) with read permissions (remember to click i18n permissions manually). After creating the access token, copy and paste it to the new `.env` file and save it.

### Setting up the frontend

Once the backend is set up run `npm run dev` again in the project root and the frontend will now be regenerated with permissions to make calls to the backend. You can access the frontend at the following URL `http://localhost:5173`.

### Hot reloading

Development Docker images will listen to changes in the files and allow hot reloading, meaning the Docker images don't need to be re-generated after making changes to the codebase.

## Stop The Containers

To stop the containers, run `npm run down:dev` in the project root folder. This will stop all services associated with a Docker Compose configuration.
# Creating a production build using Docker

TBD
