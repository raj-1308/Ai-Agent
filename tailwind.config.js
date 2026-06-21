/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#06060a',
        'midnight-soft': '#0d0d14',
        'midnight-ink': '#020205',
        'purple-smoke': '#1e1b34',
        electric: '#3b82f6',
        'electric-soft': '#60a5fa',
        'golden-rose': '#f9a826',
        'emerald-frost': '#34d399',
      },
      boxShadow: {
        'glass-lg': '0 40px 120px rgba(59,130,246,0.18)',
        'glow-soft': '0 24px 80px rgba(59,130,246,0.22)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(139,92,246,0.12), transparent 20%)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
