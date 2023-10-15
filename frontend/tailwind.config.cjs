// Other DaisyUI variables: https://daisyui.com/docs/themes/
// We define them here, so they can be used in both the light and the dark themes
const themeCSSVars = {
  '--rounded-box':     'var(--rounded-md)',  // border radius rounded-box utility class, used in card and other large boxes
  '--rounded-btn':     'var(--rounded-lg)',  // border radius rounded-btn utility class, used in buttons and similar element
  '--rounded-badge':   'var(--rounded-lg)',  // border radius rounded-badge utility class, used in badges and similar
  '--animation-btn':   'var(--duration-sm)', // duration of animation when you click on button
  '--animation-input': 'var(--duration-sm)', // duration of animation for inputs like checkbox, toggle, radio, etc
  '--btn-text-case':   'none',               // set default text transform for buttons
  '--btn-focus-scale': '0.95',               // scale transform of button when you focus on it
  '--border-btn':      '0px',                // border width of buttons
  '--tab-border':      '0px',                // border width of tabs
  '--tab-radius':      'var(--rounded-sm)',  // border radius of tabs
};

// We apply this fix to (min/max) height to cater for iOS Safari's address bar.
// This can be removed when Tailwind changes it's default behaviour to match this.
const fixedScreenHeight = ['100vh', '-webkit-fill-available', '100dvh'];

// This defines the minimum touch target size
const touchTargetSize = `${44/16}rem`;

// This defines the default header height which is needed in calculations (icon h + 2 * padding)
const headerHeight = `${(24 + 2 * 16)/16}rem`;

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    borderRadius: {
      none:    '0px',
      sm:      `${2/16}rem`, // Tab
      DEFAULT: `${2/16}rem`,
      md:      `${4/16}rem`, // Card
      lg:      `${8/16}rem`, // Button, input, speech bubble
      full:    '9999px',
    },
    borderWidth: {
      0:  '0px',
      md: '1px',
      DEFAULT: '1px',
      lg: '2px',
      xl: '4px',
    },
    lineHeight: {
      none: '1',
      sm:   '1.21',
      md:   '1.35',
      lg:   '1.5'
    },
    fontSize: ({ theme }) => ({
      xs:    [`${11.5/16}rem`, { lineHeight: theme('lineHeight.sm') }], // label in all caps
      sm:    [`${12/16}rem`, { lineHeight: theme('lineHeight.sm') }],   // margins, badges, non-important info
      md:    [`${15/16}rem`, { lineHeight: theme('lineHeight.md') }],   // base, body text
      base:  [`${15/16}rem`, { lineHeight: theme('lineHeight.md') }],   // base, body text
      lg:    [`${17/16}rem`, { lineHeight: theme('lineHeight.sm') }],   // h3: card title
      xl:    [`${20/16}rem`, { lineHeight: theme('lineHeight.sm') }],   // h2: section title
      '2xl': [`${23/16}rem`, { lineHeight: theme('lineHeight.sm') }],   // h1: page title
      '3xl': [`${28/16}rem`, { lineHeight: theme('lineHeight.sm') }],   // h1.appTitle
    }),
    fontWeight: {
      normal: '400',
      bold:   '700',
    },
    spacing: {
      px:  '1px',
      0:   '0px',
      // 1: `${1/16}rem`,
      2:   `${2/16}rem`,
      4:   `${4/16}rem`,    
      xs:  `${4/16}rem`,   // Gap bw icon and label
      6:   `${6/16}rem`,
      8:   `${8/16}rem`,     
      sm:  `${8/16}rem`,   // Gap bw cards
      10:  `${10/16}rem`,  
      md:  `${10/16}rem`,  // Gap default
      12:  `${12/16}rem`,
      14:  `${14/16}rem`,
      16:  `${16/16}rem`,
      18:  `${18/16}rem`,
      20:  `${20/16}rem`,
      lg:  `${20/16}rem`,  // Page margin
      24:  `${24/16}rem`,
      32:  `${32/16}rem`,  // Likert buttons
      40:  `${40/16}rem`,
      xl:  `${40/16}rem`,  // Main big gap
      44:  `${44/16}rem`,
      48:  `${48/16}rem`,
      60:  `${60/16}rem`,
      xxl: `${60/16}rem`,  // Portrait height
      100: `${100/16}rem`,
      // Minimum touch target size
      touch: touchTargetSize,
      // Default height for the header
      header: headerHeight,
      // We might want to use the plugin https://github.com/mvllow/tailwindcss-safe-area
      safel: 'env(safe-area-inset-left, 0px)',
      safer: 'env(safe-area-inset-right, 0px)',
      safet: 'env(safe-area-inset-top, 0px)',
      safeb: 'env(safe-area-inset-bottom, 0px)',
      safelgl: `calc(env(safe-area-inset-left, 0px) + ${20/16}rem)`,
      safelgr: `calc(env(safe-area-inset-right, 0px) + ${20/16}rem)`,
      safelgt: `calc(env(safe-area-inset-top, 0px) + ${20/16}rem)`,
      safelgb: `calc(env(safe-area-inset-bottom, 0px) + ${20/16}rem)`,
      safenavt: `calc(env(safe-area-inset-top, 0px) + ${16/16}rem)`, // For the top nav
    },
    transitionDuration: {
      none:    '0s',
      sm:      '225ms',
      DEFAULT: '225ms',
      md:      '350ms',
      lg:      '500ms',
      full:    '675ms',
    },
    extend: {
      fontFamily: {
        sans: [
            'Inter',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            '"Noto Sans"',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
            '"Noto Color Emoji"',
          ],
          emoji: [
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
            '"Noto Color Emoji"',
          ],
      },
      height: {
        screen: fixedScreenHeight,
      },
      maxHeight: {
        header: headerHeight,
        screen: fixedScreenHeight,
      },
      minHeight: {
        header: headerHeight,
        screen: fixedScreenHeight,
        touch: touchTargetSize,
      },
      minWidth: {
        touch: touchTargetSize,
      },
      screens: {
        xs: '320px',
        // The 36rem should match the value for max-w-xl. We have to use
        // a raw media query because an error will otherwise be generated
        // when using units other than pixels.
        'match-w-xl': { 'raw': 'screen and (min-width: 36rem)' }
      },
    }
  },
  // We may want to use this later for formatting info pages etc: require('@tailwindcss/typography')
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          // DaisyUI colors: https://daisyui.com/docs/colors/
          'primary':   '#2546a8', // = success
          'secondary': '#666666',
          'accent':    '#0d827c', // = info
          'neutral':   '#333333',
          'base-100':  '#ffffff',
          'base-200':  '#e5e5e5',
          'base-300':  '#d1ebee', // Remember to match this with the theme-color in app.html
          'info':      '#0d827c', // = accent (var() cannot be used in these)
          'success':   '#2546a8', // = primary
          'warning':   '#a82525', // = error
          'error':     '#a82525', // = warning
          'base-content':      '#333333', // = neutral
          'primary-content':   '#ffffff', // = base-100
          'secondary-content': '#ffffff', // = base-100
          'accent-content':    '#ffffff', // = base-100
          'info-content':      '#ffffff', // = base-100
          'success-content':   '#ffffff', // = base-100
          'warning-content':   '#ffffff', // = base-100
          'error-content':     '#ffffff', // = base-100

          // Other DaisyUI variables
          ...themeCSSVars,

          // Custom variables
          '--line-color':           '#d9d9d9',
          '--progress-color':       'hsl(var(--n))',
          '--progress-label-color': 'hsl(var(--n))',
        },
        dark: {
          // DaisyUI colors: https://daisyui.com/docs/colors/
          'primary':   '#6887e3', // = success
          'secondary': '#8c8c8c',
          'accent':    '#11a8a0', // = info
          'neutral':   '#cccccc',
          'base-100':  '#000000',
          'base-200':  '#1a1a1a',
          'base-300':  '#1f2324', // Remember to match this with the theme-color in app.html
          'info':      '#11a8a0', // = accent (var() cannot be used in these)
          'success':   '#6887e3', // = primary
          'warning':   '#d72f2f', // = error
          'error':     '#d72f2f', // = warning
          'base-content':      '#cccccc', // = neutral
          'primary-content':   '#000000',
          'secondary-content': '#000000',
          'accent-content':    '#000000',
          'info-content':      '#000000', // = accent-content
          'success-content':   '#000000', // = primary-content
          'warning-content':   '#ffffff',
          'error-content':     '#ffffff', // = warning-content

          // Other DaisyUI variables
          ...themeCSSVars,

          // Custom variables
          '--line-color':           '#262626',
          '--progress-color':       'hsl(var(--n))',
          '--progress-label-color': 'hsl(var(--n))',
        }
      }
    ]
  }
};
