import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { t } = useTranslation();

  return (
    <div className="min-h-screen theme-bg theme-text flex items-center justify-center px-6">
      <div className="max-w-md w-full theme-card border theme-border p-8 text-center space-y-4 anim-popin">
        <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 dark:bg-brand-lime/10 border border-brand-purple/20 dark:border-brand-lime/20 mx-auto flex items-center justify-center text-brand-purple dark:text-brand-lime">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="text-2xl font-black theme-text">{t('payment.success.title')}</h1>
        <p className="text-sm theme-faint">
          {t('payment.success.desc')}
        </p>
        {sessionId && (
          <p className="text-xs theme-faint break-all">Session: {sessionId}</p>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <Link to="/dashboard" className="px-5 py-3 rounded-2xl bg-brand-purple dark:bg-brand-lime text-white dark:text-black font-black shadow-lg">
            {t('payment.success.goToDashboard')}
          </Link>
          <Link to="/historial" className="px-5 py-3 rounded-2xl theme-bg border theme-border theme-text font-bold">
            {t('payment.success.viewHistory')}
          </Link>
        </div>
      </div>
    </div>
  );
}
