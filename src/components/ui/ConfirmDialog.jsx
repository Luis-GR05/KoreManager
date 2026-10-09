import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * Diálogo de confirmación accesible (sustituye a window.confirm).
 * Escape cierra, el foco va al botón seguro al abrirse.
 *
 * @param {{
 *  open: boolean, title: string, desc?: import('react').ReactNode,
 *  confirmLabel: string, cancelLabel: string, busy?: boolean, danger?: boolean,
 *  onConfirm: () => void, onCancel: () => void,
 * }} props
 */
export default function ConfirmDialog({
  open, title, desc, confirmLabel, cancelLabel, busy = false, danger = true, onConfirm, onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="theme-card border theme-border p-7 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${danger ? 'bg-red-500/10 text-red-500' : 'bg-brand-purple/10 dark:bg-brand-lime/10 text-brand-purple dark:text-brand-lime'}`}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirm-dialog-title" className="text-lg font-black theme-text">{title}</h2>
        {desc && <div className="mt-2 text-sm theme-muted">{desc}</div>}
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 rounded-xl border theme-border theme-text font-bold hover:bg-brand-purple/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 py-3 rounded-xl font-black transition-colors disabled:opacity-50 ${danger
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-brand-purple dark:bg-brand-lime text-white dark:text-black hover:opacity-90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
