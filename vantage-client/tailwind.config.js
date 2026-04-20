/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1c1c1e',
        surface: '#ffffff',
        interactive: '#5b76fe',
        'interactive-pressed': '#2a41b6',
        success: '#00b473',
        border: '#c7cad5',
        'ring': 'rgb(224,226,232)',
        coral: { light: '#ffc6c6', dark: '#600000' },
        rose: { light: '#ffd8f4', dark: '#b84d7a' },
        teal: { light: '#c3faf5', dark: '#187574' },
        orange: { light: '#ffe6cd', dark: '#8c5a2a' },
        yellow: { light: '#fff8c6', dark: '#746019' },
        moss: { light: '#d4f5d9', dark: '#187574' },
      },
      fontFamily: {
        display: ['Roobert PRO', 'system-ui', 'sans-serif'],
        body: ['Noto Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['56px', { lineHeight: '1.15', letterSpacing: '-1.68px' }],
        'section': ['48px', { lineHeight: '1.15', letterSpacing: '-1.44px' }],
        'card-title': ['24px', { lineHeight: '1.15', letterSpacing: '-0.72px' }],
        'subheading': ['22px', { lineHeight: '1.35', letterSpacing: '-0.44px' }],
        'feature': ['18px', { lineHeight: '1.35' }],
        'body': ['18px', { lineHeight: '1.45' }],
        'body-standard': ['16px', { lineHeight: '1.50', letterSpacing: '-0.16px' }],
        'button': ['17.5px', { lineHeight: '1.29', letterSpacing: '0.175px' }],
        'caption': ['14px', { lineHeight: '1.71' }],
        'small': ['12px', { lineHeight: '1.15', letterSpacing: '-0.36px' }],
      },
      borderRadius: {
        'button': '8px',
        'card': '12px',
        'panel': '20px',
        'container': '40px',
      },
      boxShadow: {
        'ring': 'rgb(224,226,232) 0px 0px 0px 1px',
      },
    },
  },
  plugins: [],
}