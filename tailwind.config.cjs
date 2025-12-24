/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#f9fafb',
        border: '#e5e7eb',
        muted: '#6b7280',
        primary: '#2563eb'
      }
    }
  },
  plugins: []
};
