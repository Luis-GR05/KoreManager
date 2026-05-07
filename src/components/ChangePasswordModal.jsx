import { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import Input from './ui/Input';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setIsSuccess(true);
      toast.success('Contraseña actualizada correctamente');
      
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setPassword('');
        setConfirmPassword('');
      }, 2000);

    } catch (error) {
      toast.error(error.message || 'Error al actualizar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-brand-lime/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8 text-brand-lime" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¡Contraseña Guardada!</h3>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-2">Cambiar Contraseña</h3>
            <p className="text-gray-400 text-sm mb-6">
              Introduce tu nueva contraseña segura. La sesión actual se mantendrá abierta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <Input
                  icon={Lock}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
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
                  placeholder="Repetir contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-12"
                />
              </div>

              <Button type="submit" variant="primary" isLoading={submitting} className="w-full mt-2">
                Guardar Contraseña
              </Button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
