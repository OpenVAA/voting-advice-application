# What should the VAA look and feel like?

You can customize the look and the text content of the VAA to your liking.

On the visual side this includes:

- main logo
- front page banner image
- emojis or other illustrations for any page, statement or category
- colours, such as those of text, background, links and buttons
- the font used in the application

In addition any text shown in the application can be changed.

The main logo can be uploaded in the Admin App as the publisher logo. On a deployment that has its own repository, the logo, the colours and the font can also be supplied by the developers as files and settings under the `instance/` directory: the logo file under `instance/static/`, and the logo's address, the colours and the font in `instance/staticSettings.json`. A logo uploaded in the Admin App takes precedence over the one in `instance/`. The developers' details are in [Static settings](/developers-guide/configuration/static-settings#instance-overlay).

Furthermore, the application’s source code can be modified to make any edits not listed above.
