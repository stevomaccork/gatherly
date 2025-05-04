/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0F14',
        secondary: '#12181F',
        'surface-blur': 'rgba(18,24,31,0.6)',
        'accent-1': '#00E5FF',
        'accent-2': '#FF00E1',
        'text-primary': '#E3E6EA',
        'text-secondary': '#8A94A6',
        error: '#FF4C4C',
        success: '#00FF85',
        warning: '#FFD600',
      },
      fontFamily: {
        heading: ['Orbitron', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 229, 255, 0.5)',
        'neon-intense': '0 0 20px rgba(0, 229, 255, 0.8)',
        'neon-accent': '0 0 15px rgba(255, 0, 225, 0.6)',
      },
      backdropBlur: {
        xl: '16px',
      },
    },
  },
  plugins: [],
};