/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fondos Globales de Kore Manager
        dark: {
          base:    '#0F0F1A',  // Fondo principal de la app
          surface: '#1A1A2E', // Tarjetas y paneles
          elevated:'#1F1F2E', // Elementos sobre tarjetas (inputs, modales)
        },
        light: {
          base:    '#F8F9FA',
          surface: '#FFFFFF',
          elevated:'#E9ECEF',
        },
        // Aliases con guión para compatibilidad
        'dark-base':    '#0F0F1A',
        'dark-surface': '#1A1A2E',
        'dark-elevated':'#1F1F2E',
        'light-base':    '#F8F9FA',
        'light-surface': '#FFFFFF',
        'light-elevated':'#E9ECEF',
        // Colores de Marca
        brand: {
          lime:   '#CCFF00',  // Acento principal
          purple: '#8A2BE2',  // Secundario/Efectos
          red:    '#FF3B30',  // Peligro, eliminar
        },
        // Colores Semánticos (Estados)
        semantic: {
          danger:  '#FF3B30', // Errores, borrar, salir
          success: '#34C759', // Confirmaciones
          warning: '#FFCC00', // Alertas medias
          info:    '#007AFF', // Conserjes, información
        }
      },
      fontFamily: {
        // Texto: Archivo (grotesca con eje de anchura, legible a tamaños pequeños)
        sans: ['"Archivo Variable"', 'Archivo', 'system-ui', 'sans-serif'],
        // Titulares: Big Shoulders Display (rotulación de estadio, condensada)
        display: ['"Big Shoulders Display Variable"', '"Big Shoulders Display"', 'Impact', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(204,255,0,.55)' },
          '70%': { boxShadow: '0 0 0 10px rgba(204,255,0,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(204,255,0,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'in': 'slide-down 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'spin-slow': 'spin 3s linear infinite',
        marquee: 'marquee 40s linear infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
    },
  },
  plugins: [],
}
