import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (userData: { name: string; dept: string; role: string }) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSpanish = i18n.language === 'es';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('login.error_empty'));
      return;
    }

    setError('');
    setLoading(true);

    // Simulate login delay
    setTimeout(() => {
      setLoading(false);
      onLogin({
        name: t('user.default_name'),
        dept: t('user.default_dept'),
        role: t('user.default_role'),
      });
    }, 1500);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(isSpanish ? 'en' : 'es');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-y-auto"
      style={{
        background: 'radial-gradient(circle at top right, var(--gv-sidebar), var(--gv-bg))',
        zIndex: 1000
      }}>

      {/* Accent Background Glows */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: 'var(--gv-primary)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]" style={{ background: 'var(--gv-accent)' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[460px] relative z-10"
      >
        <div className="glass-card p-10 md:p-12 shadow-[var(--gv-shadow-lg)] flex flex-col gap-10">
          {/* Header */}
          <div style={{ paddingLeft: 10, paddingRight: 10, paddingTop: 20 }} className="flex flex-col items-center text-center">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', marginBottom: 16 }}
            >
              <img src="/apg.png" width={56} height={56} alt="Logo" className="object-contain" />
            </motion.div>
            <h1 className="text-3xl font-black text-[var(--gv-text-heading)] tracking-tight mb-2 uppercase">
              {t('login.title')}
            </h1>
            <p className="text-base text-[var(--gv-text-muted)] font-semibold opacity-80">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-8 p-10" style={{ paddingLeft: 20, paddingRight: 20 }}>
            <div className="flex flex-col gap-6">
              {/* Email Input */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gv-text-muted)] px-1">
                  {t('login.email_label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-14 pr-12 flex items-center pointer-events-none text-[var(--gv-text-muted)]">
                    {/* Fixed absolute container for icons to avoid layout shift */}
                  </div>
                  {/* <Mail className="absolute left-[-10px] top-1/2 -translate-y-1/2 text-[var(--gv-text-muted)]" size={20} /> */}
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 8);
                      setEmail(val);
                    }}
                    style={{
                      padding: 10
                    }}
                    className="w-full bg-[var(--gv-surface-alt)] border border-[var(--gv-border)] rounded-lg py-4.5 pl-12 pr-4 text-[var(--gv-text-heading)] font-bold focus:ring-2 focus:ring-[var(--gv-primary)] focus:border-transparent outline-none transition-all shadow-sm text-base placeholder:text-slate-500"
                    placeholder="3419"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gv-text-muted)]">
                    {t('login.password_label')}
                  </label>
                  <button type="button" className="text-[11px] text-[var(--gv-primary)] font-black hover:underline tracking-tight">
                    {t('login.forgot_password')}
                  </button>
                </div>
                <div className="relative">
                  {/* <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gv-text-muted)]" size={20} /> */}
                  <input
                    type="password"
                    required
                    value={password}
                    style={{
                      padding: 10
                    }}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--gv-surface-alt)] border border-[var(--gv-border)] rounded-lg py-4.5 pl-12 pr-4 text-[var(--gv-text-heading)] font-bold focus:ring-2 focus:ring-[var(--gv-primary)] focus:border-transparent outline-none transition-all shadow-sm text-base placeholder:text-slate-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-3 px-1">
                <input type="checkbox" id="remember" className="w-5 h-5 rounded border-[var(--gv-border)] text-[var(--gv-primary)] focus:ring-[var(--gv-primary)] cursor-pointer" />
                <label htmlFor="remember" className="text-sm font-bold text-[var(--gv-text)] cursor-pointer select-none">
                  {t('login.remember_me')}
                </label>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 flex items-center gap-3 text-sm font-bold shadow-sm"
                >
                  <AlertCircle size={20} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-[50px] py-5 rounded-lg font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
              style={{ background: 'linear-gradient(135deg, var(--gv-primary), var(--gv-primary-hover))' }}
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span className="tracking-wide uppercase">{t('login.btn_logging_in')}</span>
                </>
              ) : (
                <>
                  <LogIn size={24} className="group-hover:translate-x-1 transition-transform" />
                  <span className="tracking-widest uppercase text-lg">{t('login.btn_login')}</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Language Switcher on Login */}
          <div style={{ padding: 8 }} className="mt-8 pt-6 border-t border-[var(--gv-border)] flex items-center justify-between">
            <span className="text-xs text-[var(--gv-text-muted)] font-medium italic">
              {t('login.footer_text')}
            </span>
            <button
              onClick={toggleLanguage}
              style={{ padding: 8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--gv-surface-alt)] border border-[var(--gv-border)] text-sm font-bold text-[var(--gv-text)] hover:border-[var(--gv-primary)] transition-colors"
            >
              <span className="text-lg leading-none">{isSpanish ? '🇲🇽' : '🇺🇸'}</span>
              <span className="text-[10px] uppercase opacity-70">{isSpanish ? 'ES' : 'EN'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
