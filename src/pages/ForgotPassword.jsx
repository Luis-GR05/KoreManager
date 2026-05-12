import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPassword() {
  const { t } = useTranslation();
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
      toast.success(t('forgot.toastSuccess'));
    } catch (error) {
      toast.error(error.message || t('forgot.toastError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center theme-bg p-4 relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/10 dark:bg-brand-lime/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/5 dark:bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md theme-card backdrop-blur-xl border theme-border p-8 shadow-2xl relative z-10 animate-fade-in">
        <div className="flex items-center mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold theme-faint hover:theme-text transition-colors"
          >
            <ArrowLeft size={16} />
            {t('forgot.backToLogin')}
          </Link>
        </div>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-brand-purple/10 dark:bg-brand-lime/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-brand-purple dark:text-brand-lime" />
            </div>
            <h2 className="text-2xl font-black theme-text mb-3">{t('forgot.checkInbox')}</h2>
            <p className="theme-faint text-sm leading-relaxed mb-6">
              {t('forgot.sentTo')}<strong className="theme-text mx-1">{email}</strong>{t('forgot.clickToReset')}
            </p>
            <Link
              to="/login"
              className="w-full inline-flex justify-center py-4 rounded-xl theme-bg hover:bg-brand-purple/5 dark:hover:bg-white/5 theme-text font-bold transition-all border theme-border"
            >
              {t('forgot.goToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold theme-text mb-2 tracking-tight">
                {t('forgot.title')}
              </h1>
              <p className="theme-faint text-sm">
                {t('forgot.desc')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                icon={Mail}
                name="email"
                type="email"
                placeholder={t('forgot.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" isLoading={submitting} className="w-full">
                {t('forgot.submit')}
                {!submitting && <ArrowRight size={20} />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
