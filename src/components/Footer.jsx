import { Link } from 'react-router-dom';

/**
 * Footer global reutilizable (marca + enlaces + copyright).
 * Se usa tanto en la landing como en el Layout autenticado.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0A0A12] px-8 py-14">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-2xl font-extrabold tracking-tighter cursor-default">
            <div className="w-12 h-12 rounded-3xl bg-[#0F0F1A] flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo.png"
                alt="Kore Manager"
                className="w-full h-full object-contain p-2"
                style={{ filter: 'drop-shadow(0 0 10px rgba(204,255,0,.14)) brightness(1.06)' }}
              />
            </div>
            <div>
              KORE<span className="text-brand-lime">MANAGER</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm max-w-xs">
            Gestión deportiva moderna para instalaciones municipales y clubes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-gray-500">
          <a href="#deportes" className="hover:text-brand-lime transition-colors duration-200">Instalaciones</a>
          <a href="#funciones" className="hover:text-brand-lime transition-colors duration-200">Funciones</a>
          <a href="#sobre" className="hover:text-brand-lime transition-colors duration-200">Sobre nosotros</a>
          <Link to="/login" className="hover:text-brand-lime transition-colors duration-200">Acceso usuarios</Link>
          <Link to="/legal/privacidad" className="hover:text-brand-lime transition-colors duration-200">Política de privacidad</Link>
          <Link to="/legal/terminos" className="hover:text-brand-lime transition-colors duration-200">Términos de uso</Link>
          <Link to="/legal/aviso-legal" className="hover:text-brand-lime transition-colors duration-200">Aviso legal</Link>
          <Link to="/legal/cookies" className="hover:text-brand-lime transition-colors duration-200">Política de cookies</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex items-center justify-center gap-3 text-xs text-gray-600">
        <p>© 2026 Luis Gordillo Rodríguez · Proyecto de Fin de Grado</p>
      </div>
    </footer>
  );
}

