import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentCancel() {
  const [params] = useSearchParams();
  const reservaId = params.get('reserva_id');
  const { t } = useTranslation();

  return (
    <div className="min-h-screen theme-bg theme-text flex items-center justify-center px-6">
      <div className="max-w-md w-full theme-card border theme-border p-8 text-center space-y-4 anim-popin">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center text-red-500">
          <XCircle size={28} />
        </div>
        <h1 className="text-2xl font-black theme-text">{t('payment.cancel.title')}</h1>
        <p className="text-sm theme-faint">
          {t('payment.cancel.desc')}
        </p>
        {reservaId && (
          <p className="text-xs theme-faint">Reserva: {reservaId}</p>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <Link to="/historial" className="px-5 py-3 rounded-2xl theme-bg border theme-border theme-text font-bold">
            {t('payment.cancel.goToHistory')}
          </Link>
          <Link to="/reservar" className="px-5 py-3 rounded-2xl bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-black shadow-lg">
            {t('payment.cancel.bookAgain')}
          </Link>
        </div>
      </div>
    </div>
  );
}
