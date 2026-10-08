import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUp, RotateCcw, X, Zap } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/useAuth';
import { FAQ, QUICK_IDS, matchFaq } from './faq';

const STORAGE_KEY = 'kore_chat_v1';
const MAX_CHARS = 600;
const SAFE_ROUTES = [
  '/reservar', '/historial', '/dashboard', '/profile', '/estadisticas', '/login', '/register',
  '/forgot-password', '/legal/privacidad', '/legal/terminos', '/legal/cookies', '/legal/aviso-legal', '/',
];

let idSeq = 0;
const uid = () => `${Date.now().toString(36)}-${(idSeq += 1)}`;

/* ─────────────── Texto enriquecido seguro ───────────────
   Soporta **negrita**, listas "- " / "1. " y enlaces [texto](/ruta) a rutas
   internas de una lista blanca. Nunca se inyecta HTML. */
function Inline({ text, onNavigate }) {
  const parts = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={k += 1}>{text.slice(last, m.index)}</Fragment>);
    if (m[1]) {
      parts.push(<strong key={k += 1}>{m[1]}</strong>);
    } else {
      const href = m[3];
      parts.push(
        SAFE_ROUTES.includes(href)
          ? <Link key={k += 1} to={href} onClick={onNavigate} className="kore-msg__link">{m[2]}</Link>
          : <Fragment key={k += 1}>{m[2]}</Fragment>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(<Fragment key={k += 1}>{text.slice(last)}</Fragment>);
  return parts;
}

function RichText({ text, onNavigate }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      if (!list) { list = []; blocks.push({ type: 'ul', items: list, key: i }); }
      list.push(bullet[1]);
      return;
    }
    list = null;
    if (line.trim()) blocks.push({ type: 'p', text: line, key: i });
  });
  return blocks.map((b) => (b.type === 'ul'
    ? <ul key={b.key}>{b.items.map((it, j) => <li key={j}><Inline text={it} onNavigate={onNavigate} /></li>)}</ul>
    : <p key={b.key}><Inline text={b.text} onNavigate={onNavigate} /></p>));
}

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.slice(-40) : null;
  } catch {
    return null;
  }
}

/**
 * Panel del asistente: FAQ instantáneas + respuestas personalizadas con IA.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function ChatPanel({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'es').startsWith('en') ? 'en' : 'es';
  const { user, profile } = useAuth();
  const firstName = profile?.full_name?.trim()?.split(/\s+/)?.[0] || '';

  const [messages, setMessages] = useState(() => loadHistory() ?? []);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [notice, setNotice] = useState('');
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const panelRef = useRef(null);

  const greeting = useMemo(
    () => ({ id: 'greeting', role: 'assistant', content: t('chat.greeting', { name: firstName ? `, ${firstName}` : '' }) }),
    [t, firstName],
  );
  const all = [greeting, ...messages];

  // Persistencia por pestaña (sessionStorage)
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch { /* ignorar */ }
  }, [messages]);

  // Foco y Escape
  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(id); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, pending, open]);

  const push = (msg) => setMessages((prev) => [...prev, { id: uid(), ...msg }]);

  const faqReply = (item, delay = 380) => {
    setPending(true);
    setTimeout(() => {
      push({ role: 'assistant', content: item.a[lang], source: 'faq' });
      setPending(false);
    }, delay);
  };

  /** Mensaje de error amable + la mejor FAQ disponible como respaldo. */
  const fallback = (key, text, vars = {}) => {
    const m = text ? matchFaq(text) : null;
    push({ role: 'assistant', content: t(`chat.errors.${key}`, vars), source: 'system' });
    if (m?.item) push({ role: 'assistant', content: m.item.a[lang], source: 'faq' });
  };

  const askAI = async (history, text) => {
    setPending(true);
    try {
      const payload = history
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.source !== 'system'))
        .slice(-10)
        .map(({ role, content }) => ({ role, content: String(content).slice(0, MAX_CHARS) }));

      const { data, error } = await supabase.functions.invoke('kore-assistant', {
        body: { messages: payload, lang },
      });

      if (error) {
        let body = null;
        const status = error.context?.status;
        try { body = await error.context?.json(); } catch { /* sin cuerpo */ }
        if (status === 429) {
          if (body?.scope === 'user') {
            const mins = body?.resetAt ? Math.max(1, Math.ceil((new Date(body.resetAt) - Date.now()) / 60000)) : null;
            fallback('user', text, { when: mins ? t('chat.inMinutes', { n: mins }) : t('chat.soon') });
          } else if (body?.scope === 'busy') {
            fallback('busy', text);
          } else {
            fallback('daily', text);
          }
        } else {
          fallback('generic', text);
        }
        return;
      }

      push({ role: 'assistant', content: String(data?.reply ?? '').slice(0, 2000) || t('chat.errors.generic'), source: 'ai' });
      if (typeof data?.remaining === 'number') setRemaining(data.remaining);
    } catch {
      fallback('generic', text);
    } finally {
      setPending(false);
    }
  };

  const send = (raw) => {
    const text = raw.trim();
    if (!text) return;
    if (pending) { setNotice(t('chat.errors.tooFast')); return; }
    if (text.length > MAX_CHARS) { setNotice(t('chat.errors.tooLong', { n: MAX_CHARS })); return; }
    setNotice('');
    setInput('');

    const userMsg = { id: uid(), role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);

    const m = matchFaq(text);
    if (m && m.score > 0 && !m.personal) { faqReply(m.item); return; }
    if (m?.personal && !user) {
      faqReply({ a: { es: t('chat.loginForPersonal'), en: t('chat.loginForPersonal') } });
      return;
    }
    void askAI(history, text);
  };

  const onQuick = (item) => {
    if (pending) return;
    push({ role: 'user', content: item.q[lang] });
    faqReply(item);
  };

  const reset = () => {
    setMessages([]);
    setRemaining(null);
    setNotice('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  // En móvil el panel ocupa la pantalla: al navegar desde un enlace, se cierra
  const onNavigate = () => {
    if (window.matchMedia('(max-width: 639px)').matches) onClose();
  };

  const quick = QUICK_IDS.map((id) => FAQ.find((f) => f.id === id)).filter(Boolean);
  const personalQuick = t('chat.personalQuick', { returnObjects: true });
  const showQuick = messages.length === 0;

  return (
    <section
      id="kore-chat-panel"
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="kore-chat-title"
      className="kore-panel"
      data-open={open}
      inert={!open}
    >
      <header className="kore-panel__head">
        <img src="/images/chatbot-face-96.webp" alt="" width="40" height="40" className="kore-panel__avatar" />
        <div className="min-w-0 flex-1">
          <h2 id="kore-chat-title" className="font-display text-xl font-black uppercase leading-none text-white">{t('chat.name')}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-lime" aria-hidden="true" />
            {t('chat.role')}
          </p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={reset} className="kore-panel__icon" aria-label={t('chat.clear')} title={t('chat.clear')}>
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        )}
        <button type="button" onClick={onClose} className="kore-panel__icon" aria-label={t('chat.close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="kore-panel__body" aria-live="polite" aria-relevant="additions">
        {all.map((m) => (
          <div key={m.id} className={`kore-msg kore-msg--${m.role}`}>
            {m.role === 'assistant' && m.source === 'faq' && (
              <span className="kore-msg__tag"><Zap size={11} aria-hidden="true" /> {t('chat.faqAnswer')}</span>
            )}
            <div className="kore-msg__bubble">
              {m.role === 'assistant' ? <RichText text={m.content} onNavigate={onNavigate} /> : <p>{m.content}</p>}
            </div>
          </div>
        ))}

        {showQuick && (
          <div className="kore-quick">
            <p className="kore-quick__label">{t('chat.quick')}</p>
            <div className="flex flex-wrap gap-2">
              {user && Array.isArray(personalQuick) && personalQuick.map((q) => (
                <button key={q} type="button" className="kore-chip kore-chip--personal" onClick={() => send(q)}>{q}</button>
              ))}
              {quick.map((item) => (
                <button key={item.id} type="button" className="kore-chip" onClick={() => onQuick(item)}>{item.q[lang]}</button>
              ))}
            </div>
          </div>
        )}

        {pending && (
          <div className="kore-msg kore-msg--assistant">
            <div className="kore-msg__bubble kore-typing" role="status" aria-label={t('chat.typing')}>
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="kore-panel__form"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        {(notice || (remaining !== null && remaining <= 5)) && (
          <p className="mb-2 text-[11px] text-white/60" role="status">
            {notice || t('chat.remaining', { n: remaining })}
          </p>
        )}
        <div className="kore-panel__input">
          <label htmlFor="kore-chat-input" className="sr-only">{t('chat.placeholder')}</label>
          <textarea
            id="kore-chat-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('chat.placeholder')}
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" disabled={!input.trim() || pending} aria-label={t('chat.send')} className="kore-panel__send">
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-[10.5px] leading-snug text-white/60">{t('chat.disclaimer')}</p>
      </form>
    </section>
  );
}
