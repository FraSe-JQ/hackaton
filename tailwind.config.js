export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad y navegación.
        brand: { DEFAULT: '#009BF4', dark: '#0072CE' },
        // Tecnología, IA, información y estados.
        cyan: { DEFAULT: '#00A9E0', soft: '#E8F4FC' },
        // Sólo "todo está bien": elegible, ahorro, recomendación positiva.
        success: { DEFAULT: '#78BE20', soft: '#EAF6E1' },
        // Sólo rechazo, error o alerta.
        danger: { DEFAULT: '#E51B23', soft: '#FDE8EC' },
        ink: '#123B66',
        muted: '#5B7896',
        line: '#D9E2EA',
        surface: '#FFFFFF',
        soft: '#E8F4FC',
        canvas: '#F5F7F9',
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
