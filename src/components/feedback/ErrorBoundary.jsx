import { Component } from 'react';
import { withTranslation } from 'react-i18next';
import ErrorScreen from '../../pages/errors/ErrorScreen';

const RELOAD_KEY = 'kore_chunk_reload';

/**
 * Captura errores de render para no dejar la pantalla en blanco.
 * Caso especial: tras un despliegue, los trozos JS antiguos ya no existen
 * ("Failed to fetch dynamically imported module"); se recarga una vez sola.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    const msg = String(error?.message ?? '');
    const chunk = /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(msg);
    if (chunk) {
      try {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1');
          window.location.reload();
          return;
        }
      } catch { /* ignorar */ }
    }
    console.error('[ErrorBoundary]', error);
  }

  render() {
    const { error } = this.state;
    const { t, children } = this.props;
    if (!error) return children;
    return (
      <ErrorScreen
        code="500"
        court={0}
        title={t('errors.crash.title')}
        desc={t('errors.crash.desc')}
        primary={{ onClick: () => window.location.reload(), label: t('errors.retry') }}
        secondary={{ onClick: () => { window.location.href = '/'; }, label: t('errors.goHome') }}
      />
    );
  }
}

const TranslatedErrorBoundary = withTranslation()(ErrorBoundary);
export default TranslatedErrorBoundary;
