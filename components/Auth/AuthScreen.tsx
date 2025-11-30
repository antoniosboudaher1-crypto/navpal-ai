
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { loginUser, registerUser, loginAsGuest } from '../../services/auth';
import { CLOUDFLARE_SITE_KEY } from '../../constants';
import GlassCard from '../UI/GlassCard';
import { Lock, Mail, User as UserIcon, Loader2, Navigation, UserCircle2, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // Initialize Cloudflare Turnstile with retry logic
  useEffect(() => {
    // Cleanup previous widget
    if (widgetId.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetId.current);
      } catch (e) {
        // ignore removal errors
      }
      widgetId.current = null;
    }
    setCaptchaToken(null);

    const renderWidget = () => {
      if (window.turnstile && captchaRef.current && !widgetId.current) {
        try {
          widgetId.current = window.turnstile.render(captchaRef.current, {
            sitekey: CLOUDFLARE_SITE_KEY, 
            theme: 'dark',
            callback: (token: string) => setCaptchaToken(token),
            'expired-callback': () => setCaptchaToken(null),
            'error-callback': () => {
              console.warn("Turnstile Error");
              // In development/testing with dummy keys, this might trigger.
              // We don't block UI but warn user.
            }
          });
        } catch (e) {
          console.warn("Turnstile render failed", e);
        }
      }
    };

    // Check if turnstile is ready, otherwise poll for it
    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setError('Please complete the security check');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let user;
      if (isLogin) {
        user = await loginUser(formData.email, formData.password, captchaToken);
      } else {
        user = await registerUser(formData.name, formData.email, formData.password, captchaToken);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      // Reset captcha on failure
      if (window.turnstile && widgetId.current) {
        window.turnstile.reset(widgetId.current);
        setCaptchaToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = await loginAsGuest();
      onAuthSuccess(user);
    } catch (err: any) {
      setError('Guest login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 relative overflow-hidden animate-fade-in">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
      
      <div className="relative z-10 animate-zoom-in max-h-full overflow-y-auto py-8 no-scrollbar">
        <GlassCard className="w-full max-w-md p-8 m-4 border-purple-500/20 shadow-2xl shadow-purple-900/20 backdrop-blur-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-900/40 mb-4 transform hover:scale-105 transition-transform duration-300">
              <Navigation className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">NavPal AI</h1>
            <p className="text-slate-400 mt-2">Your Luxury Intelligent Navigator</p>
          </div>

          {/* Key helps React trigger animation on switch */}
          <div key={isLogin ? 'login' : 'register'} className="animate-slide-in-right">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              {/* Turnstile Container */}
              <div className="flex justify-center py-2 min-h-[75px]">
                 <div ref={captchaRef}></div>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm animate-pulse bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-900/20 transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 ${isLoading || !captchaToken ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-4 text-center">
            <button
              onClick={() => {
                setError('');
                setCaptchaToken(null);
                setIsLogin(!isLogin);
              }}
              className="text-slate-400 hover:text-white text-sm transition-colors hover:underline underline-offset-4"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
            
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="group flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <UserCircle2 className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-medium">Continue as Guest</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthScreen;
