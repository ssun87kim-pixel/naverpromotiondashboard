import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gray-900': '#282828',
        'gray-800': '#3C3C3C',
        'gray-700': '#515151',
        'gray-600': '#787878',
        'gray-500': '#969696',
        'gray-400': '#B3B3B3',
        'gray-300': '#C8C8C8',
        'gray-200': '#D9D9D9',
        'gray-100': '#EBEBEB',
        'gray-50':  '#F5F5F5',
        'white':    '#FFFFFF',
        'blue':     '#336DFF',
        'yellow':   '#FFDC1E',
        'red':      '#F72B35',
        'green':    '#00B441',
        'orange':   '#FF5948',
      },
    },
  },
  plugins: [],
}

export default config
