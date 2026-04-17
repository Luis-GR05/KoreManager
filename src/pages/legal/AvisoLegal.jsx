import { Link } from 'react-router-dom';

/**
 * Página legal: Aviso legal.
 * Contenido orientativo (España); debe sustituirse con datos reales.
 *
 * @returns {import('react').JSX.Element}
 */
export default function AvisoLegal() {
  return (
    <div className="min-h-screen bg-dark-base text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Legal</p>
          <h1 className="text-3xl md:text-4xl font-black">Aviso legal</h1>
        </header>

        <section className="space-y-4 bg-[#1A1A2E] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-black">1. Titularidad</h2>
          <p className="text-sm text-gray-300">
            Titular: <strong>Luis Gordillo Rodríguez</strong><br />
            NIF/CIF: <strong>80243879F</strong><br />
            Domicilio: <strong>Plaza de la libertad, 1, Montijo, Badajoz</strong><br />
            Email de contacto: <strong>luisgordillor01@gmail.com</strong><br />
            Teléfono: <strong>644353801</strong>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black">2. Objeto</h2>
          <p className="text-sm text-gray-400">
            Este sitio web/app (“Kore Manager”) ofrece funcionalidades de gestión y reserva de instalaciones deportivas.
            El acceso y uso implica la aceptación de las presentes condiciones.
          </p>

          <h2 className="text-lg font-black">3. Propiedad intelectual</h2>
          <p className="text-sm text-gray-400">
            Los contenidos, marcas, diseños y código fuente son titularidad del responsable o de terceros con licencia.
            Queda prohibida su reproducción, distribución o modificación sin autorización.
          </p>

          <h2 className="text-lg font-black">4. Responsabilidad</h2>
          <p className="text-sm text-gray-400">
            El responsable no garantiza la ausencia de errores ni la continuidad del servicio, aunque se aplicarán
            medidas razonables para mantener su disponibilidad y seguridad.
          </p>

          <h2 className="text-lg font-black">5. Legislación y jurisdicción</h2>
          <p className="text-sm text-gray-400">
            Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los
            juzgados y tribunales de <strong>[Ciudad]</strong>, salvo norma imperativa en contrario.
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

