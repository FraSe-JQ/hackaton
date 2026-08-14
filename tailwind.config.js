export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#00517A',
        muted: '#557783',
        line: '#D3E1E4',
        surface: '#ffffff',
        soft: '#DDE8EA',
        canvas: '#DDE8EA',
        green: { DEFAULT: '#8DC63F', dark: '#00517A' },
        blue: '#51C6D9',
        amber: '#8DC63F',
        red: '#a83c3c',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.35' }],
        sm: ['13px', { lineHeight: '1.4' }],
        base: ['15px', { lineHeight: '1.45' }],
        lg: ['18px', { lineHeight: '1.25' }],
        xl: ['22px', { lineHeight: '1.15' }],
        '2xl': ['32px', { lineHeight: '1.05' }],
      },
      spacing: {
        xs: '6px',
        sm: '10px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      borderRadius: {
        control: '8px',
        card: '12px',
      },
      keyframes: {
        // La sugerencia nueva entra desde abajo, como una cola que empuja hacia arriba.
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 260ms ease-out',
      },
    },
  },
  plugins: [],
}
