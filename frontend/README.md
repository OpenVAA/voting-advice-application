# Getting Started with Svelte

This document describes the process for running this application on your local computer.

## Run The Application Locally

Once you've cloned the project, install dependencies with `npm install` (or `pnpm install` or `yarn`). Then copy `.env.example`, rename it as `.env` and fill required environment variables there.

After installation & setting up environment variables, start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open

# to make the dev project accessible through the ip, add host flag to the commamd
# it is required for iOS development via Xcode
npm run dev -- --host
```

## Android

### Dev w/ Hot Reload

1. Install Android Studio for the best dev experience.
2. Open `capacitor.config.js` file and change `server.url` value to your public IP address.
3. Not mandatory, but run the command `npx cap sync android` for the better flow experience.
4. Run the command `npx cap open android` with Android Studio installed to open the app.
5. Click `Run app` button or `^R` in order to run emulator and see the project.

### Build

Same as Dev, but run `npx cap sync android` after each build to get the most recent project build version.

## iOS

### Dev w/ Hot Reload

1. Install Xcode for the best dev experience.
2. Open `capacitor.config.js` file and change `server.url` value to your public IP address.
3. Not mandatory, but run the command `npx cap sync ios` for the better flow experience.
4. Run the command `npx cap open ios` with Xcode installed to open the app.
5. Click `Build` button in order to run emulator and see the project.

### Build

Same as Dev, but run `npx cap sync ios` after each build to get the most recent project build version.

## 📚 Learn more

- [Svelte](https://svelte.dev/) - Svelte is a radical new approach to building user interfaces.
- [SvelteKit](https://kit.svelte.dev/) - SvelteKit is a framework for building web applications of all sizes, with a beautiful development experience and flexible, low-level APIs.
