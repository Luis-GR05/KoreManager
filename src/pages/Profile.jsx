// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Trophy, Calendar, MapPin, TrendingUp } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/useAuth';

export default function Profile() {
  const { profile, roleName, loading, updating, updateProfile } = useProfile();
  const { user } = useAuth();

  const [formData, setFormData] = useState({ full_name: '', telefono: '' });
  const [stats, setStats] = useState({ total: 0, proximas: 0, favorita: '—' });
  const [loadingStats, setLoadingStats] = useState(true);

  // Sincronizar datos del perfil con el formulario
  useEffect(() => {
    if (profile) {
      setFormData({ full_name: profile.full_name || '', telefono: profile.telefono || '' });
    }
  }, [profile]);

  // Cargar estadísticas rápidas del usuario
  useEffect(() => {
    if (!user) return;
    const hoy = new Date().toISOString().split('T')[0];

    const fetchStats = async () => {
      const { data } = await supabase
        .from('reservas')
        .select('fecha, instalaciones ( nombre )')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });

      if (!data) { setLoadingStats(false); return; }

      const proximas = data.filter(r => r.fecha >= hoy).length;

      // Instalación más reservada
      const counts = {};
      data.forEach(r => {
        const n = r.instalaciones?.nombre;
        if (n) counts[n] = (counts[n] || 0) + 1;
      });
      const favorita = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

      setStats({ total: data.length, proximas, favorita });
      setLoadingStats(false);
    };

    fetchStats();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(formData.full_name, formData.telefono);
  };

  if (loading) return <div className="p-8 text-brand-lime animate-pulse">Cargando ficha de jugador...</div>;

  const statsCards = [
    { label: 'Partidos Totales', value: stats.total,    icon: Trophy,   color: 'text-brand-lime',   bg: 'bg-brand-lime/10' },
    { label: 'Próximos',         value: stats.proximas, icon: Calendar, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Pista Favorita',   value: stats.favorita, icon: MapPin,   color: 'text-blue-400',     bg: 'bg-blue-400/10', isText: true },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Mi Perfil</h1>
        <p className="text-gray-400 text-sm">Gestiona tus datos personales y consulta tus estadísticas.</p>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statsCards.map(({ label, value, icon: Icon, color, bg, isText }) => (
          <div key={label} className="bg-[#1A1A2E] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${bg} ${color} shrink-0`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className={`font-bold ${isText ? 'text-sm truncate' : 'text-2xl'} ${color}`}>
                {loadingStats ? '—' : value}
              </p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA — Avatar */}
        <div className="md:col-span-1">
          <div className="bg-[#1F1F2E] p-6 rounded-3xl border border-white/5 text-center relative overflow-hidden">
            {/* Glow decorativo */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-lime/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-24 h-24 bg-gradient-to-br from-brand-lime to-green-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-black mb-4 shadow-[0_0_20px_rgba(204,255,0,0.3)] relative z-10">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white relative z-10">
              {profile?.full_name || 'Usuario Sin Nombre'}
            </h2>
            <span className="inline-block mt-2 px-3 py-1 bg-brand-lime/20 text-brand-lime text-xs font-bold rounded-full tracking-wider uppercase">
              {roleName}
            </span>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <TrendingUp size={12} />
                <span>{stats.total} partidos en total</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA — Formulario */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-[#1A1A2E] p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white">Datos personales</h3>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">
                Correo Electrónico
              </label>
              <div className="flex items-center gap-3 bg-[#0F0F1A] p-4 rounded-xl border border-white/5 opacity-70">
                <Mail className="text-gray-400" size={20} />
                <span className="text-gray-300 text-sm">{profile?.email}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">
                Nombre Completo
              </label>
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