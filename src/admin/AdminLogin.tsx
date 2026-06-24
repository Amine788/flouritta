import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Eye, EyeOff, Loader2, ShieldAlert, AlertCircle, KeyRound, ArrowLeft } from "lucide-react";
import { login, verifyOTP, type LoginResult } from "../../lib/store";

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

  // Countdown quand l'IP est bloquée
  useEffect(() => {
    if (!result?.locked || !result.retryAfter) return;
    setLockoutLeft(result.retryAfter);
    const interval = setInterval(() => {
      setLockoutLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResult(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result?.locked, result?.retryAfter]);

  // Countdown pour l'expiration du code OTP
  useEffect(() => {
    if (!isOtpStep || otpExpiryLeft <= 0) return;
    const interval = setInterval(() => {
      setOtpExpiryLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsOtpStep(false);
          setResult({
            success: false,
            error: "Le code de vérification a expiré. Veuillez recommencer.",
          });
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
      // Étape 1 : Validation du mot de passe
      if (!password) return;
      setLoading(true);
      setResult(null);
      try {
        const res = await login(password);
        if (res.success) {
          if (res.requireOTP) {
            setMaskedEmail(res.maskedEmail || "");
            setOtpExpiryLeft(res.expiresIn || 300);
            setIsOtpStep(true);
            setOtp("");
          } else {
            onLogin();
          }
        } else {
          setResult(res);
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
          setPassword("");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Étape 2 : Validation du code OTP
      if (otp.length !== 6) return;
      setLoading(true);
      try {
        const res = await verifyOTP(otp);
        if (res.success) {
          onLogin();
        } else {
          setResult(res);
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
          if (res.locked || res.expired) {
            // Code expiré ou bloqué par trop de tentatives -> retour
            setIsOtpStep(false);
            setPassword("");
            setOtp("");
          } else {
            // Juste code faux, on reste sur l'étape mais on vide le champ
            setOtp("");
          }
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const isLocked     = result?.locked && lockoutLeft > 0;
  const attemptsLeft = result?.attemptsLeft;

  return (
    <div
      className="min-h-screen bg-[#060b07] flex items-center justify-center px-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, #014421/20 0%, transparent 60%)" }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 60px), repeating-linear-gradient(90deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 60px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={shaking
          ? { opacity: 1, x: [-8, 8, -6, 6, -4, 4, 0] }
          : { opacity: 1, y: 0, x: 0 }
        }
        transition={{ duration: shaking ? 0.4 : 0.7 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <img src={logoImg} alt="AVIATOR" className="h-32 w-auto object-contain mx-auto mb-2" />
          <div
            className="text-[#D4AF37]/60 text-[10px] tracking-[0.45em] uppercase"
            style={{ fontFamily: "Raleway, sans-serif" }}
          >
            Espace Admin
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0a110a] border border-[#D4AF37]/12 p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-[#D4AF37]/15" />
            <span
              className="text-[#D4AF37]/55 text-[10px] tracking-[0.4em] uppercase"
              style={{ fontFamily: "Raleway, sans-serif" }}
            >
              {isOtpStep ? "Double Authentification" : "Connexion sécurisée"}
            </span>
            <div className="h-px flex-1 bg-[#D4AF37]/15" />
          </div>

          {/* Alerte blocage IP */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-4 bg-red-950/40 border border-red-500/30 flex items-start gap-3"
              >
                <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div style={{ fontFamily: "Raleway, sans-serif" }}>
                  <p className="text-red-400 text-xs tracking-wide font-semibold">Accès temporairement bloqué</p>
                  <p className="text-red-400/70 text-[11px] mt-1">
                    Trop de tentatives. Réessayez dans{" "}
                    <span className="font-mono font-bold text-red-400">{formatCountdown(lockoutLeft)}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isOtpStep ? (
              // ─── ÉTAPE 1 : MOT DE PASSE ───
              <div>
                <label
                  className="text-[#D4AF37]/55 text-[10px] tracking-[0.3em] uppercase mb-2 block"
                  style={{ fontFamily: "Raleway, sans-serif" }}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 pointer-events-none" />
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setResult(null); }}
                    placeholder="Entrez le mot de passe"
                    disabled={!!isLocked}
                    className={`w-full bg-[#040809] border pl-10 pr-12 py-4 text-[#f0ebe0] placeholder-[#f0ebe0]/20 outline-none transition-colors duration-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                      result && !result.success && !isLocked
                        ? "border-red-500/60"
                        : "border-[#D4AF37]/14 focus:border-[#D4AF37]/45"
                    }`}
                    style={{ fontFamily: "Raleway, sans-serif" }}
                    autoFocus
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 hover:text-[#D4AF37]/70 transition-colors"
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Message d'erreur avec tentatives restantes */}
                <AnimatePresence>
                  {result && !result.success && !isLocked && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 flex items-center gap-2"
                      role="alert"
                    >
                      <AlertCircle size={12} className="text-red-400/80 shrink-0" />
                      <p
                        className="text-red-400/80 text-[11px] tracking-wider"
                        style={{ fontFamily: "Raleway, sans-serif" }}
                      >
                        {result.error ?? "Mot de passe incorrect"}
                        {typeof attemptsLeft === "number" && attemptsLeft > 0 && (
                          <span className="text-red-400/50 ml-1">
                            ({attemptsLeft} tentative{attemptsLeft > 1 ? "s" : ""} restante{attemptsLeft > 1 ? "s" : ""})
                          </span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // ─── ÉTAPE 2 : CODE OTP ───
              <div>
                <div className="mb-4">
                  <label
                    className="text-[#D4AF37]/55 text-[10px] tracking-[0.3em] uppercase mb-1.5 block"
                    style={{ fontFamily: "Raleway, sans-serif" }}
                  >
                    Code de vérification
                  </label>
                  <p className="text-[#f0ebe0]/60 text-[11px] leading-relaxed mb-3" style={{ fontFamily: "Raleway, sans-serif" }}>
                    Un code de sécurité à 6 chiffres a été envoyé à l'adresse <span className="text-[#D4AF37] font-semibold">{maskedEmail}</span>.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[#D4AF37]/60 tracking-wider mb-4" style={{ fontFamily: "Raleway, sans-serif" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    Le code expire dans : <span className="font-mono font-bold text-[#D4AF37]">{formatCountdown(otpExpiryLeft)}</span>
                  </div>
                </div>

                <div className="relative">
                  <KeyRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOtp(val);
                      setResult(null);
                    }}
                    placeholder="000000"
                    disabled={loading}
                    className={`w-full bg-[#040809] border pl-10 pr-4 py-4 text-center tracking-[0.5em] text-lg font-mono text-[#D4AF37] placeholder-[#D4AF37]/15 outline-none transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                      result && !result.success
                        ? "border-red-500/60"
                        : "border-[#D4AF37]/14 focus:border-[#D4AF37]/45"
                    }`}
                    autoFocus
                    data-testid="otp-input"
                  />
                </div>

                {/* Message d'erreur pour l'OTP */}
                <AnimatePresence>
                  {result && !result.success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 flex items-center gap-2"
                      role="alert"
                    >
                      <AlertCircle size={12} className="text-red-400/80 shrink-0" />
                      <p
                        className="text-red-400/80 text-[11px] tracking-wider"
                        style={{ fontFamily: "Raleway, sans-serif" }}
                      >
                        {result.error ?? "Code OTP invalide"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading || (!isOtpStep ? !password : otp.length !== 6) || !!isLocked}
              className="w-full bg-[#D4AF37] text-[#040809] py-4 text-[10px] tracking-[0.35em] uppercase hover:bg-[#c9a632] transition-all duration-300 hover:shadow-xl hover:shadow-[#D4AF37]/20 mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ fontFamily: "Raleway, sans-serif", fontWeight: 700 }}
              data-testid="login-button"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Vérification…
                </>
              ) : isLocked ? (
                <>
                  <ShieldAlert size={14} />
                  Bloqué — {formatCountdown(lockoutLeft)}
                </>
              ) : isOtpStep ? (
                "Valider le code"
              ) : (
                "Accéder au tableau de bord"
              )}
            </button>

            {/* Bouton de retour */}
            {isOtpStep && (
              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setOtp("");
                  setResult(null);
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-[#D4AF37]/50 hover:text-[#D4AF37]/80 text-[9px] tracking-[0.2em] uppercase transition-colors text-center mt-3 disabled:opacity-40"
                style={{ fontFamily: "Raleway, sans-serif" }}
              >
                <ArrowLeft size={10} />
                Retour au mot de passe
              </button>
            )}

            {/* Dev Bypass (visible uniquement sur localhost) */}
            {(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
              <div className="pt-4 border-t border-[#D4AF37]/10 mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const exp = Math.floor(Date.now() / 1000) + 43200;
                    const payload = btoa(JSON.stringify({ exp }));
                    const mockToken = `mock.${payload}.token`;
                    
                    localStorage.setItem("aviator_admin_auth", "true");
                    localStorage.setItem("aviator_admin_token", mockToken);
                    localStorage.setItem("aviator_admin_token_exp", String(exp));
                    sessionStorage.setItem("aviator_admin_last_activity", String(Date.now()));
                    
                    // Ajouter des données de test si elles n'existent pas
                    const currentReservations = localStorage.getItem("aviator_reservations");
                    if (!currentReservations || JSON.parse(currentReservations).length === 0) {
                      const testReservations = [
                        {
                          id: "res_1",
                          submittedAt: new Date().toISOString(),
                          name: "Amine El Amrani",
                          phone: "0612345678",
                          date: new Date().toISOString().split('T')[0],
                          time: "14:30",
                          barberId: "1",
                          services: [
                            { id: "s1", name: "Coupe Classique", price: 150 },
                            { id: "s2", name: "Barbe Traditionnelle", price: 100 }
                          ],
                          status: "Confirmé"
                        },
                        {
                          id: "res_2",
                          submittedAt: new Date(Date.now() - 3600000).toISOString(),
                          name: "Yassine Benjelloun",
                          phone: "0687654321",
                          date: new Date().toISOString().split('T')[0],
                          time: "16:00",
                          barberId: "2",
                          services: [
                            { id: "s3", name: "Soin Visage Premium", price: 200 },
                            { id: "s1", name: "Coupe Classique", price: 150 },
                            { id: "s4", name: "Coloration", price: 300 }
                          ],
                          status: "En attente"
                        }
                      ];
                      localStorage.setItem("aviator_reservations", JSON.stringify(testReservations));
                    }
                    
                    onLogin();
                  }}
                  className="px-4 py-2 border border-[#D4AF37]/30 text-[#D4AF37]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all text-[9px] tracking-widest uppercase font-semibold"
                  style={{ fontFamily: "Raleway, sans-serif" }}
                >
                  ⚡ Mode Dev : Connexion Express
                </button>
              </div>
            )}
          </form>
        </div>

        <p
          className="text-center text-[#f0ebe0]/20 text-[10px] tracking-wider mt-6"
          style={{ fontFamily: "Raleway, sans-serif" }}
        >
          © AVIATOR Barber Shop — Accès restreint
        </p>
      </motion.div>
    </div>
  );
}
