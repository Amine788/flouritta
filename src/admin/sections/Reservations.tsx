import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Clock, User, Phone, Scissors,
  Trash2, CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2,
  Search, Filter, X, ChevronDown, Award
} from "lucide-react";
import {
  getReservations,
  updateReservationStatus,
  deleteReservation,
  getBarbers,
  getPricing,
  type Reservation,
} from "../../../lib/store";

const STATUS_CONFIG = {
  "En attente": {
    styles: "text-amber-400 bg-amber-400/8 border border-amber-400/20",
    dot: "bg-amber-400",
  },
  "Confirmé": {
    styles: "text-emerald-400 bg-emerald-400/8 border border-emerald-400/20",
    dot: "bg-emerald-400",
  },
  "Annulé": {
    styles: "text-red-400 bg-red-400/8 border border-red-500/20",
    dot: "bg-red-400",
  },
  "Servi": {
    styles: "text-[#D4AF37] bg-[#D4AF37]/8 border border-[#D4AF37]/20",
    dot: "bg-[#D4AF37]",
  },
};

type DateFilter = "Tous" | "Aujourd'hui" | "Cette semaine" | "Ce mois" | "Custom";

function formatReadableDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Reservation["status"] | "Tous">("Tous");
  const [dateFilter, setDateFilter] = useState<DateFilter>("Tous");
  const [customDate, setCustomDate] = useState("");
  const [serviceFilter, setServiceFilter] = useState("Tous");
  const [barberFilter, setBarberFilter] = useState("Tous");

  // Options lists
  const [barbers, setBarbers] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReservations();
      setReservations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { 
    refresh();
    // Fetch options
    Promise.all([getBarbers(), getPricing()]).then(([bData, pData]) => {
      setBarbers(bData.map(b => b.name).filter(Boolean));
      const sNames = pData.flatMap(cat => cat.items.map(i => i.name));
      setServices([...new Set(sNames)]);
    });
  }, [refresh]);

  // Polling
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleStatus = async (id: string, status: Reservation["status"]) => {
    await updateReservationStatus(id, status);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteReservation(id);
      setDeleteConfirm(null);
      refresh();
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("Tous");
    setDateFilter("Tous");
    setCustomDate("");
    setServiceFilter("Tous");
    setBarberFilter("Tous");
  };

  // Filter Logic
  const filtered = useMemo(() => {
    return reservations.filter((res) => {
      // 1. Search (Name or Phone)
      const searchMatch = !search || 
        res.name.toLowerCase().includes(search.toLowerCase()) ||
        res.phone.includes(search);
      
      // 2. Status
      const statusMatch = statusFilter === "Tous" || res.status === statusFilter;

      // 3. Service
      const serviceMatch = serviceFilter === "Tous" || (res.services ?? []).some(s => s.name === serviceFilter);

      // 4. Barber
      const barberMatch = barberFilter === "Tous" || res.barber === barberFilter;

      // 5. Date
      let dateMatch = true;
      if (dateFilter !== "Tous") {
        const resDate = new Date(res.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === "Aujourd'hui") {
          dateMatch = res.date === today.toISOString().split("T")[0];
        } else if (dateFilter === "Cette semaine") {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          dateMatch = resDate >= weekAgo;
        } else if (dateFilter === "Ce mois") {
          dateMatch = resDate.getMonth() === today.getMonth() && resDate.getFullYear() === today.getFullYear();
        } else if (dateFilter === "Custom" && customDate) {
          dateMatch = res.date === customDate;
        }
      }

      return searchMatch && statusMatch && serviceMatch && barberMatch && dateMatch;
    });
  }, [reservations, search, statusFilter, dateFilter, customDate, serviceFilter, barberFilter]);

  const counts = {
    Tous:         reservations.length,
    "En attente": reservations.filter((r) => r.status === "En attente").length,
    "Confirmé":   reservations.filter((r) => r.status === "Confirmé").length,
    "Annulé":     reservations.filter((r) => r.status === "Annulé").length,
    "Servi":      reservations.filter((r) => r.status === "Servi").length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-[#f0ebe0] text-xl"
            style={{ fontFamily: "Playfair Display, serif", fontWeight: 700 }}
          >
            Gestion des Réservations
          </h2>
          <p className="text-[#f0ebe0]/40 text-xs tracking-wider mt-1 uppercase">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
            <span className="mx-2">/</span>
            {reservations.length} au total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 border border-[#f0ebe0]/10 text-[#f0ebe0]/40 hover:text-[#f0ebe0] px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all"
          >
            <X size={12} /> Reset
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/20 px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Quick Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["Tous", "En attente", "Confirmé", "Annulé", "Servi"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`p-4 border text-left transition-all relative overflow-hidden group ${
              statusFilter === s
                ? "border-[#D4AF37]/45 bg-[#D4AF37]/5 shadow-lg shadow-[#D4AF37]/5"
                : "border-[#D4AF37]/10 bg-[#0a110a] hover:border-[#D4AF37]/25"
            }`}
          >
            <div
              className="text-[#D4AF37] text-2xl"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 700 }}
            >
              {counts[s]}
            </div>
            <div className="text-[#f0ebe0]/40 text-[9px] tracking-[0.2em] uppercase mt-1">
              {s}
            </div>
            {statusFilter === s && (
              <motion.div layoutId="stat-active" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]" />
            )}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0a110a] border border-[#D4AF37]/10 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40" size={14} />
            <input
              type="text"
              placeholder="Nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#050805] border border-[#D4AF37]/10 text-[#f0ebe0] pl-10 pr-4 py-2.5 text-xs focus:border-[#D4AF37]/40 outline-none transition-all placeholder:text-[#f0ebe0]/20"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40" size={14} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full bg-[#050805] border border-[#D4AF37]/10 text-[#f0ebe0] pl-10 pr-4 py-2.5 text-xs focus:border-[#D4AF37]/40 outline-none appearance-none cursor-pointer"
            >
              <option value="Tous">Toutes les dates</option>
              <option value="Aujourd'hui">Aujourd'hui</option>
              <option value="Cette semaine">7 derniers jours</option>
              <option value="Ce mois">Ce mois-ci</option>
              <option value="Custom">Date précise...</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 pointer-events-none" size={12} />
          </div>

          {/* Custom Date Input */}
          {dateFilter === "Custom" && (
            <div className="relative">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full bg-[#050805] border border-[#D4AF37]/10 text-[#f0ebe0] px-4 py-2.5 text-xs focus:border-[#D4AF37]/40 outline-none transition-all [color-scheme:dark]"
              />
            </div>
          )}

          {/* Service Filter */}
          <div className="relative">
            <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40" size={14} />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full bg-[#050805] border border-[#D4AF37]/10 text-[#f0ebe0] pl-10 pr-4 py-2.5 text-xs focus:border-[#D4AF37]/40 outline-none appearance-none cursor-pointer"
            >
              <option value="Tous">Tous les services</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 pointer-events-none" size={12} />
          </div>

          {/* Barber Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40" size={14} />
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="w-full bg-[#050805] border border-[#D4AF37]/10 text-[#f0ebe0] pl-10 pr-4 py-2.5 text-xs focus:border-[#D4AF37]/40 outline-none appearance-none cursor-pointer"
            >
              <option value="Tous">Tous les barbiers</option>
              {barbers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 pointer-events-none" size={12} />
          </div>
        </div>
      </div>

      {/* Main Content List / Table */}
      {loading && filtered.length === 0 ? (
        <div className="border border-[#D4AF37]/10 bg-[#0a110a] p-16 text-center">
          <Loader2 size={32} className="text-[#D4AF37]/30 mx-auto mb-4 animate-spin" />
          <p className="text-[#f0ebe0]/30 text-sm tracking-wider uppercase">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#D4AF37]/10 bg-[#0a110a] p-16 text-center">
          <Filter size={32} className="text-[#D4AF37]/20 mx-auto mb-4" />
          <p className="text-[#f0ebe0]/30 text-sm tracking-wider uppercase">
            Aucune réservation ne correspond à vos filtres
          </p>
          <button onClick={resetFilters} className="mt-4 text-[#D4AF37] text-[10px] tracking-widest uppercase hover:underline">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-[#0a110a] border border-[#D4AF37]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#D4AF37]/15 bg-[#050805]/50 text-[#D4AF37] text-[10px] tracking-[0.2em] uppercase">
                    <th className="py-4.5 px-6 font-semibold">Date & Heure</th>
                    <th className="py-4.5 px-6 font-semibold">Client</th>
                    <th className="py-4.5 px-6 font-semibold">Prestations</th>
                    <th className="py-4.5 px-6 font-semibold">Barbier</th>
                    <th className="py-4.5 px-6 font-semibold">Total</th>
                    <th className="py-4.5 px-6 font-semibold">Statut</th>
                    <th className="py-4.5 px-6 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/8">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((res) => {
                      const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG["En attente"];
                      const totalPrice = (res.services ?? []).reduce((sum, s) => sum + (s.price || 0), 0);

                      return (
                        <motion.tr
                          key={res.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-[#D4AF37]/2 transition-colors duration-250 align-middle"
                        >
                          {/* Date & Time */}
                          <td className="py-5 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#D4AF37]/8 border border-[#D4AF37]/12 text-[#D4AF37]">
                                <Clock size={15} />
                              </div>
                              <div>
                                <div className="text-[#D4AF37] font-bold text-sm tracking-wide">{res.time}</div>
                                <div className="text-[#f0ebe0]/55 text-xs mt-0.5">{formatReadableDate(res.date)}</div>
                              </div>
                            </div>
                          </td>

                          {/* Client */}
                          <td className="py-5 px-6">
                            <div>
                              <div className="text-[#f0ebe0] font-semibold text-sm tracking-wide">{res.name}</div>
                              <div className="flex items-center gap-1 text-[#f0ebe0]/40 text-xs mt-0.5 font-mono">
                                <Phone size={10} className="shrink-0" />
                                <span>{res.phone}</span>
                              </div>
                            </div>
                          </td>

                          {/* Prestations */}
                          <td className="py-5 px-6 max-w-xs lg:max-w-sm">
                            <div className="flex flex-wrap gap-1.5">
                              {(res.services ?? []).length > 0 ? (
                                (res.services ?? []).map((s, i) => (
                                  <span
                                    key={i}
                                    className="inline-block bg-[#D4AF37]/8 border border-[#D4AF37]/18 text-[#D4AF37] text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-sm"
                                  >
                                    {s.name} ({s.price} DH)
                                  </span>
                                ))
                              ) : (
                                <span className="text-[#f0ebe0]/30 text-xs">—</span>
                              )}
                            </div>
                          </td>

                          {/* Barbier */}
                          <td className="py-5 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[#f0ebe0]/80 text-xs">
                              <Award size={12} className="text-[#D4AF37]/60" />
                              <span>{res.barber || "Non assigné"}</span>
                            </div>
                          </td>

                          {/* Total Price */}
                          <td className="py-5 px-6 whitespace-nowrap">
                            <div className="text-[#D4AF37] font-bold font-mono text-sm">
                              {totalPrice} DH
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-5 px-6 whitespace-nowrap">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${cfg.styles}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {res.status}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-5 px-6 text-right whitespace-nowrap">
                            <div className="inline-flex gap-1.5 items-center justify-end">
                              {res.status === "Confirmé" && (
                                <button
                                  onClick={() => handleStatus(res.id, "Servi")}
                                  title="Marquer comme servi (Terminé)"
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-[9px] font-bold tracking-widest uppercase rounded-sm"
                                >
                                  <CheckCircle size={11} /> Terminer
                                </button>
                              )}
                              {res.status !== "Confirmé" && res.status !== "Servi" && (
                                <button
                                  onClick={() => handleStatus(res.id, "Confirmé")}
                                  title="Confirmer la réservation"
                                  className="p-1.5 border border-emerald-500/20 text-emerald-500/60 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all rounded-sm"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {res.status !== "Annulé" && res.status !== "Servi" && (
                                <button
                                  onClick={() => handleStatus(res.id, "Annulé")}
                                  title="Annuler la réservation"
                                  className="p-1.5 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                              {res.status !== "En attente" && (
                                <button
                                  onClick={() => handleStatus(res.id, "En attente")}
                                  title="Remettre en attente"
                                  className="p-1.5 border border-amber-500/20 text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10 transition-all rounded-sm"
                                >
                                  <AlertCircle size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(res.id)}
                                title="Supprimer définitivement"
                                className={`p-1.5 border transition-all rounded-sm ${
                                  deleteConfirm === res.id
                                    ? "bg-red-500 border-red-500 text-white"
                                    : "border-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                                }`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="md:hidden space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((res) => {
                const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG["En attente"];
                const totalPrice = (res.services ?? []).reduce((sum, s) => sum + (s.price || 0), 0);

                return (
                  <motion.div
                    key={res.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#0a110a] border border-[#D4AF37]/10 p-5 rounded-sm space-y-4"
                  >
                    {/* Header: Date/Heure + Statut */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/10">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#D4AF37]" />
                        <span className="text-sm font-bold text-[#D4AF37]">{res.time}</span>
                        <span className="text-[#f0ebe0]/30 text-xs">•</span>
                        <span className="text-[#f0ebe0]/60 text-xs">{formatReadableDate(res.date)}</span>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${cfg.styles}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {res.status}
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-widest">Client</div>
                      <div className="text-sm font-bold text-[#f0ebe0]">{res.name}</div>
                      <div className="text-xs text-[#f0ebe0]/50 font-mono flex items-center gap-1">
                        <Phone size={10} /> {res.phone}
                      </div>
                    </div>

                    {/* Prestations */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-widest">Prestations</div>
                      <div className="flex flex-wrap gap-1">
                        {(res.services ?? []).map((s, i) => (
                          <span
                            key={i}
                            className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] px-2 py-0.5 rounded-sm"
                          >
                            {s.name} ({s.price} DH)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Barber & Total */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-widest">Barbier</div>
                        <div className="text-xs text-[#f0ebe0]/80 mt-1 font-medium">{res.barber || "Non assigné"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-widest">Total</div>
                        <div className="text-sm font-bold text-[#D4AF37] mt-1">{totalPrice} DH</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#D4AF37]/10 flex flex-wrap gap-2 justify-end">
                      {res.status === "Confirmé" && (
                        <button
                          onClick={() => handleStatus(res.id, "Servi")}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D4AF37]/45 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-[9px] font-bold tracking-widest uppercase rounded-sm"
                        >
                          <CheckCircle size={10} /> Terminer
                        </button>
                      )}
                      {res.status !== "Confirmé" && res.status !== "Servi" && (
                        <button
                          onClick={() => handleStatus(res.id, "Confirmé")}
                          className="p-2 border border-emerald-500/20 text-emerald-500/60 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-sm"
                        >
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {res.status !== "Annulé" && res.status !== "Servi" && (
                        <button
                          onClick={() => handleStatus(res.id, "Annulé")}
                          className="p-2 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-sm"
                        >
                          <XCircle size={13} />
                        </button>
                      )}
                      {res.status !== "En attente" && (
                        <button
                          onClick={() => handleStatus(res.id, "En attente")}
                          className="p-2 border border-amber-500/20 text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10 rounded-sm"
                        >
                          <AlertCircle size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(res.id)}
                        className={`p-2 border rounded-sm ${
                          deleteConfirm === res.id
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
