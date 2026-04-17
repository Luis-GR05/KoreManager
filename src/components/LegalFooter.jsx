import { Link } from 'react-router-dom';

/**
 * Footer minimal para páginas internas (solo enlaces legales).
 *
 * @returns {import('react').JSX.Element}
 */
export default function LegalFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#0A0A12] px-6 md:px-8 py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-600">
          © 2026 Luis Gordillo Rodríguez · Proyecto de Fin de Grado
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
          <Link to="/legal/privacidad" className="hover:text-brand-lime transition-colors duration-200">
            Política de privacidad
          </Link>
          <Link to="/legal/terminos" className="hover:text-brand-lime transition-colors duration-200">
            Términos de uso
          </Link>
          <Link to="/legal/aviso-legal" className="hover:text-brand-lime transition-colors duration-200">
            Aviso legal
          </Link>
          <Link to="/legal/cookies" className="hover:text-brand-lime transition-colors duration-200">
            Política de cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}

