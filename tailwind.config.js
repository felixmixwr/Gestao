/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Cores personalizadas para status financeiros
        status: {
          'enviado': '#ef4444',      // red-500
          'recebido': '#6366f1',     // indigo-500  
          'aprovacao': '#f97316',    // orange-500
          'nota': '#3b82f6',         // blue-500
          'aguardando': '#eab308',   // yellow-500
          'pago': '#22c55e',         // green-500
        }
      }
    },
  },
  plugins: [],
}

