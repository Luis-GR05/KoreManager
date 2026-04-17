import { Link } from 'react-router-dom';

/**
 * Página legal: Términos de uso.
 * Contenido orientativo; debe ajustarse a las condiciones reales del servicio.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Terminos() {
  return (
    <div className="min-h-screen bg-dark-base text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Legal</p>
          <h1 className="text-3xl md:text-4xl font-black">Términos de uso</h1>
          <p className="text-sm text-gray-400">
            Documento orientativo. Ajusta según normas del ayuntamiento/club y condiciones de reserva/pago.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-black">1. Cuenta y acceso</h2>
          <p className="text-sm text-gray-400">
            El usuario es responsable de mantener la confidencialidad de sus credenciales y del uso realizado desde su cuenta.
          </p>

          <h2 className="text-lg font-black">2. Reservas</h2>
          <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
            <li>Las reservas están sujetas a disponibilidad y a las normas de la instalación.</li>
            <li>El sistema puede aplicar límites (p. ej. número de reservas activas) si se configuran.</li>
            <li>Las cancelaciones pueden estar sujetas a plazos (si se establecen).</li>
          </ul>

          <h2 className="text-lg font-black">3. Uso aceptable</h2>
          <p className="text-sm text-gray-400">
            Queda prohibido el uso fraudulento, el acceso no autorizado o cualquier acción que dañe el servicio o a terceros.
          </p>

          <h2 className="text-lg font-black">4. Suspensión</h2>
          <p className="text-sm text-gray-400">
            El responsable podrá suspender o cancelar cuentas por incumplimiento de estos términos o por motivos de seguridad.
          </p>
        </section>

        <div className="pt-4 border-t border-white/5 text-sm text-gray-400">
          <Link className="text-brand-lime font-bold hover:underline" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

