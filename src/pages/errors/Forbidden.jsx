import { useTranslation } from 'react-i18next';
import ErrorScreen from './ErrorScreen';

/** 403 · "Zona reservada" (rol sin permisos para la sección) */
export default function Forbidden() {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      code="403"
      court={1}
      title={t('errors.forbidden.title')}
      desc={t('errors.forbidden.desc')}
      primary={{ to: '/dashboard', label: t('errors.goDashboard') }}
      secondary={{ onClick: () => window.location.reload(), label: t('errors.retry') }}
    />
  );
}
