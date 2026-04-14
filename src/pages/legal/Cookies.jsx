import { Link } from 'react-router-dom';

export default function Cookies() {
  return (
    <div className="min-h-screen bg-dark-base text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Legal</p>
          <h1 className="text-3xl md:text-4xl font-black">Política de cookies</h1>
          <p className="text-sm text-gray-400">
            Documento orientativo para España (LSSI). Ajusta según el uso real de cookies/trackers.
          </p>
        </header>

        <section className="space-y-3 bg-[#1A1A2E] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-black">1. ¿Qué son las cookies?</h2>
          <p className="text-sm text-gray-400">
            Son pequeños archivos que se almacenan en tu dispositivo para permitir el funcionamiento del sitio,
            recordar preferencias o medir el uso.
          </p>

          <h2 className="text-lg font-black">2. Cookies utilizadas</h2>
          <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
            <li><strong>Técnicas/estrictamente necesarias</strong>: imprescindibles para el login y la sesión.</li>
            <li><strong>Preferencias</strong>: recuerdan ajustes (si se habilitan).</li>
            <li><strong>Analítica</strong>: solo si se activa explícitamente (no habilitada por defecto).</li>
          </ul>

          <h2 className="text-lg font-black">3. Cómo gestionar cookies</h2>
          <p className="text-sm text-gray-400">
            Puedes configurar o rechazar cookies desde tu navegador. Si deshabilitas cookies técnicas, es posible
            que algunas funcionalidades no estén disponibles.
          </p>
        </section>

        <div className="pt-4 border-t border-white/5 text-sm text-gray-400">
          <Link className="text-brand-lime font-bold hover:underline" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

