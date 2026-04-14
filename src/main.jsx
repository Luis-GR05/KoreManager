import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * StrictMode eliminado intencionadamente:
 * en React 18-19 monta los efectos dos veces en desarrollo, lo que creaba
 * dos suscripciones simultáneas a onAuthStateChange y provocaba estados
 * de sesión inconsistentes. Se puede volver a activar si Supabase lo soporta.
 */
createRoot(document.getElementById('root')).render(<App />)
