import { useId } from 'react';

/**
 * Campo de texto accesible con etiqueta, icono, ayuda y mensaje de error.
 *
 * - `label` visible (recomendado). Si no hay label, se usa el placeholder como
 *   nombre accesible para no dejar el campo "mudo" a lectores de pantalla.
 * - El error se anuncia (aria-invalid + aria-describedby + role="alert").
 * - `trailing`: elemento a la derecha dentro del campo (p. ej. mostrar contraseña).
 *
 * @param {{
 *  icon?: any, label?: string, hint?: string, error?: string,
 *  trailing?: import('react').ReactNode, className?: string, wrapperClassName?: string,
 *  [key: string]: any
 * }} props
 */
export default function Input({
  icon: Icon,
  label,
  hint,
  error,
  trailing,
  id,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? `in-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [props['aria-describedby'], errorId, hintId].filter(Boolean).join(' ') || undefined;
  const a11yName = !label && !props['aria-label'] && props.placeholder ? { 'aria-label': props.placeholder } : {};

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold theme-text">
          {label}
          {props.required && <span className="sr-only"> (obligatorio)</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon
            aria-hidden="true"
            className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
              error ? 'text-semantic-danger' : 'text-gray-500 group-focus-within:text-brand-purple dark:group-focus-within:text-brand-lime'
            }`}
            size={20}
          />
        )}

        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...a11yName}
          {...props}
          className={`w-full rounded-xl border py-3 theme-bg theme-text placeholder:text-gray-500 transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:outline-none ${
            error
              ? 'border-semantic-danger focus:shadow-[0_0_0_3px_rgba(255,59,48,0.25)]'
              : 'theme-border focus:border-brand-purple dark:focus:border-brand-lime focus:shadow-[0_0_0_3px_rgba(138,43,226,0.18)] dark:focus:shadow-[0_0_0_3px_rgba(204,255,0,0.18)]'
          } ${Icon ? 'pl-12' : 'pl-4'} ${trailing ? 'pr-12' : 'pr-4'} ${className}`}
        />

        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs theme-faint">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-semantic-danger">
          {error}
        </p>
      )}
    </div>
  );
}
