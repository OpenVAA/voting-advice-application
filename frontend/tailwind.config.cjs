module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        secondary: '#D1EBEE',
        'default-party': '#BE8E55'
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
