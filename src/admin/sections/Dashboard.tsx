import { useState, useEffect, useMemo } from "react";
import { 
  Users, Calendar, Clock, TrendingUp, Scissors, 
  UserCheck, AlertCircle, BarChart3, ArrowUpRight,
  PlusCircle, CheckCircle2, Tag
} from "lucide-react";
import { 
  getReservations, getBarbers, getPricing,
  type Reservation, type Barber 
} from "../../lib/store";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { motion } from "motion/react";

export function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getReservations(), getBarbers()])
      .then(([resData, barbData]) => {
        setReservations(resData);
        setBarbers(barbData);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayRes = reservations.filter(r => r.date === today);
    const pending = reservations.filter(r => r.status === "En attente");
    const confirmed = reservations.filter(r => r.status === "Confirmé");
    const uniquePhones = new Set(reservations.map(r => r.phone));

    // Barber stats
    const barberCounts: Record<string, number> = {};
    reservations.forEach(r => {
      const b = r.barber || "Sans préférence";
      barberCounts[b] = (barberCounts[b] || 0) + 1;
    });
    const topBarber = Object.entries(barberCounts).sort((a, b) => b[1] - a[1])[0];

    // Service stats
    const serviceCounts: Record<string, number> = {};
    reservations.forEach(r => {
      serviceCounts[r.service] = (serviceCounts[r.service] || 0) + 1;
    });
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

    // Last 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = reservations.filter(r => r.date === dStr).length;
      chartData.push({
        name: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        fullDate: dStr,
        count
      });
    }

    return {
      total: reservations.length,
      today: todayRes.length,
      pending: pending.length,
      confirmed: confirmed.length,
      customers: uniquePhones.size,
      topBarber: topBarber ? { name: topBarber[0], count: topBarber[1] } : null,
      topService: topService ? { name: topService[0], count: topService[1] } : null,
      chartData
    };
  }, [reservations]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C59B63]"></div>
      </div>
    );
  }

  const cards = [
    { label: "Total Réservations", value: stats.total, icon: <Calendar size={20} />, color: "text-[#C59B63]", bg: "bg-[#C59B63]/10" },
    { label: "Aujourd'hui", value: stats.today, icon: <Clock size={20} />, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "En attente", value: stats.pending, icon: <AlertCircle size={20} />, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Confirmées", value: stats.confirmed, icon: <UserCheck size={20} />, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Clients Uniques", value: stats.customers, icon: <Users size={20} />, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ── Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-[#E5E0D8] p-5 rounded-sm hover:border-[#C59B63]/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-sm ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <TrendingUp size={14} className="text-emerald-500/40" />
            </div>
            <div className="text-2xl font-bold text-[#1A1A1A] mb-1 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              {card.value}
            </div>
            <div className="text-[#1A1A1A]/30 text-[10px] uppercase tracking-[0.2em] font-medium">
              {card.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Chart ── */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white border border-[#E5E0D8] p-6 rounded-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[#1A1A1A] text-sm font-bold tracking-wider uppercase mb-1">Activité Hebdomadaire</h3>
              <p className="text-[#1A1A1A]/30 text-[10px] tracking-widest uppercase">Réservations des 7 derniers jours</p>
            </div>
            <BarChart3 size={16} className="text-[#C59B63]/40" />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C59B63" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C59B63" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C59B63" vertical={false} opacity={0.05} />
                <XAxis 
                  dataKey="name" 
                  stroke="#f0ebe0" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  opacity={0.3}
                  dy={10}
                />
                <YAxis 
                  stroke="#f0ebe0" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  opacity={0.3}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#040809', border: '1px solid rgba(212,175,55,0.2)', fontSize: '12px' }}
                  itemStyle={{ color: '#C59B63' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#C59B63" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Top Performance ── */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-[#E5E0D8] p-6 rounded-sm"
          >
            <h3 className="text-[#1A1A1A] text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
              <UserCheck size={14} className="text-[#C59B63]" />
              Top Barbier
            </h3>
            {stats.topBarber ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[#1A1A1A] font-medium text-lg mb-1">{stats.topBarber.name}</div>
                  <div className="text-[#1A1A1A]/30 text-[10px] uppercase tracking-widest">{stats.topBarber.count} Réservations</div>
                </div>
                <div className="h-12 w-12 rounded-full border border-[#C59B63]/20 flex items-center justify-center bg-[#FAF8F5]">
                   <Scissors size={20} className="text-[#C59B63]" />
                </div>
              </div>
            ) : (
              <div className="text-[#1A1A1A]/20 text-xs uppercase tracking-widest italic">Aucune donnée</div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-[#E5E0D8] p-6 rounded-sm"
          >
            <h3 className="text-[#1A1A1A] text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
              <Tag size={14} className="text-[#C59B63]" />
              Service Phare
            </h3>
            {stats.topService ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[#1A1A1A] font-medium text-lg mb-1">{stats.topService.name}</div>
                  <div className="text-[#1A1A1A]/30 text-[10px] uppercase tracking-widest">{stats.topService.count} demandes</div>
                </div>
                <div className="h-12 w-12 rounded-sm border border-[#C59B63]/20 flex items-center justify-center bg-[#FAF8F5] transform rotate-12">
                   <ArrowUpRight size={20} className="text-[#C59B63]" />
                </div>
              </div>
            ) : (
              <div className="text-[#1A1A1A]/20 text-xs uppercase tracking-widest italic">Aucune donnée</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E5E0D8] rounded-sm overflow-hidden"
      >
        <div className="p-6 border-b border-[#E5E0D8] flex items-center justify-between">
          <h3 className="text-[#1A1A1A] text-sm font-bold tracking-wider uppercase">Activité Récente</h3>
          <PlusCircle size={16} className="text-[#C59B63]/40" />
        </div>
        <div className="divide-y divide-[#C59B63]/5">
          {reservations.slice(0, 5).map((res, i) => (
            <div key={res.id} className="p-4 hover:bg-[#FAF8F5] transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-[#C59B63]/10 flex items-center justify-center text-[#C59B63]">
                  <UserCheck size={14} />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#1A1A1A]">{res.name}</div>
                  <div className="text-[10px] text-[#1A1A1A]/30 uppercase tracking-widest">{res.service} • {res.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                   <div className="text-[10px] text-[#1A1A1A]/40 tracking-wider uppercase">{res.date}</div>
                 </div>
                 <div className={`text-[9px] uppercase tracking-[0.2em] font-bold px-2 py-1 rounded-sm border ${
                    res.status === 'Confirmé' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                    res.status === 'Annulé' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                    'border-amber-500/30 text-amber-400 bg-amber-500/5'
                 }`}>
                   {res.status}
                 </div>
              </div>
            </div>
          ))}
          {reservations.length === 0 && (
            <div className="p-10 text-center text-[#1A1A1A]/20 text-xs uppercase tracking-widest">
              Aucune activité pour le moment
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
