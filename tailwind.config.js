/** @type {import('tailwindcss').Config} */
export default {
  // 'class' strategy: dark mode toggled by adding the `dark` class on <html>.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand color = amber scale (the raffle's warm accent).
        // Kept for the admin view, which depends on `brand`.
        brand: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#F59E0B',
        },
        // Nintendo red — primary accent of the public hero/theme.
        nintendo: {
          50: '#FFE5E7',
          100: '#FFB8BD',
          200: '#FF8A92',
          300: '#FF5C67',
          400: '#FF2E3C',
          500: '#E60012',
          600: '#C2000F',
          700: '#99000C',
          800: '#700009',
          900: '#470006',
          DEFAULT: '#E60012',
        },
        // Switch neon cyan — secondary accent.
        switchblue: {
          50: '#E0FAFF',
          100: '#B3F2FF',
          200: '#80E9FB',
          300: '#4DDDF2',
          400: '#26D0EB',
          500: '#00C3E3',
          600: '#009FBC',
          700: '#007B93',
          800: '#00576A',
          900: '#003541',
          DEFAULT: '#00C3E3',
        },
        // Premium dark base.
        ink: {
          950: '#0A0E1A',
          900: '#0F1424',
          850: '#141B2E',
          800: '#1B2440',
          DEFAULT: '#0A0E1A',
        },
        // Subtle gold — reserved for special-prize accents (winner star).
        gold: {
          50: '#FDF6E3',
          100: '#FBECC2',
          200: '#F8DD8E',
          300: '#F5CE5A',
          400: '#F5C542',
          500: '#E0AC20',
          600: '#B88817',
          700: '#8F6811',
          DEFAULT: '#F5C542',
        },
      },
      fontFamily: {
        // Display font for hero/headings; Inter stays as the body font.
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-14px)' },
        },
        floatDelayed: {
          '0%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(6px)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.08)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite alternate',
        floatDelayed: 'floatDelayed 7s ease-in-out infinite alternate',
        gradientShift: 'gradientShift 18s ease-in-out infinite',
        glowPulse: 'glowPulse 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
