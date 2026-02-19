// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useProfile } from '../hooks/useProfile'; // <-- Importamos nuestro Hook

export default function Profile() {
  // 1. Consumimos toda la lógica con una sola línea
  const { profile, roleName, loading, updating, updateProfile } = useProfile();

  // 2. Estados locales solo para el formulario
  const [formData, setFormData] = useState({ full_name: '', telefono: '' });

  // Sincronizamos los datos cuando el hook termina de cargar
  useEffect(() => {
    if (profile) {
      setFormData({ full_name: profile.full_name || '', telefono: profile.telefono || '' });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(formData.full_name, formData.telefono);
  };

  if (loading) return <div className="p-8 text-brand-lime animate-pulse">Cargando ficha de jugador...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
      <p className="text-gray-400 mb-8">Gestiona tus datos personales y estadísticas.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA */}
        <div className="md:col-span-1">
          <div className="bg-dark-elevated p-6 rounded-3xl border border-white/5 text-center relative overflow-hidden">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-lime to-green-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-black mb-4 shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{profile?.full_name || "Usuario Sin Nombre"}</h2>
            <span className="inline-block mt-2 px-3 py-1 bg-brand-lime/20 text-brand-lime text-xs font-bold rounded-full tracking-wider">
              {roleName}
            </span>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-dark-surface p-8 rounded-3xl border border-white/5 space-y-6">

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Correo Electrónico</label>
              <div className="flex items-center gap-3 bg-dark-base p-4 rounded-xl border border-white/5 opacity-70">
                <Mail className="text-gray-400" size={20} />
                <span className="text-gray-300">{profile?.email}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Nombre Completo</label>
              <Input
                icon={User}
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Tu nombre real"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Teléfono</label>
              <Input
                icon={Phone}
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>

            <Button type="submit" variant="primary" isLoading={updating} className="w-full">
              {!updating && <Save size={20} />}
              {updating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}