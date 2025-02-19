# Getting Started with Svelte

This document describes the process for running the frontend separately on your local machine without Docker. You can
find [instructions on running the project with Docker here](../docs/docker-setup-guide.md).

> See also the main [documentation for the frontend](/docs/frontend/).

## Run The Frontend

Frontend module depends on `@openvaa/app-shared` and you need to build it prior to using `@openvaa/frontend` directly (no need if you use it via Docker):

```bash
yarn workspace @openvaa/app-shared install
yarn workspace @openvaa/app-shared build
```

Install frontend dependencies:

```bash
yarn install
```

Then copy `.env.example`, rename it as `.env` and fill required environment variables there.

## Development

After installation & setting up environment variables, start a development server:

```bash
yarn dev

# or start the server and open the app in a new browser tab
yarn dev -- --open

# to make the dev project accessible through the ip, add host flag to the commamd
# it is required for iOS development via Xcode
yarn dev -- --host
```

### Android

#### Dev w/ Hot Reload

1. Install Android Studio for the best dev experience.
2. Open `capacitor.config.js` file and change `server.url` value to your public IP address.
3. Not mandatory, but run the command `npx cap sync android` for a better flow experience.
4. Run the command `npx cap open android` with Android Studio installed to open the app.
5. Click `Run app` button or `^R` in order to run the emulator and see the project.

#### Build

Same as Dev, but run `npx cap sync android` after each build to get the most recent project build version.

### iOS

#### Dev w/ Hot Reload

1. Install Xcode for the best dev experience.
2. Open `capacitor.config.js` file and change `server.url` value to your public IP address.
3. Not mandatory, but run the command `npx cap sync ios` for a better flow experience.
4. Run the command `npx cap open ios` with Xcode installed to open the app.
5. Click `Build` button in order to run the emulator and see the project.

#### Build

Same as Dev, but run `npx cap sync ios` after each build to get the most recent project build version.

## Tooling

### Tailwind and DaisyUI

To facilitate the development of front-end components we have included the Tailwind library in our project.
Additionally, we have included the DaisyUI plugin to speed up the development of the front-end components. You can find
more information about the Tailwind library in the [Tailwind official documentation](https://tailwindcss.com/docs/installation) and the [DaisyUI official documentation](https://daisyui.com/components/).

See the [styling guide](../docs/frontend/styling.md) for using Tailwind and DaisyUI classes.

## Accessibility

This application needs to be WCAG 2.1 AA compliant. Therefore, you must familiarize yourself with web accessibility.
You can start by exploring the [Accessibility Fundamentals Overview page](https://www.w3.org/WAI/fundamentals/) and the
[Mozilla Developer Network accessibility section](https://developer.mozilla.org/en-US/docs/Web/Accessibility). Every time
you develop a new component, be sure to comply with the [Accessibility Guidelines](https://www.w3.org/TR/WCAG21/)

## 📚 Learn more

- [Svelte](https://svelte.dev/) - Svelte is a radical new approach to building user interfaces.
- [SvelteKit](https://kit.svelte.dev/) - SvelteKit is a framework for building web applications of all sizes, with a
  beautiful development experience and flexible, low-level APIs.
