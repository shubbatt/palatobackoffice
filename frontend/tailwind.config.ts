import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0F1117',
        surface: '#161B27',
        card:    '#1E2535',
        border:  '#2A3347',
        muted:   '#8896B0',
        text:    '#E8EDF5',
        accent:  '#F5A623',
        // Status dim backgrounds — used as bg-green-dim, bg-amber-dim, bg-red-dim
        'green-dim': '#0D2818',
        'amber-dim': '#261A00',
        'red-dim':   '#2A0A0A',
        palato: {
          green: '#22C55E',
          amber: '#F59E0B',
          red:   '#EF4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
