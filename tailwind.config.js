/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        invert: {
          css: {
            '--tw-prose-body': 'rgb(244 244 245)',
            '--tw-prose-headings': 'rgb(250 250 250)',
            '--tw-prose-lead': 'rgb(212 212 216)',
            '--tw-prose-links': 'rgb(147 197 253)',
            '--tw-prose-bold': 'rgb(250 250 250)',
            '--tw-prose-counters': 'rgb(212 212 216)',
            '--tw-prose-bullets': 'rgb(161 161 170)',
            '--tw-prose-hr': 'rgb(63 63 70)',
            '--tw-prose-quotes': 'rgb(244 244 245)',
            '--tw-prose-quote-borders': 'rgb(63 63 70)',
            '--tw-prose-captions': 'rgb(212 212 216)',
            '--tw-prose-code': 'rgb(244 244 245)',
            '--tw-prose-pre-code': 'rgb(244 244 245)',
            '--tw-prose-pre-bg': 'rgb(24 24 27)',
            '--tw-prose-th-borders': 'rgb(63 63 70)',
            '--tw-prose-td-borders': 'rgb(63 63 70)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

