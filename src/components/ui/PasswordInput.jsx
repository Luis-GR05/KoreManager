import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Circle, Eye, EyeOff, Lock } from 'lucide-react';
import Input from './Input';
import { passwordRules, passwordScore } from '../../lib/validation';

/**
 * Campo de contraseña con botón accesible para mostrar/ocultar y aviso de
 * Bloq Mayús.
 * @param {{ [key: string]: any }} props  mismas props que <Input>
 */
export default function PasswordInput(props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);

  const onKey = (e) => {
    if (typeof e.getModifierState === 'function') setCaps(e.getModifierState('CapsLock'));
    props.onKeyUp?.(e);
  };

  return (
    <Input
      icon={Lock}
      {...props}
      type={visible ? 'text' : 'password'}
      onKeyUp={onKey}
      hint={caps ? t('auth.capsLock') : props.hint}
      trailing={(
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          aria-controls={props.id}
          className="grid h-9 w-9 place-items-center rounded-lg theme-faint transition-colors hover:theme-text"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      )}
    />
  );
}

const BAR = ['bg-semantic-danger', 'bg-semantic-danger', 'bg-semantic-warning', 'bg-brand-purple dark:bg-brand-lime', 'bg-semantic-success'];

/**
 * Medidor de seguridad + lista de requisitos que se van marcando.
 * @param {{ value: string, personal?: string[], id?: string }} props
 */
export function PasswordStrength({ value, personal = [], id }) {
  const { t } = useTranslation();
  const score = passwordScore(value, personal);
  const rules = passwordRules(value);
  if (!value) return null;

  return (
    <div id={id} className="mt-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-colors duration-300 ${i < Math.max(score, 1) ? BAR[score] : 'theme-elevated'}`} />
          ))}
        </div>
        <span className="text-xs font-semibold theme-muted whitespace-nowrap">
          {t('validation.strength.label')}: {t(`validation.strength.${score}`)}
        </span>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {Object.entries(rules).map(([k, ok]) => (
          <li key={k} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'theme-faint'}`}>
            {ok ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : <Circle size={6} fill="currentColor" aria-hidden="true" className="mx-[3.5px]" />}
            <span>{t(`validation.rules.${k}`)}</span>
            <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
