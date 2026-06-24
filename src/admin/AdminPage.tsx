import { useState, useEffect, useCallback } from "react";
import {
  Scissors, Calendar, Users, LogOut, Menu, X, BarChart3, Tag,
  Settings as SettingsIcon, Clock, ShieldCheck, ImageIcon,
} from "lucide-react";
import { logout, getSessionInfo, refreshActivity, checkInactivityTimeout } from "../../lib/store";
import { Reservations } from "./sections/Reservations";
import { TeamManager } from "./sections/TeamManager";
import { PricingManager } from "./sections/PricingManager";
import { Settings } from "./sections/Settings";
import { Dashboard } from "./sections/Dashboard";
import { GalleryManager } from "./sections/GalleryManager";

type Tab = "dashboard" | "reservations" | "team" | "pricing" | "gallery" | "settings";

interface Props {
  onLogout: () => void;
}

const logoImg = "/logo.png";

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

export function AdminPage({ onLogout }: Props) {
  const [tab, setTab]               = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(getSessionInfo());

  const handleLogout = useCallback(() => {
    logout();
    onLogout();
  }, [onLogout]);

  // ── Inactivité + expiration JWT ────────────────────────────────────────────
  useEffect(() => {
    // Refresh activity sur toute interaction utilisateur
    const onActivity = () => refreshActivity();
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown",   onActivity, { passive: true });
    window.addEventListener("click",     onActivity, { passive: true });
    window.addEventListener("scroll",    onActivity, { passive: true });

    // Vérification périodique toutes les 30 secondes
    const interval = setInterval(() => {
      // Auto-logout si inactif
      if (checkInactivityTimeout()) {
        onLogout();
        return;
      }
      // Mettre à jour l'affichage du timer
      setSessionInfo(getSessionInfo());

      // Auto-logout si le token JWT a expiré
      const info = getSessionInfo();
      if (info.tokenSecondsLeft === 0) {
        logout();
        onLogout();
      }
    }, 30_000);

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown",   onActivity);
      window.removeEventListener("click",     onActivity);
      window.removeEventListener("scroll",    onActivity);
      clearInterval(interval);
    };
  }, [onLogout]);

  // Mise à jour du timer toutes les minutes
  useEffect(() => {
    const minuteInterval = setInterval(() => setSessionInfo(getSessionInfo()), 60_000);
    return () => clearInterval(minuteInterval);
  }, []);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard",    label: "Vue d'ensemble", icon: <BarChart3 size={16} /> },
    { id: "reservations", label: "Réservations",   icon: <Calendar size={16} /> },
    { id: "team",         label: "Équipe",          icon: <Users size={16} /> },
    { id: "pricing",      label: "Tarifs",          icon: <Tag size={16} /> },
    { id: "settings",     label: "Paramètres",      icon: <SettingsIcon size={16} /> },
  ];

  // Couleur du timer selon le temps restant
  const sessionLeft = Math.min(sessionInfo.tokenSecondsLeft, sessionInfo.inactiveSecondsLeft);
  const timerColor  = sessionLeft < 300
    ? "text-red-400"
    : sessionLeft < 900
      ? "text-amber-400"
      : "text-emerald-400/70";

  return (
    <div className="min-h-screen bg-[#060b07] flex" style={{ fontFamily: "Raleway, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#040809] border-r border-[#D4AF37]/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="p-7 border-b border-[#D4AF37]/10 flex flex-col items-center justify-center">
          <img src={logoImg} alt="AVIATOR" className="h-20 w-auto object-contain mb-2" />
          <div className="text-[#D4AF37]/50 text-[9px] tracking-[0.4em] uppercase">Espace Admin</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[#f0ebe0]/25 text-[9px] tracking-[0.4em] uppercase px-3 pb-3 pt-2">
            Navigation
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 text-xs tracking-wider transition-all duration-200 ${
                tab === item.id
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]"
                  : "text-[#f0ebe0]/50 hover:text-[#f0ebe0]/80 hover:bg-[#D4AF37]/5 border-l-2 border-transparent"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Session info */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/5 border border-[#D4AF37]/10">
            <ShieldCheck size={12} className="text-[#D4AF37]/40 shrink-0" />
            <div>
              <p className="text-[#f0ebe0]/30 text-[9px] tracking-wider uppercase">Session</p>
              <p className={`text-[10px] font-mono font-semibold ${timerColor}`}>
                {sessionLeft > 0 ? formatTime(sessionLeft) : "Expirée"}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-[#D4AF37]/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-xs tracking-wider text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-[#040809] border-b border-[#D4AF37]/10 px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#D4AF37]/60" />
            <h1
              className="text-[#f0ebe0]/80 text-sm tracking-[0.2em] uppercase"
              style={{ fontFamily: "Raleway, sans-serif", fontWeight: 600 }}
            >
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Timer session (header) */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock size={11} className={timerColor} />
              <span className={`text-[10px] font-mono tracking-wider ${timerColor}`}>
                {sessionLeft > 0 ? formatTime(sessionLeft) : "Expirée"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#f0ebe0]/30 text-[10px] tracking-wider">En ligne</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === "dashboard"    && <Dashboard />}
          {tab === "reservations" && <Reservations />}
          {tab === "team"         && <TeamManager />}
          {tab === "pricing"      && <PricingManager />}
          {tab === "gallery"      && <GalleryManager />}
          {tab === "settings"     && <Settings />}
        </main>
      </div>
    </div>
  );
}
