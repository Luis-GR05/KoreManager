import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verificar que el usuario viene con un token válido de recuperación
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error(t('reset.errorLink'));
        navigate('/login');
      }
    });
  }, [navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (password !== confirmPassword) {
      toast.error(t('reset.errorMatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('reset.errorMinChars'));
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success(t('reset.toastSuccess'));
      
      // Cerrar sesión para que el usuario tenga que logearse con la nueva contraseña
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      toast.error(error.message || t('reset.toastError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F0F1A] p-4 relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-lime/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1A1A2E]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
        
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-brand-lime/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-brand-lime" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">{t('reset.successTitle')}</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('reset.successDesc')}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {t('reset.title')}
              </h1>
              <p className="text-gray-400 text-sm">
                {t('reset.desc')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <Input
                  icon={Lock}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('reset.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative group">
                <Input
                  icon={Lock}
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('reset.confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-12"
                />
              </div>

              <Button type="submit" variant="primary" isLoading={submitting} className="w-full mt-4">
                {t('reset.submit')}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
