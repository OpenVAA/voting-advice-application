# Getting Started with Svelte

This document describes the process for running the frontend separately on your local machine without Docker. You can
find [instructions on running the project with Docker here](../docs/docker-setup-guide.md).

## Run The Frontend

Once you've cloned the project, install dependencies with `yarn install`. Then copy `.env.example`, rename it as `.env`
and fill required environment variables there.

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
more information about the Tailwind library in the [Tailwind official documentation](https://tailwindcss.com/docs/installation)
and the [DaisyUI official documentation](https://daisyui.com/components/).

## Accessibility

This application needs to be WCAG 2.1 AA compliant. Therefore, you must familiarize yourself with web accessibility.
You can start by exploring the [Accessibility Fundamentals Overview page](https://www.w3.org/WAI/fundamentals/) and the
[Mozilla Developer Network accessibility section](https://developer.mozilla.org/en-US/docs/Web/Accessibility). Every time
you develop a new component, be sure to comply with the [Accessibility Guidelines](https://www.w3.org/TR/WCAG21/)

## 📚 Learn more

- [Svelte](https://svelte.dev/) - Svelte is a radical new approach to building user interfaces.
- [SvelteKit](https://kit.svelte.dev/) - SvelteKit is a framework for building web applications of all sizes, with a
  beautiful development experience and flexible, low-level APIs.

## Styling

### Page templates

In order to have a consistent layout throughout the app a set of page templates are defined with Svelte component. These expose slots for content and component properties for other attributes. All of the templates are based on the shared `Page` component. The templates currently used are listed below. See the components' source code for documentation.

| Component        | Use                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `BasicPage`      | The default template for pages                                                                                                     |
| `FrontPage`      | A template for application front pages, which has a transparent header and now primary actions located at the bottom of the screen |
| `SingleCardPage` | A template for pages consisting of a single card, such as a single candidate page                                                  |

### Interactive elements

Use the DaisyUI [`btn` class](https://daisyui.com/components/button/) and it's subclasses for all interactive elements. It has a defined minimum touch target for that. See also the Svelte components based on that: `NextButton`, `IconButton`.

### Tailwind classes

We use only a limited set of some of the [Tailwind utility classes](https://tailwindcss.com/docs/) for, e.g., spacing and font sizes, as well as the colours DaisyUI uses. For a list of the classes in use, see `tailwind.config.cjs` or use autocomplete.

The reason for limiting Tailwind classes is that this way adherence to the design system is easier, because Tailwind gives nice autocomplete for the available options. For most classes names, such as `md` and `lg` are used. For spacing numeric values are also available, such as `w-40`, with the named ones, such as `gap-md`, reserved the most commonly used values.

Note that you can still use [arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values) with any Tailwind utility class with the bracket notation, e.g. `w-[21.35px]`. Bear in mind, however, that you should not construct these (or any other Tailwind classes) in code, unless the whole final string for the class is spelled out in code, such as `class = 'w-' + size === 'lg' ? 'lg' : 'md'`, because Tailwind only compiles classes it can spot in the source code using a naïve search.

For DaisyUI, all the [basic colours](https://daisyui.com/docs/colors/) are defined for both the default and the dark theme, which is used in dark mode. The colours are applicable to Tailwind utility classes (e.g. `text-primary`, `bg-base-300`) and DaisyUI component classes (e.g. `btn-primary`). You can see all the colours in `tailwind.config.cjs` but the most common ones are listed below.

|                                                                                                                       | Name            | Use                                                                   |
| --------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------- |
| <div style="background: #333333; width: 1.5rem; height: 1.5rem;"/>                                                    | `neutral`       | Default colour for text                                               |
| <div style="background: #2546a8; width: 1.5rem; height: 1.5rem;"/>                                                    | `primary`       | For actions and links                                                 |
|  <div style="background: #666666; width: 1.5rem; height: 1.5rem;"/>                                                   | `secondary`     | For secondary text and disabled buttons                               |
|  <div style="background: #a82525; width: 1.5rem; height: 1.5rem;"/>                                                   | `warning`       | For warnings and actions demanding caution                            |
|  <div style="background: #a82525; width: 1.5rem; height: 1.5rem;"/>                                                   | `error`         | For errors                                                            |
|  <div style="background: #ffffff; outline: 1px solid #666666; outline-offset: -1px; width: 1.5rem; height: 1.5rem;"/> | `base-100`      | Default background                                                    |
|  <div style="background: #a82525; width: 1.5rem; height: 1.5rem;"/>                                                   | `base-200`      | Slightly less prominent shaded background                             |
|  <div style="background: #d1ebee; width: 1.5rem; height: 1.5rem;"/>                                                   | `base-300`      | Default prominent background                                          |
|  <div style="background: #ffffff; outline: 1px solid #2546a8; outline-offset: -1px; width: 1.5rem; height: 1.5rem;"/> | primary-content | Text on `bg-primary`. Each colour has its associated `content` colour |

### Default styling

See `app.css` for some styling defaults that are set throughout the app.

### OSX: Test locally on an iPhone simulator

Run `/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/Contents/MacOS/Simulator -CurrentDeviceID 8528838E-4B47-4F0E-B415-E87F8C8A6163`
