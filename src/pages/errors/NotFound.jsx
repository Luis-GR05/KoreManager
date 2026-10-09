import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import ErrorScreen from './ErrorScreen';

/** 404 · "Fuera de pista" */
export default function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <ErrorScreen
      code="404"
      court={2}
      title={t('errors.notFound.title')}
      desc={t('errors.notFound.desc')}
      primary={{ to: user ? '/dashboard' : '/', label: user ? t('errors.goDashboard') : t('errors.goHome') }}
      secondary={{ onClick: () => window.history.back(), label: t('errors.back') }}
    />
  );
}
