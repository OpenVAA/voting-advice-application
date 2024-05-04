import settings from './src/lib/config/settings.json';

// Utility for getting a color from the settings with a backup value
function getColor(name, defaultValue, theme = 'light') {
  return settings.colors?.[theme]?.[name] ?? defaultValue;
} 

// Other DaisyUI variables: https://daisyui.com/docs/themes/
// We define them here, so they can be used in both the light and the dark themes
const themeCSSVars = {
  '--rounded-box':     'var(--rounded-md)',  // border radius rounded-box utility class, used in card and other large boxes
  '--rounded-btn':     'var(--rounded-lg)',  // border radius rounded-btn utility class, used in buttons and similar element
  '--rounded-badge':   'var(--rounded-lg)',  // border radius rounded-badge utility class, used in badges and similar
  '--animation-btn':   'var(--duration-sm)', // duration of animation when you click on button
  '--animation-input': 'var(--duration-sm)', // duration of animation for inputs like checkbox, toggle, radio, etc
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

// We'll use this below to generate color classes to safelist
// Make sure to check that this matches the `Color` type in 
// `./src/lib/components/color/color.type.ts`
// as well as the color definitions in the DaisyUI themes futher below.
const colorNames = ['current', 'primary', 'secondary', 'accent', 'neutral', 'base-100', 'base-200', 'base-300', 
  'info', 'success', 'warning', 'error', 'base-content', 'primary-content', 'secondary-content', 'accent-content', 
  'info-content', 'success-content', 'warning-content', 'error-content', 'white'];

// The emoji font-family
const emojiFonts = [
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Noto Color Emoji"',
];

// The fallback fonts for different font styles. Note that the emoji fonts will be appended to all of these.
const fontFallbacks = {
  sans: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
  ],
  serif: [
    'ui-serif', 
    'Georgia', 
    'Cambria',
    '"Times New Roman"', 
    'Times',
    'serif',
  ]
}

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  // We need to safelist these color utility classes so that we can freely use
  // the DaisyUI color classes as variables like `fill-${color}`. See:
  // https://tailwindcss.com/docs/content-configuration#dynamic-class-names and
  // https://tailwindcss.com/docs/content-configuration#safelisting-classes
  safelist: [
    ...colorNames.map(c => `btn-${c}`), 
    ...colorNames.map(c => `bg-${c}`), 
    ...colorNames.map(c => `fill-${c}`), 
    ...colorNames.map(c => `dark:fill-${c}`), 
    ...colorNames.map(c => `text-${c}`)
  ],
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
      lg:   '1.65'
    },
    fontFamily: {
      base: [
        settings.font?.name ?? 'Inter',
        ...(fontFallbacks[settings.font?.style ?? 'sans'] ?? fontFallbacks.sans),
        ...emojiFonts
      ],
      emoji: emojiFonts
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
      // We might want to use the plugin https://github.com/mvllow/tailwindcss-safe-area
      safel: 'env(safe-area-inset-left, 0px)',
      safer: 'env(safe-area-inset-right, 0px)',
      safet: 'env(safe-area-inset-top, 0px)',
      safeb: 'env(safe-area-inset-bottom, 0px)', 
      'safemdl': `calc(env(safe-area-inset-left,   0px) + ${10/16}rem)`,
      'safemdr': `calc(env(safe-area-inset-right,  0px) + ${10/16}rem)`,
      'safemdt': `calc(env(safe-area-inset-top,    0px) + ${10/16}rem)`,
      'safemdb': `calc(env(safe-area-inset-bottom, 0px) + ${10/16}rem)`,
      'safelgl': `calc(env(safe-area-inset-left,   0px) + ${20/16}rem)`,
      'safelgr': `calc(env(safe-area-inset-right,  0px) + ${20/16}rem)`,
      'safelgt': `calc(env(safe-area-inset-top,    0px) + ${20/16}rem)`,
      'safelgb': `calc(env(safe-area-inset-bottom, 0px) + ${20/16}rem)`,
      'safenavt': `calc(env(safe-area-inset-top,   0px) + ${16/16}rem)`, // For the top nav
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
      height: {
        screen: fixedScreenHeight,
      },
      maxHeight: {
        screen: fixedScreenHeight,
      },
      minHeight: {
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
          'primary':   getColor('primary', '#2546a8'), // = success
          'secondary': getColor('secondary', '#666666'),
          'accent':    getColor('accent', '#0a716b'), // = info
          'neutral':   getColor('neutral', '#333333'),
          'base-100':  getColor('base-100', '#ffffff'),
          'base-200':  getColor('base-200', '#e8f5f6'), // 50% tint of base-300 on base-100
          'base-300':  getColor('base-300', '#d1ebee'),
          'info':      getColor('accent', '#0a716b'), // = accent (var() cannot be used in these)
          'success':   getColor('primary', '#2546a8'), // = primary
          'warning':   getColor('warning', '#a82525'), // = error
          'error':     getColor('warning', '#a82525'), // = warning
          'base-content':      getColor('neutral', '#333333'), // = neutral
          'primary-content':   getColor('base-100', '#ffffff'), // = base-100
          'secondary-content': getColor('base-100', '#ffffff'), // = base-100
          'accent-content':    getColor('base-100', '#ffffff'), // = base-100
          'info-content':      getColor('base-100', '#ffffff'), // = base-100
          'success-content':   getColor('base-100', '#ffffff'), // = base-100
          'warning-content':   getColor('base-100', '#ffffff'), // = base-100
          'error-content':     getColor('base-100', '#ffffff'), // = base-100

          // Other DaisyUI variables
          ...themeCSSVars,

          // Custom variables
          '--line-color':           getColor('line-color', '#d9d9d9'),
          '--progress-color':       'oklch(var(--n))',
          '--progress-label-color': 'oklch(var(--n))',
        },
        dark: {
          // DaisyUI colors: https://daisyui.com/docs/colors/
          'primary':   getColor('primary', '#6887e3', 'dark'),  // = success
          'secondary': getColor('secondary', '#8c8c8c', 'dark'),
          'accent':    getColor('accent', '#11a8a0', 'dark'),   // = info
          'neutral':   getColor('neutral', '#cccccc', 'dark'),
          'base-100':  getColor('base-100', '#000000', 'dark'),
          'base-200':  getColor('base-200', '#101212', 'dark'), // 50% tint of base-300 on base-100
          'base-300':  getColor('base-300', '#1f2324', 'dark'),
          'info':      getColor('info', '#11a8a0', 'dark'),     // = accent (var() cannot be used in these)
          'success':   getColor('primary', '#6887e3', 'dark'),  // = primary
          'warning':   getColor('warning', '#e16060', 'dark'),  // = error
          'error':     getColor('warning', '#e16060', 'dark'),  // = warning
          'base-content':      getColor('neutral', '#cccccc', 'dark'), // = neutral
          'primary-content':   getColor('base-100', '#000000', 'dark'),
          'secondary-content': getColor('base-100', '#000000', 'dark'),
          'accent-content':    getColor('base-100', '#000000', 'dark'),
          'info-content':      getColor('base-100', '#000000', 'dark'),
          'success-content':   getColor('base-100', '#000000', 'dark'),
          'warning-content':   getColor('base-100', '#000000', 'dark'),
          'error-content':     getColor('base-100', '#000000', 'dark'),

          // Other DaisyUI variables
          ...themeCSSVars,

          // Custom variables
          '--line-color':           getColor('line-color', '#262626', 'dark'),
          '--progress-color':       'oklch(var(--n))',
          '--progress-label-color': 'oklch(var(--n))',
        }
      }
    ]
  }
};
