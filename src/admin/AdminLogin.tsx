import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Eye, EyeOff, Loader2, ShieldAlert, AlertCircle, KeyRound, ArrowLeft } from "lucide-react";
import { login, verifyOTP, type LoginResult } from "../lib/store";

interface Props {
  onLogin: () => void;
}

const logoImg = "/logo.png";

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}min ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export function AdminLogin({ onLogin }: Props) {
  const [password, setPassword]       = useState("");
  const [otp, setOtp]                 = useState("");
  const [isOtpStep, setIsOtpStep]     = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpExpiryLeft, setOtpExpiryLeft] = useState(0);
  const [show, setShow]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [shaking, setShaking]         = useState(false);
  const [result, setResult]           = useState<LoginResult | null>(null);
  const [lockoutLeft, setLockoutLeft] = useState(0);

  useEffect(() => {
    if (!result?.locked || !result.retryAfter) return;
    setLockoutLeft(result.retryAfter);
    const interval = setInterval(() => {
      setLockoutLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); setResult(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result?.locked, result?.retryAfter]);

  useEffect(() => {
    if (!isOtpStep || otpExpiryLeft <= 0) return;
    const interval = setInterval(() => {
      setOtpExpiryLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsOtpStep(false);
          setResult({ success: false, error: "Le code de vérification a expiré. Veuillez recommencer." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOtpStep, otpExpiryLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || (result?.locked && lockoutLeft > 0)) return;

    if (!isOtpStep) {
      if (!password) return;
      setLoading(true); setResult(null);
      try {
        const res = await login(password);
        if (res.success) {
          if (res.requireOTP) {
            setMaskedEmail(res.maskedEmail || "");
            setOtpExpiryLeft(res.expiresIn || 300);
            setIsOtpStep(true);
            setOtp("");
          } else { onLogin(); }
        } else {
          setResult(res); setShaking(true);
          setTimeout(() => setShaking(false), 500);
          setPassword("");
        }
      } finally { setLoading(false); }
    } else {
      if (otp.length !== 6) return;
      setLoading(true);
      try {
        const res = await verifyOTP(otp);
        if (res.success) { onLogin(); }
        else {
          setResult(res); setShaking(true);
          setTimeout(() => setShaking(false), 500);
          if (res.locked || res.expired) {
            setIsOtpStep(false); setPassword(""); setOtp("");
          } else { setOtp(""); }
        }
      } finally { setLoading(false); }
    }
  };

  const isLocked     = result?.locked && lockoutLeft > 0;
  const attemptsLeft = result?.attemptsLeft;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        fontFamily: "'Jost', system-ui, sans-serif",
        background: "linear-gradient(135deg, #FAF8F5 0%, #F0EDE7 100%)",
      }}
    >
      <style>{`
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-jost { font-family: 'Jost', system-ui, sans-serif; }
      `}</style>

      {/* Decorative top gold bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#C59B63]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={shaking
          ? { opacity: 1, x: [-8, 8, -6, 6, -4, 4, 0] }
          : { opacity: 1, y: 0, x: 0 }
        }
        transition={{ duration: shaking ? 0.4 : 0.7 }}
        className="w-full max-w-md"
      >
        {/* Logo + title */}
        <div className="text-center mb-10">
          <img src={logoImg} alt="FLOURITTA" className="h-24 w-auto object-contain mx-auto mb-4" />
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-8 bg-[#C59B63]/40" />
            <span className="font-jost text-[10px] text-[#C59B63] tracking-[0.45em] uppercase">Espace Administration</span>
            <div className="h-px w-8 bg-[#C59B63]/40" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 shadow-[0_4px_40px_rgba(197,155,99,0.08)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-[#E5E0D8]" />
            <span className="font-jost text-[10px] text-[#706F6C] tracking-[0.4em] uppercase">
              {isOtpStep ? "Double Authentification" : "Connexion sécurisée"}
            </span>
            <div className="h-px flex-1 bg-[#E5E0D8]" />
          </div>

          {/* Blocage IP */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-jost text-red-600 text-xs font-semibold tracking-wide">Accès temporairement bloqué</p>
                  <p className="font-jost text-red-500/80 text-[11px] mt-1">
                    Trop de tentatives. Réessayez dans{" "}
                    <span className="font-mono font-bold text-red-600">{formatCountdown(lockoutLeft)}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isOtpStep ? (
              <div>
                <label className="font-jost text-[#706F6C] text-[10px] tracking-[0.3em] uppercase mb-2 block">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C59B63]/60 pointer-events-none" />
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setResult(null); }}
                    placeholder="Entrez le mot de passe"
                    disabled={!!isLocked}
                    className={`w-full bg-[#FAF8F5] border pl-10 pr-12 py-3.5 text-[#1A1A1A] placeholder-[#706F6C]/40 outline-none transition-colors duration-300 text-sm rounded-xl disabled:opacity-40 font-jost ${
                      result && !result.success && !isLocked
                        ? "border-red-400"
                        : "border-[#E5E0D8] focus:border-[#C59B63]"
                    }`}
                    autoFocus
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C59B63]/60 hover:text-[#C59B63] transition-colors"
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <AnimatePresence>
                  {result && !result.success && !isLocked && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <AlertCircle size={12} className="text-red-500 shrink-0" />
                      <p className="font-jost text-red-500 text-[11px] tracking-wider">
                        {result.error ?? "Mot de passe incorrect"}
                        {typeof attemptsLeft === "number" && attemptsLeft > 0 && (
                          <span className="text-red-400/70 ml-1">
                            ({attemptsLeft} tentative{attemptsLeft > 1 ? "s" : ""} restante{attemptsLeft > 1 ? "s" : ""})
                          </span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="font-jost text-[#706F6C] text-[10px] tracking-[0.3em] uppercase mb-1.5 block">
                    Code de vérification
                  </label>
                  <p className="font-jost text-[#706F6C] text-[11px] leading-relaxed mb-3">
                    Un code à 6 chiffres a été envoyé à <span className="text-[#C59B63] font-semibold">{maskedEmail}</span>.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[#C59B63] tracking-wider mb-4 font-jost">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C59B63] animate-pulse" />
                    Expire dans : <span className="font-mono font-bold">{formatCountdown(otpExpiryLeft)}</span>
                  </div>
                </div>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C59B63]/60 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setResult(null); }}
                    placeholder="000000"
                    disabled={loading}
                    className={`w-full bg-[#FAF8F5] border pl-10 pr-4 py-3.5 text-center tracking-[0.5em] text-lg font-mono text-[#C59B63] placeholder-[#C59B63]/20 outline-none transition-colors duration-300 rounded-xl disabled:opacity-40 ${
                      result && !result.success ? "border-red-400" : "border-[#E5E0D8] focus:border-[#C59B63]"
                    }`}
                    autoFocus
                    data-testid="otp-input"
                  />
                </div>
                <AnimatePresence>
                  {result && !result.success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <AlertCircle size={12} className="text-red-500 shrink-0" />
                      <p className="font-jost text-red-500 text-[11px] tracking-wider">{result.error ?? "Code OTP invalide"}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!isOtpStep ? !password : otp.length !== 6) || !!isLocked}
              className="w-full bg-[#C59B63] text-white py-3.5 font-jost text-[11px] tracking-[0.3em] uppercase hover:bg-[#A07840] transition-all duration-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 rounded-xl"
              data-testid="login-button"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" />Vérification…</>
              ) : isLocked ? (
                <><ShieldAlert size={14} />Bloqué — {formatCountdown(lockoutLeft)}</>
              ) : isOtpStep ? (
                "Valider le code"
              ) : (
                "Accéder au tableau de bord"
              )}
            </button>

            {isOtpStep && (
              <button
                type="button"
                onClick={() => { setIsOtpStep(false); setOtp(""); setResult(null); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-[#706F6C] hover:text-[#1A1A1A] font-jost text-[10px] tracking-[0.2em] uppercase transition-colors mt-3 disabled:opacity-40"
              >
                <ArrowLeft size={10} />
                Retour au mot de passe
              </button>
            )}

            {/* Dev bypass - localhost only */}
            {(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
              <div className="pt-4 border-t border-[#E5E0D8] mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const exp = Math.floor(Date.now() / 1000) + 43200;
                    const payload = btoa(JSON.stringify({ exp }));
                    localStorage.setItem("aviator_admin_auth", "true");
                    localStorage.setItem("aviator_admin_token", `mock.${payload}.token`);
                    localStorage.setItem("aviator_admin_token_exp", String(exp));
                    sessionStorage.setItem("aviator_admin_last_activity", String(Date.now()));
                    onLogin();
                  }}
                  className="font-jost px-4 py-2 border border-[#C59B63]/30 text-[#C59B63]/70 hover:text-[#C59B63] hover:bg-[#C59B63]/5 transition-all text-[9px] tracking-widest uppercase rounded-lg"
                >
                  ⚡ Mode Dev : Connexion Express
                </button>
              </div>
            )}
          </form>
        </div>

        <p className="text-center font-jost text-[#706F6C]/50 text-[10px] tracking-wider mt-6">
          © FLOURITTA Beauty Center — Accès restreint
        </p>
      </motion.div>
    </div>
  );
}
