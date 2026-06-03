import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Mail, UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const AuthGate: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name, intent);
        alert('Your application has been received. If email confirmation is on, check your inbox.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-zinc-950 px-4 py-6 sm:items-center sm:p-0">
      <img
        src="/images/dead-vlei-sossusvlei.jpeg"
        alt="Dead Vlei and Sossusvlei dunes"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-zinc-950/20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl md:p-12 relative z-10"
      >
        <div className="text-center mb-7 sm:mb-12">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 1 }}
            className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-amber-500 border border-white/10 mb-5 shadow-2xl sm:h-24 sm:w-24 sm:rounded-[2rem] sm:mb-8"
          >
            <img
              src="/images/repo-logo.png"
              alt="Namibian Digital Language Repository logo"
              className="h-full w-full object-cover"
            />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-3 sm:mb-4 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back' : 'Join the Circle'}
          </h1>
          <p className="text-white/45 text-base sm:text-lg">
            {mode === 'login'
              ? 'Enter the digital gateway of Namibian heritage'
              : 'Apply for access to preserve our collective voice'}
          </p>
        </div>

        <div className="glass-dark rounded-[2rem] p-4 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl sm:rounded-[3rem] md:p-10">
          <div className="flex gap-2 mb-6 p-1.5 bg-black/40 rounded-[2rem] border border-white/5 sm:mb-10">
            <button
              onClick={() => setMode('login')}
              className={cn(
                "flex-1 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-500",
                mode === 'login' ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn(
                "flex-1 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-500",
                mode === 'register' ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white"
              )}
            >
              Request Access
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="reg-name"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="relative group">
                    <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-14 sm:h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base"
                      required={mode === 'register'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 sm:h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base"
                required
              />
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div
                  key="login-pass"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="relative group"
                >
                  <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="Security Key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base"
                    required
                  />
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                      Use your Supabase test account
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reg-intent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="relative group"
                >
                  <textarea
                    placeholder="State your intent... (e.g. Scholar, Researcher, Student)"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base min-h-28 sm:min-h-[140px] resize-none"
                    required={mode === 'register'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-red-500 text-center font-bold bg-red-500/10 py-3 rounded-xl border border-red-500/20"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 sm:h-16 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 group disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span className="text-lg">{mode === 'login' ? 'Enter Repository' : 'Submit Application'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-7 sm:mt-12 text-center text-white/25 text-xs px-2 sm:px-12 leading-relaxed italic">
          "Language is the soul of our nation. By entering, you pledge to handle these digital artifacts with the reverence they deserve."
        </div>
      </motion.div>
    </div>
  );
};
