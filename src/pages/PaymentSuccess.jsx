import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/**
 * Página de confirmación de pago.
 * Lee `session_id` desde query params para debugging/soporte.
 *
 * @returns {import('react').JSX.Element}
 */
export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="min-h-screen bg-dark-base text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-dark-surface/80 border border-white/10 rounded-3xl p-8 text-center space-y-4 anim-popin">
        <div className="w-14 h-14 rounded-2xl bg-semantic-success/10 border border-semantic-success/20 mx-auto flex items-center justify-center text-semantic-success">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="text-2xl font-black">Pago confirmado</h1>
        <p className="text-sm text-gray-400">
          Tu pago se ha procesado correctamente. En unos segundos se reflejará como <strong>pagado</strong>.
        </p>
        {sessionId && (
          <p className="text-xs text-gray-600 break-all">Session: {sessionId}</p>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <Link to="/dashboard" className="px-5 py-3 rounded-2xl bg-brand-lime text-black font-black">
            Ir al dashboard
          </Link>
          <Link to="/historial" className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-bold">
            Ver historial
          </Link>
        </div>
      </div>
    </div>
  );
}

