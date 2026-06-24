import { useState, useEffect, useCallback } from "react";
import {
  Scissors, Calendar, Users, LogOut, Menu, X, BarChart3, Tag,
  Settings as SettingsIcon, Clock, ShieldCheck, ImageIcon,
} from "lucide-react";
import { logout, getSessionInfo, refreshActivity, checkInactivityTimeout } from "../lib/store";
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

  useEffect(() => {
    const onActivity = () => refreshActivity();
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown",   onActivity, { passive: true });
    window.addEventListener("click",     onActivity, { passive: true });
    window.addEventListener("scroll",    onActivity, { passive: true });

    const interval = setInterval(() => {
      if (checkInactivityTimeout()) { onLogout(); return; }
      setSessionInfo(getSessionInfo());
      const info = getSessionInfo();
      if (info.tokenSecondsLeft === 0) { logout(); onLogout(); }
    }, 30_000);

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown",   onActivity);
      window.removeEventListener("click",     onActivity);
      window.removeEventListener("scroll",    onActivity);
      clearInterval(interval);
    };
  }, [onLogout]);

  useEffect(() => {
    const minuteInterval = setInterval(() => setSessionInfo(getSessionInfo()), 60_000);
    return () => clearInterval(minuteInterval);
  }, []);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard",    label: "Vue d'ensemble", icon: <BarChart3 size={16} /> },
    { id: "reservations", label: "Réservations",   icon: <Calendar size={16} /> },
    { id: "team",         label: "Équipe",          icon: <Users size={16} /> },
    { id: "pricing",      label: "Tarifs",          icon: <Tag size={16} /> },
    { id: "gallery",      label: "Galerie",         icon: <ImageIcon size={16} /> },
    { id: "settings",     label: "Paramètres",      icon: <SettingsIcon size={16} /> },
  ];

  const sessionLeft = Math.min(sessionInfo.tokenSecondsLeft ?? 3600, sessionInfo.inactiveSecondsLeft ?? 3600);
  const timerColor  = sessionLeft < 300
    ? "text-red-500"
    : sessionLeft < 900
      ? "text-amber-500"
      : "text-emerald-600";

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Jost', system-ui, sans-serif", background: "#FAF8F5" }}
    >
      <style>{`
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-jost { font-family: 'Jost', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C59B63; border-radius: 2px; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5E0D8] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:flex`}
      >
        {/* Top gold bar */}
        <div className="h-1 w-full bg-[#C59B63]" />

        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#E5E0D8] flex flex-col items-center justify-center">
          <img src={logoImg} alt="FLOURITTA" className="h-16 w-auto object-contain mb-2" />
          <div className="flex items-center gap-2">
            <div className="h-px w-5 bg-[#C59B63]/40" />
            <span className="font-jost text-[9px] text-[#C59B63] tracking-[0.4em] uppercase">Espace Admin</span>
            <div className="h-px w-5 bg-[#C59B63]/40" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="font-jost text-[#706F6C]/60 text-[9px] tracking-[0.4em] uppercase px-3 pb-3 pt-2">
            Navigation
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 text-xs tracking-wider transition-all duration-200 rounded-lg ${
                tab === item.id
                  ? "bg-[#C59B63]/10 text-[#C59B63] border-l-2 border-[#C59B63]"
                  : "text-[#706F6C] hover:text-[#1A1A1A] hover:bg-[#F0EDE7] border-l-2 border-transparent"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Session info */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl">
            <ShieldCheck size={12} className="text-[#C59B63]/60 shrink-0" />
            <div>
              <p className="font-jost text-[#706F6C]/60 text-[9px] tracking-wider uppercase">Session</p>
              <p className={`font-jost text-[10px] font-mono font-semibold ${timerColor}`}>
                {sessionLeft > 0 ? formatTime(sessionLeft) : "Expirée"}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-[#E5E0D8]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-xs tracking-wider text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E0D8] px-6 py-4 flex items-center gap-4 shadow-sm">
          <button
            className="lg:hidden text-[#706F6C] hover:text-[#1A1A1A] transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#C59B63] rounded-full" />
            <h1 className="font-jost text-[#1A1A1A] text-sm tracking-[0.15em] uppercase font-semibold">
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Session timer */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock size={11} className={timerColor} />
              <span className={`font-jost text-[10px] font-mono tracking-wider ${timerColor}`}>
                {sessionLeft > 0 ? formatTime(sessionLeft) : "Expirée"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-jost text-[#706F6C] text-[10px] tracking-wider">En ligne</span>
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
