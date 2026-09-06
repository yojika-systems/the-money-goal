/** Design tokens for the editorial direction.
 *
 * Replaces the 3,406-character Stitch config that was inlined byte-identically
 * into four pages and compiled in the browser by the Tailwind Play CDN.
 * Deliberately small: the palette is paper and ink with one green, and a single
 * terracotta reserved for exactly one job — marking an assumption or caveat, so
 * readers learn to recognise it.
 */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBFAF7',
        surface: '#FFFFFF',
        tint: '#F4F1EA',
        tint2: '#FDFCFA',
        ink: '#16130F',
        ink2: '#26221C',
        ink3: '#4A443C',
        muted: '#7C7466',
        faint: '#9A9285',
        rule: '#E4DED2',
        rule2: '#F0EBE1',
        green: '#0B5C3F',
        'green-bright': '#5FBF92',
        // Caveat colour. Only ever used on assumptions, warnings and the
        // "what it ignores" surfaces — never decoratively.
        caveat: '#A8442A',
        'caveat-bg': '#FBF4F1',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { measure: '43rem' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
