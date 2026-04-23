import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';
import { KeyRound, Mail, UserPlus, Fingerprint, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthGateProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (data: { name: string; email: string; intent: string }) => Promise<void>;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLogin, onRegister }) => {
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
        await onLogin(email, password);
      } else {
        await onRegister({ name, email, intent });
        alert('Traditional Welcome: Your request to join the Namibia Repo has been sent. An elder (administrator) will review your application shortly.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'The spirits of the connection are restless. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 -left-20 w-[500px] h-[500px] bg-amber-500/20 blur-[150px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-red-600/20 blur-[150px] rounded-full pointer-events-none" 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl p-6 md:p-12 relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 1 }}
            className="inline-flex p-5 rounded-[2rem] bg-white/5 border border-white/10 mb-8 shadow-2xl"
          >
            <Fingerprint size={56} className="text-amber-500" />
          </motion.div>
          <h1 className="text-5xl font-display font-bold tracking-tight mb-4 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back' : 'Join the Circle'}
          </h1>
          <p className="text-white/40 text-lg flex items-center justify-center gap-2">
            {mode === 'login' 
              ? 'Enter the digital gateway of Namibian heritage' 
              : 'Apply for access to preserve our collective voice'}
          </p>
        </div>

        <div className="glass-dark rounded-[3rem] p-4 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
          <div className="flex gap-2 mb-10 p-1.5 bg-black/40 rounded-[2rem] border border-white/5">
            <button
              id="btn-switch-login"
              onClick={() => setMode('login')}
              className={cn(
                "flex-1 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-500",
                mode === 'login' ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white"
              )}
            >
              Sign In
            </button>
            <button
              id="btn-switch-register"
              onClick={() => setMode('register')}
              className={cn(
                "flex-1 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-500",
                mode === 'register' ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white"
              )}
            >
              Request Access
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                      id="input-name"
                      type="text"
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input
                id="input-email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base"
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
                    id="input-password"
                    type="password"
                    placeholder="Security Key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base"
                    required
                  />
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                      Admin: admin@namibia.org / namibia2026<br />
                      User: scholar@edu.na / (any key)
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
                    id="input-intent"
                    placeholder="State your intent... (e.g. Scholar, Researcher, Student, Heir)"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10 transition-all text-base min-h-[140px] resize-none"
                    required
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
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 group disabled:opacity-50 active:scale-[0.98]"
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

        <div className="mt-12 text-center text-white/20 text-xs px-12 leading-relaxed italic">
          "Language is the soul of our nation. By entering, you pledge to handle these digital artifacts with the reverence they deserve."
        </div>
      </motion.div>
    </div>
  );
};
