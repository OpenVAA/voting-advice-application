# What data should be collected from voters’ use of the VAA?

No data are collected from voters by default, but if you wish to collect data about how they use the app, you can enable this.

Data collection is enabled in two places. The analytics provider is part of the server configuration: it sends the data either to the server's own log or to [PostHog](https://posthog.com/), and once a provider is configured the app counts page views without any identifier. Collecting more detailed usage events is a separate app setting.

When detailed events are collected, voters are by default shown a banner asking for permission when they start the VAA, and their detailed events are collected only if they grant it. A deployment can also be configured to collect without asking; whether that is permitted is for you, as the publisher, to determine.

The events go through the application's own address, so the voter's browser loads no third-party analytics script, and nothing is stored on the voter's device for analytics except their consent choice. Some content blockers block this address as well, so the counts are a lower bound; this is not worked around.
