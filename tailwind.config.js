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
          red:    '#FF3B30',  // Peligro, eliminar (FIX: antes undefined)
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}