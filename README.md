# OpenVAA Voting Advice Application

A software framework for creating [Voting Advice Applications](https://en.wikipedia.org/wiki/Voting_advice_application) (VAA), also known as Election Compasses. In short, VAAs are applications that help voters find candidates or parties in elections based on how much they agree about political or value statements. They’re currently most popular in the Nordic countries, the Netherlands and the German-speaking part of Europe.

This repository is a monorepo containing the frontend and backend, as well as other modules. In addition to the voters’ frontend, there is a similar UI for candidates that they can use to input their answers.

The project is coordinated by the Finnish non-profit association [OpenVAA](https://openvaa.org/en) and funded by [Sitra](https://www.sitra.fi/en/) – the Finnish innovation fund.

## 💡 Features

- 🔎 Transparent
- 💸 Free to use
- 🌍 Fully localisable
- 🗳 Use in any election
- 🤲 Accessible
- 🧩 Modular, customisable and extendable
- 🕶️ Privacy-preserving
- 🎓 Informed by research and research-friendly

See full list of [features](/docs/features/).

## 🔨 Use cases

- Collect candidates’ or parties’ answers and publish a VAA for voters
- Use previously collected answers to publish a VAA
- Rapidly prototype new VAA designs or functions
- Collect VAA usage data for research

## 🥅 Project goals

- Offer a fully transparent alternative to closed-source VAAs
- Make it easier to develop new VAA features and designs
- Expand the use of VAAs to elections where they’re not currently used
- Facilitate research on VAAs

## 🚧 Project status: Alpha

> Our latest VAA release is the [2025 Finnish Local Elections Election Compass for Youth](https://nuortenvaalikone.openvaa.org).

> To stay up to speed, please ⭐️ star the repo or [📧 subscribe to our newsletter](https://openvaa.org/newsletter).

The project is currently in an alpha phase with the onus being on refactoring the existing code base for greater robustness and a better developer experience, as well as implementing some missing features.

We released two pilot VAAs for the 2024 EU Elections, which you can try out to see the software in action.

| Video-based VAA                                                                                               |  Traditional VAA                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
|  <img src="images/youthvaa-animation.gif" width="300" alt="The Election Compass for Young People – EE 2024"/> | <a href="https://vaalikone.openvaa.org" target="_blank"><img src="images/ee24-vaa-animation.gif" width="300" alt="EE 2024 Election Compass"/></a> |
|  Finnish, Swedish and English                                                                                 |  Finnish only                                                                                                                                     |
| Features custom video content                                                                                 | Select questions by theme                                                                                                                         |
| User survey and extended analytics                                                                            | No analytics                                                                                                                                      |
|  Data stored in Strapi backend                                                                                | Data stored in local JSON files                                                                                                                   |
|  Postgres server and two Docker containers running on Render                                                  | Single Docker container running on Render                                                                                                         |
| nuortenvaalikone.openvaa.org                                                                                  | vaalikone.openvaa.org                                                                                                                             |

## 🎢 Roadmap

**2026** - Added features for developer-friendliness

- Enable plugins or easier customisation of pages and main components
- Multi-tenant model

## 🪢 Collaborate

In addition to developers and designers willing to contribute to the codebase (see below), we’re also looking for researchers to collaborate with and organisations willing to publish their own VAAs. Reach us at info@openvaa.org if you’re interested.

## 🍭 Contributing

We’re very happy to accept any help in coding, design, testing, translating and so on. If you want to help, drop a line at info@openvaa.org.

See [the contribution guide](/docs/README.md#contributing) for further info about contributing to the project.

---

## Getting Started

See [Developer Guide](/docs/README.md)

## Deploying

See [Deployment guide](/docs/README.md#deployment).

## Troubleshooting

See [Troubleshooting](/docs/README.md#troubleshooting) for solutions to some common issues.
