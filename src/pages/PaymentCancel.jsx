import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentCancel() {
  const [params] = useSearchParams();
  const reservaId = params.get('reserva_id');
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-dark-base text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-dark-surface/80 border border-white/10 rounded-3xl p-8 text-center space-y-4 anim-popin">
        <div className="w-14 h-14 rounded-2xl bg-semantic-danger/10 border border-semantic-danger/20 mx-auto flex items-center justify-center text-semantic-danger">
          <XCircle size={28} />
        </div>
        <h1 className="text-2xl font-black">{t('payment.cancel.title')}</h1>
        <p className="text-sm text-gray-400">
          {t('payment.cancel.desc')}
        </p>
        {reservaId && (
          <p className="text-xs text-gray-600">Reserva: {reservaId}</p>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <Link to="/historial" className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-bold">
            {t('payment.cancel.goToHistory')}
          </Link>
          <Link to="/reservar" className="px-5 py-3 rounded-2xl bg-brand-lime text-black font-black">
            {t('payment.cancel.bookAgain')}
          </Link>
        </div>
      </div>
    </div>
  );
}
