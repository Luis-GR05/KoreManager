import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !email) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Correo de recuperación enviado');
    } catch (error) {
      toast.error(error.message || 'Error al enviar el correo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F0F1A] p-4 relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-lime/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1A1A2E]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
        <div className="flex items-center mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-brand-lime/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-brand-lime" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Revisa tu bandeja</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Hemos enviado un enlace de recuperación a <strong className="text-white">{email}</strong>. 
              Haz clic en él para establecer una nueva contraseña.
            </p>
            <Link
              to="/login"
              className="w-full inline-flex justify-center py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
            >
              Ir al Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Recuperar Contraseña
              </h1>
              <p className="text-gray-400 text-sm">
                Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                icon={Mail}
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" isLoading={submitting} className="w-full">
                Enviar enlace de recuperación
                {!submitting && <ArrowRight size={20} />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
