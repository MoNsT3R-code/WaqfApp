import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  Smartphone,
  HelpingHand,
  Languages,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { cn } from "../lib/utils";
import { translations, Language } from "../translations";
import { Theme } from "../App";

import { Logo } from "./Logo";

interface AuthProps {
  onLogin: (user: any) => void;
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const Auth = ({ onLogin, lang, setLang, theme, setTheme }: AuthProps) => {
  const t = translations[lang];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
        const { email, token, user } = event.data;
        
        if (token && user) {
          setMessage(`Welcome back, ${user.name}. Identity synchronized.`);
          setTimeout(() => onLogin({ token, user }), 1000);
        } else {
          setMessage(`Identity linked: ${email}. Application state updated.`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[40px] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]" />
        
         <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center gap-2 p-1 bg-[var(--border)] border border-[var(--border)] rounded-xl">
            {(["en", "ur", "ar"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
                  lang === l ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--text-s)] hover:text-[var(--text-p)]"
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-1 bg-[var(--border)] border border-[var(--border)] rounded-xl">
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                  theme === t ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]" : "text-[var(--text-s)] hover:text-[var(--text-p)]"
                )}
              >
                {t === "light" && <Sun className="w-3.5 h-3.5" />}
                {t === "dark" && <Moon className="w-3.5 h-3.5" />}
                {t === "system" && <Monitor className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8 opacity-60">
          <p className="text-[var(--accent)] text-lg font-arabic italic line-clamp-2 px-4 leading-relaxed">
            {t.bismillah}
          </p>
        </div>

        <div className="mb-10">
          <Logo size="md" />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[11px]"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {message && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-[#00ffaa]/10 border border-[#00ffaa]/20 rounded-2xl flex items-center gap-3 text-[#00ffaa] text-[11px]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xs font-bold text-[var(--text-s)] uppercase tracking-[0.3em] mb-2">Secure Entry</h2>
            <p className="text-[10px] text-[var(--text-s)] opacity-60">Connect using your Gmail to access your Waqf portfolio.</p>
          </div>

          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/auth/google/url");
                const data = await res.json();
                if (res.ok) {
                  window.open(data.url, "gmail_connect", "width=500,height=600");
                } else {
                  setError(data.message || "OAuth initialization failed.");
                }
              } catch (e) {
                setError("Network security failure. Connection interrupted.");
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full py-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--border)] transition-all group shadow-sm disabled:opacity-50"
          >
            <Mail className="w-5 h-5 text-[var(--accent)] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-p)]">
              {isLoading ? "Synchronizing..." : "Connect with Gmail"}
            </span>
          </button>

          <div className="pt-8 border-t border-[var(--border)] flex items-center justify-center gap-4">
            <ShieldCheck className="w-3 h-3 text-[var(--text-s)] opacity-30" />
            <span className="text-[8px] text-[var(--text-s)] uppercase tracking-[0.5em] opacity-30">Biometric Grade Encryption</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AuthInput = ({ icon, type = "text", placeholder, value, onChange, center }: { icon: React.ReactNode; type?: string; placeholder: string; value: string; onChange: (v: string) => void; center?: boolean }) => (
  <div className="relative">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-s)] group-focus-within:text-[var(--accent)] transition-colors">
      {icon}
    </div>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-5 text-xs outline-none focus:border-[var(--accent)]/50 transition-all placeholder:text-[var(--text-s)]/30 text-[var(--text-p)] tracking-widest",
        center && "text-center pl-5 pr-5 tracking-[1em] text-xl font-light"
      )}
      placeholder={placeholder}
    />
  </div>
);
