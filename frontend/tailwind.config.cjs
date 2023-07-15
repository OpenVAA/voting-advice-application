module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#D1EBEE',
        secondary: '#D1EBEE',
        neutral: '#FFFFFF',
        link: '#2546A8',
        'default-party': '#BE8E55',
        'link-hover': '#808080'
      },
      textColor: {
        primary: '#2546A8',
        secondary: '#505050'
      },
      fontSize: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.75rem',
        h4: '1.5rem'
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
          secondary: '#505050'
        },
      },
    ]
  }
};
