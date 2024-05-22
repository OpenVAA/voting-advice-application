# OpenVAA Voting Advice Application

An open-source software library for creating voting advice applications. This repository is a monorepo containing the frontend and backend.

The project is coordinated by the Finnish non-profit association [OpenVAA](https://openvaa.org/en) and funded by [Sitra](https://www.sitra.fi/en/) – the Finnish innovation fund.

## 🚧 Project status: Alpha

The project is currently in an alpha phase, with a lot of new features added to prepare for the 2024 EU Elections, in which the first publicly available VAAs built with OpenVAA are released. You can try out the first of these at [nuortenvaalikone.openvaa.org](nuortenvaalikone.openvaa.org) (available in Finnish, Swedish and English).

After the EU Elections are over (9th June, 2024), we will concentrate on reworking the existing repository into a more developer-friendly and robust format, as well as add some crucial missing features, which were postponed as unnecessary for the first releases.

## 🎢 Roadmap

- **2024, May** — First VAAs released to the public
- **2024, summer** – Reorganise the current repo, especially:
  - Define a `dataProvider` api between the frontend and the backend so that they can be interchanged
  - Implement a common `vaa-data` data model for election data, including candidates, parties, constituencies and so on
  - Separate the `vaa-matching` and `vaa-filters` pseudo-modules into independent modules
  - Implement the most crucial missing features, such as constituency selection and support for multiple simultaneous elections
  - Create a project site with documentation, which is currently spread between the [`/docs`](./docs/) folder and in-code `JSDoc` comments
  - Refactor the code and apply uniform coding conventions
  - Write missing unit and end-to-end tests
- **2024, autumn** — Release the first full VAA to the public, which includes the interface for the candidates to input their answers
  - Build application manager UI
  - Enable plugins or easier customisation of pages and main components
- **2025, spring** — Release VAAs in the Finnish county elections
- **2025, summer** — First production release

## 🍭 Contributing

We're very happy to accept any help in coding, design, testing, translating and so on. If you want to help, drop a line at info@openvaa.org.

See [the contribution guide](docs/contributing/CONTRIBUTING.md) for further info about contributing to the project.

## Getting started
You can run the whole application in a single Docker image, or run the frontend or backend separately depending on your preferences. Using the Docker image is recommended and the quickest way to set up the application.

- See [the Docker setup guide](docs/docker-setup-guide.md) for running the whole application.
- See [the frontend Readme](frontend/README.md) for instructions on running the frontend individually.
- See [the backend Readme](/backend/vaa-strapi/README.md) for instructions on running the backend individually.

## Maintaining dependencies
The project uses [Dependabot](https://github.com/dependabot) to maintain security updates for its dependencies. Dependabot will create automated pull requests monthly to fix potential known security issues in application dependencies.

## Troubleshooting
See [Troubleshooting](docs/troubleshooting.md) for solutions to some common issues.
