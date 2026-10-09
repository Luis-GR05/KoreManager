import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';

const subscribe = (cb) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

/** Aviso fijo cuando se pierde la conexión ("Sin cobertura"). */
export default function OfflineBanner() {
  const { t } = useTranslation();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 bg-semantic-warning px-4 py-2 text-sm font-bold text-[#0F0F1A]">
      <WifiOff size={16} aria-hidden="true" /> {t('errors.offline')}
    </div>
  );
}
