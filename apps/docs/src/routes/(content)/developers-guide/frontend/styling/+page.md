# Styling

The frontend uses [Tailwind CSS](https://tailwindcss.com/docs) with the [DaisyUI plugin](https://daisyui.com/components/). There is no Tailwind configuration file: both are configured in CSS, in [`apps/frontend/src/app.css`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/app.css), which `@import`s Tailwind, loads DaisyUI with `@plugin 'daisyui'`, imports the theme, defines the `@theme` scales and sets the global styles. Tailwind runs as a Vite plugin.

The theme — the two DaisyUI colour themes and the font — is not written in `app.css` but generated from the `colors` and `font` of [`StaticSettings`](/developers-guide/configuration/static-settings). A small Vite plugin, [`apps/frontend/vite.theme.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/vite.theme.ts), writes `apps/frontend/src/theme.generated.css` whenever Vite starts, for both `yarn dev` and the production build, and `app.css` imports it. The file is git-ignored; never edit it. To change the palette or the font, edit `packages/app-shared/src/settings/staticSettings.ts` and restart the dev server.

### Tailwind classes

The `@theme` block in `app.css` clears Tailwind's default spacing, text size, radius and transition scales (the generated theme clears the font scale) and replaces them with a restricted set. This keeps the design consistent, and autocomplete shows the allowed values. Spacing has named values, such as `gap-md` or `p-lg`, for the most common sizes, and numeric values, such as `w-40`, for the rest. Text sizes are named, such as `text-md`.

You can still use [arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values) with the bracket notation, for example `w-[21.35px]`. Never build a class name in code, such as `'w-' + size`, unless the whole class string appears in the source: Tailwind only generates the classes it finds in the source files. The colour classes that components build from a colour name are listed in the `@source inline(…)` safelist in `app.css`.

A component's `<style>` block that needs Tailwind's theme uses `@reference` to `src/tailwind-theme.css`, which references `app.css`.

#### Passing classes to components

The components pass any attributes they receive on to their main element. This is most often used to add classes. The component combines them with its own classes with `concatClass`, and where the two conflict, the class you pass wins. See [Components](/developers-guide/frontend/components). Because of Svelte's style scoping, **pass only Tailwind or global classes, never classes defined in a component's `<style>` block**.

### Colors

The generated theme defines two DaisyUI themes with `@plugin 'daisyui/theme'`: `light`, the default, and `dark`, used when the browser prefers a dark colour scheme. Each defines all the basic DaisyUI [colours](https://daisyui.com/docs/colors/) and their `-content` pairs. `StaticSettings.colors` sets only the colours the app tells apart, and the rest are derived from them: `info` is `accent`, `success` is `primary`, `error` is `warning`, `base-content` is `neutral`, and every other `-content` colour is `base-100`. Its `line-color` becomes the `--line-color` variable of the theme. The colours work in Tailwind utility classes (`text-primary`, `bg-base-300`) and in DaisyUI component classes (`btn-primary`). The most common light-theme colours are:

|                                                                                                                      | Name              | Use                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| <div style="background: #333333; width: 1.5rem; height: 1.5rem;"/>                                                   | `neutral`         | Default colour for text                                                |
| <div style="background: #2546a8; width: 1.5rem; height: 1.5rem;"/>                                                   | `primary`         | For actions and links                                                  |
| <div style="background: #666666; width: 1.5rem; height: 1.5rem;"/>                                                   | `secondary`       | For secondary text and disabled buttons                                |
| <div style="background: #a82525; width: 1.5rem; height: 1.5rem;"/>                                                   | `warning`         | For warnings and actions demanding caution                             |
| <div style="background: #a82525; width: 1.5rem; height: 1.5rem;"/>                                                   | `error`           | For errors                                                             |
| <div style="background: #ffffff; outline: 1px solid #666666; outline-offset: -1px; width: 1.5rem; height: 1.5rem;"/> | `base-100`        | Default background                                                     |
| <div style="background: #e8f5f6; width: 1.5rem; height: 1.5rem;"/>                                                   | `base-200`        | Slightly less prominent shaded background                              |
| <div style="background: #d1ebee; width: 1.5rem; height: 1.5rem;"/>                                                   | `base-300`        | Default prominent background                                           |
| <div style="background: #ffffff; outline: 1px solid #2546a8; outline-offset: -1px; width: 1.5rem; height: 1.5rem;"/> | `primary-content` | Text on `bg-primary`. Each colour has its associated `content` colour. |

The frontend also reads `StaticSettings.colors` directly, for the `theme-color` meta tags and as the background when it checks the contrast of the colours of elections, entities and question categories, so the page, the meta tags and the contrast checks all follow the one setting. See [Static settings](/developers-guide/configuration/static-settings).

#### Color contrast

To meet the app's accessibility requirements, text must reach the [WCAG AA colour contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html). The colours are defined so that this holds as long as:

- On any of the base backgrounds, for example `bg-base-100`, `bg-base-200` or `bg-base-300`, you use any of the basic text colours.
- On any other background, such as `bg-primary`, you use the matching `content` colour for text, for example `text-primary-content`.

#### Testing the colors

To test all of the app's colours, copy the contents of [`color-test.txt`](/developers-guide/frontend/styling/color-test.txt) into a `+page.svelte` file, open the page and check the colours with the WAVE browser extension. Do this in both the light and the dark mode.

The file is not included in the app as a Svelte file, because Tailwind would then compile all of its colour classes into the app.

### Z-index

For basic content, avoid `z-index` and layer elements by their order instead.

Elements that need a `z-index` use these Tailwind classes:

- `z-10`: the navigation drawer, the drawer close buttons, the `<Select>` menu and the `<Term>` tooltip
- `z-20`: the buttons the [`<Video>`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/video/Video.svelte) component lays over the header
- `z-30`: the [`<Alert>`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/alert/Alert.svelte) component
- `z-40` and `z-50`: not used

The dialog of the [`<Modal>`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/Modal.svelte) component is placed in the browser's top layer, in front of all other content whatever its `z-index`.

### Default styling

The `@layer base` block in `app.css` sets the styling defaults for the whole app.
