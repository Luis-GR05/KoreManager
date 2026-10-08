import { useEffect, useRef, useState } from 'react';

/**
 * Observa cuándo un elemento entra en el viewport.
 *
 * @param {{ once?: boolean, rootMargin?: string, threshold?: number }} [options]
 * @returns {[import('react').RefObject<any>, boolean]}
 */
export default function useInView({ once = true, rootMargin = '0px 0px -10% 0px', threshold = 0.2 } = {}) {
  const ref = useRef(null);
  // Sin IntersectionObserver (navegadores muy antiguos) mostramos todo directamente
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return [ref, inView];
}
