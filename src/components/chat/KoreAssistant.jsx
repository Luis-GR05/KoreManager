import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import './chat.css';

// El panel (y su lógica) solo se descarga la primera vez que se abre el chat
const loadPanel = () => import('./ChatPanel');
const ChatPanel = lazy(loadPanel);

const TEASER_KEY = 'kore_chat_teaser_seen';

/**
 * Asistente Kore: botón flotante siempre visible abajo a la derecha.
 * Es ligero (solo una imagen WebP de 9 KB); el panel se carga bajo demanda.
 */
export default function KoreAssistant() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const fabRef = useRef(null);

  // Mensaje de bienvenida discreto, una vez por sesión
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(TEASER_KEY) === '1'; } catch { /* ignorar */ }
    if (seen) return undefined;
    const id = setTimeout(() => setTeaser(true), 6000);
    return () => clearTimeout(id);
  }, []);

  const hideTeaser = useCallback(() => {
    setTeaser(false);
    try { sessionStorage.setItem(TEASER_KEY, '1'); } catch { /* ignorar */ }
  }, []);

  const toggle = () => {
    hideTeaser();
    setMounted(true);
    setOpen((v) => !v);
  };

  const close = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  return (
    <div className="kore-chat" data-open={open}>
      {mounted && (
        <Suspense fallback={null}>
          <ChatPanel open={open} onClose={close} />
        </Suspense>
      )}

      {teaser && !open && (
        <div className="kore-chat__teaser" role="status">
          <button type="button" className="kore-chat__teaser-text" onClick={toggle}>
            {t('chat.teaser')}
          </button>
          <button type="button" className="kore-chat__teaser-close" onClick={hideTeaser} aria-label={t('chat.teaserClose')}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        onClick={toggle}
        onPointerEnter={loadPanel}
        onFocus={loadPanel}
        aria-expanded={open}
        aria-controls="kore-chat-panel"
        aria-label={open ? t('chat.close') : t('chat.open')}
        className="kore-chat__fab"
      >
        <img src="/images/chatbot-128.webp" alt="" width="128" height="126" decoding="async" className="kore-chat__fab-img" />
        <span className="kore-chat__fab-close" aria-hidden="true"><X size={22} strokeWidth={2.5} /></span>
      </button>
    </div>
  );
}
