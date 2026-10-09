import { useEffect, useRef } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion';

/**
 * Red de nodos animada en canvas: el mismo lenguaje visual que el logotipo
 * (esferas púrpura unidas por aristas). Los nodos derivan despacio y el
 * cursor actúa como un nodo más que se conecta en lima.
 *
 * Rendimiento: se pausa fuera de pantalla y con la pestaña oculta; el número
 * de nodos se adapta al tamaño; DPR limitado a 2. Con "reducir movimiento"
 * se dibuja una sola vez, estática.
 *
 * @param {{ className?: string }} props
 */
export default function NetworkField({ className = '' }) {
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes = [];
    let raf = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999 };

    const LINK = 150;

    const seed = () => {
      const count = Math.round(Math.min(90, Math.max(28, (w * h) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1.6 + Math.random() * 3.2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Aristas
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(138, 43, 226, ${(1 - d / LINK) * 0.55})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // Conexión con el cursor (lima)
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < LINK * 1.3) {
          ctx.strokeStyle = `rgba(204, 255, 0, ${(1 - dm / (LINK * 1.3)) * 0.7})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      // Nodos (esferas con brillo, como en el logo 3D)
      for (const n of nodes) {
        const g = ctx.createRadialGradient(n.x - n.r * 0.35, n.y - n.r * 0.35, 0, n.x, n.y, n.r);
        g.addColorStop(0, 'rgba(214, 170, 255, 0.95)');
        g.addColorStop(0.45, 'rgba(138, 43, 226, 0.95)');
        g.addColorStop(1, 'rgba(70, 18, 130, 0.9)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      raf = 0;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
      draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (reduced) { draw(); return; }
      if (!raf) raf = requestAnimationFrame(step);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (reduced) draw();
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    resize();
    start();

    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onVis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
