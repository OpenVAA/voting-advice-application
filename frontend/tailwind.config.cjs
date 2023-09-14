module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
      },
      colors: {
        primary: '#2546A8',
        secondary: '#808080',
        neutral: '#333333',
        link: '#2546A8',
        'default-party': '#BE8E55',
        'link-hover': '#808080',
        error: '#A82525'
      },
      backgroundColor: {
        primary: '#D1EBEE',
        secondary: '#808080',
      },
      textColor: ({ theme }) => theme('colors'),
      fontSize: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.75rem',
        h4: '1.5rem',
        p: '1rem',
        'app-title': '1.5rem',
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/colors/themes')['[data-theme=light]'],
          '--btn-text-case': 'unset',
          primary: '#2546A8',
          secondary: '#505050',
          '--progress-color': 'hsl(var(--n))',
          '--progress-label-color': 'hsl(var(--n))',
        }
      }
    ]
  }
};
