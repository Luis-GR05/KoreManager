import { useTranslation } from 'react-i18next';
import useInView from '../../hooks/useInView';

/**
 * Proceso de reserva en tres pasos. Es una secuencia real, por eso va numerada;
 * la línea que une los pasos se traza al entrar en pantalla.
 */
export default function HowItWorks() {
  const { t } = useTranslation();
  const [ref, inView] = useInView({ threshold: 0.35 });
  const steps = ['s1', 's2', 's3'];

  return (
    <section aria-labelledby="how-title" className="relative overflow-hidden border-y border-white/10 bg-[#13132A] px-5 sm:px-8 py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-7xl">
        <h2 id="how-title" className="font-display text-4xl sm:text-6xl font-black uppercase leading-[0.9] text-white">
          {t('landing.how.title')}
        </h2>

        <ol className={`how mt-14 grid gap-12 md:grid-cols-3 md:gap-8 ${inView ? 'is-in' : ''}`}>
          {steps.map((s, i) => (
            <li key={s} className="how__step relative" style={{ '--i': i }}>
              <div className="flex items-center gap-4">
                <span className="how__num font-display text-[5.5rem] font-black leading-none tabular" aria-hidden="true">{i + 1}</span>
                {i < steps.length - 1 && <span className="how__line hidden md:block" aria-hidden="true" />}
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">{t(`landing.how.${s}.title`)}</h3>
              <p className="mt-2 max-w-xs leading-relaxed text-white/65">{t(`landing.how.${s}.desc`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
