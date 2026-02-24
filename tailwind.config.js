/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dj: {
          bg: '#0d0d0f',
          surface: '#16161a',
          border: '#2a2a32',
          accent: '#00e5ff',
          accent2: '#ff3d6b',
          text: '#e8e8f0',
          muted: '#666680',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'monospace'],
        mono: ['var(--font-mono)', 'monospace'],
      }
    },
  },
  plugins: [],
}
