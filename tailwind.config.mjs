/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      fontFamily: {
        // Self-hosted from @fontsource-variable (see BaseLayout): headings and navigation, and running text
        display: ['"Space Grotesk Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // The only accent: warm sunlight, used sparingly (now markers, selection)
        accent: {
          DEFAULT: '#d9b26f',
          light: '#e6c88f',
          dark: '#a8823f',
        },
        // Secondary text greys, just light enough for WCAG AA (4.5:1) on the zinc-950 page
        muted: '#8f8f98',
        faint: '#7c7c85',
      },
    },
  },
  plugins: [],
};
