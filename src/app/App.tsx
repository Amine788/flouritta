import { useState, useEffect } from "react";
import { getPricing, PricingCategory, PriceItem, saveReservation } from "../lib/store";
import {
  Star,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Menu,
  X,
  MessageCircle,
  Scissors,
  Sparkles,
  Crown,
  Gem,
  Leaf,
  ChevronRight,
  Zap,
  Instagram,
  FileText,
  Globe,
  ShoppingBag,
  Trash2,
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────

const navLinks = [
  { name: "À Propos", href: "#about" },
  { name: "Équipe", href: "#team" },
  { name: "Services", href: "#services" },
  { name: "Tarifs", href: "#pricing" },
  { name: "Contact", href: "#contact" },
];

const stats = [
  { value: "15K+", label: "Clients Satisfaits" },
  { value: "6", label: "Stylistes & Experts" },
  { value: "4.9★", label: "Note Moyenne" },
];

const team = [
  { name: "LEILA", role: "Directrice & Styliste", gender: "f", initials: "L", hue: "from-[#C59B63] to-[#A07840]" },
  { name: "KARIM", role: "Maître Barbier (VIP)", gender: "m", initials: "K", hue: "from-[#4A4035] to-[#2A2018]" },
  { name: "YASSINE", role: "Expert Coiffeur Homme", gender: "m", initials: "Y", hue: "from-[#6B5535] to-[#3A2F22]" },
  { name: "SOFIA", role: "Experte Coloriste", gender: "f", initials: "S", hue: "from-[#D4AF87] to-[#A07840]" },
  { name: "SARAH", role: "Styliste Coiffeuse", gender: "f", initials: "S", hue: "from-[#C8A882] to-[#9B7852]" },
];

// Services split by audience
const servicesElle = [
  { icon: Scissors, title: "Coiffure & Lissage", price: "À partir de 150 DH", img: "photo-1562322140-8baeececf3df", desc: "Coupe, brushing, lissage et finitions soignées" },
  { icon: Sparkles, title: "Coloration & Balayage", price: "À partir de 250 DH", img: "photo-1522338242992-e1a54906a8da", desc: "Couleur globale, balayage, ombré tendance" },
  { icon: Leaf, title: "Massages & Spa", price: "À partir de 150 DH", img: "photo-1544161515-4ab6ce6db874", desc: "Rituels de relaxation et bien-être profond" },
  { icon: Gem, title: "Soins du Visage", price: "À partir de 150 DH", img: "photo-1570172619644-dfd03ed5d881", desc: "Soins hydratants, anti-âge et éclat" },
  { icon: Crown, title: "Packs VIP & Mariée", price: "À partir de 900 DH", img: "photo-1595476108010-b4d1f102b1b1", desc: "Forfait complet cérémonie sur-mesure" },
];

const servicesLui = [
  { icon: Scissors, title: "Coupe Signature", price: "150 DH", img: "photo-1503951914875-452162b0f3f1", desc: "Shampooing, coupe stylisée et finitions rasoir" },
  { icon: Zap, title: "Taille de Barbe", price: "80 DH", img: "photo-1621605815971-fbc98d665033", desc: "Taille sculptée avec rituel serviette chaude" },
  { icon: Crown, title: "Pack Royal Homme", price: "250 DH", img: "photo-1599351431202-1e0f0137899a", desc: "Coupe + Barbe + Soin visage express", badge: "Populaire" },
  { icon: Sparkles, title: "Coloration Barbe", price: "100 DH", img: "photo-1534297635766-a262cdcb8ee4", desc: "Camouflage naturel des poils blancs" },
];

// ─── Pricing Data ────────────────────────────────────────────────────────────
// Dynamic pricing loaded from store.ts
const specialists = ["Sans préférence", "Karim", "Leila", "Yassine", "Sofia", "Sarah"];
const allServices = [
  "Coupe Signature", "Taille de Barbe", "Pack Royal Homme", "Coloration Barbe",
  "Coupe Femme", "Lissage Brésilien", "Brushing Luxe", "Coiffure Mariée",
  "Coloration Globale", "Balayage & Mèches", "Ombré & Tie-Dye",
  "Soin Hydratant Visage", "Soin Anti-Âge Prestige",
  "Manucure Classique", "Pose Gel / Semi-permanent",
  "Pack Beauté Totale", "Pack Mariée Prestige",
];
const hours = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px w-8 bg-[#C59B63]" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#C59B63]" />
      <div className="h-px w-8 bg-[#C59B63]" />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex justify-center mb-3">
      <span className="text-[#C59B63] font-jost text-xs font-medium tracking-[0.25em] uppercase">
        {children}
      </span>
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

function Navbar({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E0D8] shadow-sm">
      <div className="max-w-7xl mx-auto px-8 h-[120px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center shrink-0">
          <img src="/logo.png" alt="Flouritta" className="h-28 w-auto object-contain" />
        </a>
        {/* Links — centered */}
        <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="font-jost text-[11px] font-medium tracking-[0.18em] uppercase text-[#706F6C] hover:text-[#C59B63] transition-colors">
              {link.name}
            </a>
          ))}
        </nav>
        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <button className="font-jost text-[11px] text-[#706F6C] flex items-center gap-1.5 hover:text-[#C59B63] transition-colors">
            <Globe size={13} />
            FR
          </button>
          <a href="#booking" className="font-jost text-[11px] font-semibold tracking-[0.18em] uppercase bg-[#C59B63] text-white px-6 py-2.5 hover:bg-[#A07840] transition-colors">
            Réserver
          </a>
        </div>
        <button className="md:hidden text-[#1A1A1A]" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E0D8] px-6 py-6 flex flex-col gap-5 shadow-lg">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="font-jost text-sm tracking-widest uppercase text-[#1A1A1A] hover:text-[#C59B63] transition-colors" onClick={() => setMenuOpen(false)}>
              {link.name}
            </a>
          ))}
          <a href="#booking" className="font-jost text-xs font-semibold tracking-widest uppercase bg-[#C59B63] text-white px-5 py-3 text-center mt-2" onClick={() => setMenuOpen(false)}>
            Réserver
          </a>
        </div>
      )}
    </header>
  );
}

// ─── Hero Split ──────────────────────────────────────────────────────────────
// Full-width split hero: left = Elle (warm cream), right = Lui (dark charcoal)

function Hero() {
  return (
    <section className="relative pt-[120px] min-h-screen grid md:grid-cols-2">

      {/* ── ELLE (left) ── */}
      <div className="relative flex flex-col justify-end overflow-hidden min-h-[50vh] md:min-h-screen group cursor-pointer">
        <img
          src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&h=1100&fit=crop&auto=format"
          alt="Salon coiffure femme Flouritta"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Elle label — top corner */}
        <div className="absolute top-8 left-8 z-10">
          <span className="font-jost text-[10px] font-medium tracking-[0.35em] uppercase text-white/60 border border-white/20 px-3 py-1.5">
            Pour Elle
          </span>
        </div>

        <div className="relative z-10 p-8 md:p-12 pb-12 md:pb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-5 bg-[#C59B63]" />
            <span className="font-jost text-[10px] tracking-[0.3em] uppercase text-[#C59B63]">Beauté Féminine</span>
          </div>
          <h2 className="font-playfair text-3xl md:text-5xl font-semibold text-white leading-[1.15] mb-4">
            L&apos;élégance<br />
            <span className="italic font-normal text-[#C59B63]">sublimée</span>
          </h2>
          <p className="font-jost text-sm text-white/60 mb-8 max-w-xs leading-relaxed">
            Coiffure, colorations, soins visage, massages et packs mariage — une expérience sensorielle complète.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#services" className="inline-flex items-center gap-2 font-jost text-xs font-medium tracking-[0.2em] uppercase text-white border border-white/30 px-6 py-3 hover:bg-white hover:text-[#1A1A1A] transition-all">
              Découvrir <ArrowRight size={12} />
            </a>
            <a href="#booking" className="inline-flex items-center gap-2 font-jost text-xs font-medium tracking-[0.2em] uppercase bg-[#C59B63] text-white px-6 py-3 hover:bg-[#A07840] transition-colors">
              Réserver
            </a>
          </div>
        </div>
      </div>

      {/* ── LUI (right) ── */}
      <div className="relative flex flex-col justify-end overflow-hidden min-h-[50vh] md:min-h-screen group cursor-pointer">
        <img
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=1100&fit=crop&auto=format"
          alt="Barbershop homme Flouritta"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Lui label — top corner */}
        <div className="absolute top-8 right-8 z-10">
          <span className="font-jost text-[10px] font-medium tracking-[0.35em] uppercase text-white/60 border border-white/20 px-3 py-1.5">
            Pour Lui
          </span>
        </div>

        <div className="relative z-10 p-8 md:p-12 pb-12 md:pb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-5 bg-white/40" />
            <span className="font-jost text-[10px] tracking-[0.3em] uppercase text-white/50">Grooming Premium</span>
          </div>
          <h2 className="font-playfair text-3xl md:text-5xl font-semibold text-white leading-[1.15] mb-4">
            Le style,<br />
            <span className="italic font-normal text-[#A07840]">redéfini</span>
          </h2>
          <p className="font-jost text-sm text-white/60 mb-8 max-w-xs leading-relaxed">
            Coupe signature, taille de barbe, rasage traditionnel et packs Royal — le gentleman service.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#services" className="inline-flex items-center gap-2 font-jost text-xs font-medium tracking-[0.2em] uppercase text-white border border-white/30 px-6 py-3 hover:bg-white hover:text-[#1A1A1A] transition-all">
              Découvrir <ArrowRight size={12} />
            </a>
            <a href="#booking" className="inline-flex items-center gap-2 font-jost text-xs font-medium tracking-[0.2em] uppercase bg-[#C59B63] text-white px-6 py-3 hover:bg-[#A07840] transition-colors">
              Réserver
            </a>
          </div>
        </div>
      </div>

      {/* Center brand overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-px h-12 bg-white/20 hidden md:block" />
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-5 rounded-2xl text-center">
            <div className="font-playfair text-2xl md:text-3xl font-semibold tracking-widest text-white uppercase">
              Flouritta
            </div>
            <div className="font-jost text-[9px] tracking-[0.35em] text-white/50 uppercase mt-1">
              Prestige Mixed Salon · Agadir
            </div>
          </div>
          <div className="w-px h-12 bg-white/20 hidden md:block" />
        </div>
      </div>
    </section>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function Stats() {
  return (
    <section className="bg-white py-6">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-[0_8px_40px_rgba(197,155,99,0.12)] grid grid-cols-3 divide-x divide-[#E5E0D8]">
          {stats.map((s) => (
            <div key={s.value} className="py-7 px-6 text-center">
              <div className="font-playfair text-2xl md:text-3xl font-semibold text-[#C59B63] mb-1">{s.value}</div>
              <div className="font-jost text-xs text-[#706F6C] tracking-wide leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ───────────────────────────────────────────────────────────────────

function About() {
  return (
    <section id="about" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#F0EDE7]">
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&h=875&fit=crop&auto=format"
                alt="Salon intérieur FLOURITTA"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-[#C59B63] text-white p-6 rounded-xl hidden md:block">
              <div className="font-playfair text-3xl font-semibold">10+</div>
              <div className="font-jost text-xs tracking-wide mt-1 uppercase opacity-90">Ans d&apos;excellence</div>
            </div>
          </div>
          <div>
            <GoldDivider />
            <SectionLabel>Notre Histoire</SectionLabel>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-6 leading-[1.2]">
              Un Salon Mixte,<br />
              <span className="italic font-normal">pour Elle et pour Lui</span>
            </h2>
            <p className="font-jost text-[#706F6C] leading-relaxed mb-6 text-[15px]">
              FLOURITTA BEAUTY CENTER est un salon de coiffure et centre d&apos;esthétique
              <strong className="text-[#1A1A1A] font-medium"> mixte haut de gamme</strong> situé à Agadir.
              Nous avons conçu un havre de paix moderne et raffiné pour offrir à chaque femme
              et chaque homme bien plus qu&apos;un simple soin — une véritable expérience sensorielle
              et de confiance en soi.
            </p>
            <p className="font-jost text-[#706F6C] leading-relaxed mb-10 text-[15px]">
              Notre mission est de sublimer la beauté naturelle de chacun avec des techniques
              modernes et des produits professionnels prestigieux, dans une atmosphère de
              confort absolu et une hygiène rigoureuse.
            </p>

            {/* Dual promise */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#E5E0D8] rounded-xl p-5 bg-[#FAF8F5]">
                <div className="font-jost text-[10px] tracking-[0.25em] uppercase text-[#C59B63] mb-3 font-medium">Pour Elle</div>
                <ul className="space-y-1.5">
                  {["Coiffure & Lissage", "Colorations", "Soins Visage", "Massage & Spa"].map((s) => (
                    <li key={s} className="font-jost text-xs text-[#706F6C] flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#C59B63] flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border border-[#2A2018]/20 rounded-xl p-5 bg-[#1A1A1A]">
                <div className="font-jost text-[10px] tracking-[0.25em] uppercase text-[#C59B63] mb-3 font-medium">Pour Lui</div>
                <ul className="space-y-1.5">
                  {["Coupe Signature", "Taille de Barbe", "Rasage Traditionnel", "Pack Royal"].map((s) => (
                    <li key={s} className="font-jost text-xs text-white/60 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#C59B63] flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Team ────────────────────────────────────────────────────────────────────

function Team() {
  return (
    <section id="team" className="py-24 md:py-32 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <GoldDivider />
          <SectionLabel>Notre Équipe</SectionLabel>
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4">
            Nos Spécialistes
          </h2>
          <p className="font-jost text-[#706F6C] text-sm max-w-md mx-auto">
            Stylistes, esthéticiennes et barbiers passionnés — une équipe mixte à votre service
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {team.map((member) => (
            <div key={`${member.name}-${member.role}`} className="group text-center">
              <div className="relative mb-4">
                <div
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${member.hue} mx-auto flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] group-hover:shadow-[0_8px_30px_rgba(197,155,99,0.3)] transition-shadow`}
                >
                  <span className="font-playfair text-2xl font-semibold text-white">{member.initials}</span>
                </div>
                {/* Gender pill */}
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-jost font-medium tracking-wide uppercase ${
                  member.gender === "m"
                    ? "bg-[#1A1A1A] text-white/70"
                    : "bg-[#C59B63] text-white"
                }`}>
                  {member.gender === "m" ? "Homme" : "Femme"}
                </div>
              </div>
              <h3 className="font-playfair text-base font-semibold text-[#1A1A1A] tracking-wider uppercase mb-1 mt-3">
                {member.name}
              </h3>
              <p className="font-jost text-xs text-[#706F6C] leading-snug">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Services (with Elle / Lui toggle) ───────────────────────────────────────

function Services() {
  const [tab, setTab] = useState<"elle" | "lui">("elle");
  const list = tab === "elle" ? servicesElle : servicesLui;

  return (
    <section id="services" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <GoldDivider />
          <SectionLabel>Services</SectionLabel>
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-8">
            L&apos;Expérience FLOURITTA
          </h2>

          {/* Toggle */}
          <div className="inline-flex border border-[#E5E0D8] rounded-xl overflow-hidden">
            <button
              onClick={() => setTab("elle")}
              className={`font-jost text-xs font-medium tracking-[0.2em] uppercase px-8 py-3 transition-all ${
                tab === "elle"
                  ? "bg-[#C59B63] text-white"
                  : "bg-white text-[#706F6C] hover:text-[#1A1A1A]"
              }`}
            >
              Pour Elle
            </button>
            <button
              onClick={() => setTab("lui")}
              className={`font-jost text-xs font-medium tracking-[0.2em] uppercase px-8 py-3 transition-all ${
                tab === "lui"
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-white text-[#706F6C] hover:text-[#1A1A1A]"
              }`}
            >
              Pour Lui
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {list.map((svc) => (
            <div
              key={svc.title}
              className="group relative rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#C59B63]/50 hover:shadow-[0_8px_30px_rgba(197,155,99,0.15)] transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#E5E0D8]">
                <img
                  src={`https://images.unsplash.com/${svc.img}?w=400&h=300&fit=crop&auto=format`}
                  alt={svc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="w-8 h-8 rounded-full bg-[#F7F4EF] flex items-center justify-center mb-3">
                  <svc.icon size={14} className="text-[#C59B63]" />
                </div>
                <h3 className="font-playfair text-base font-semibold text-[#1A1A1A] mb-1 leading-tight">{svc.title}</h3>
                <p className="font-jost text-xs text-[#706F6C] mb-3 leading-relaxed">{svc.desc}</p>
                {"badge" in svc && svc.badge && (
                  <span className="inline-block font-jost text-[10px] font-medium tracking-wide uppercase bg-[#C59B63]/10 text-[#C59B63] px-2.5 py-0.5 rounded-full mb-3">
                    {svc.badge as string}
                  </span>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8]">
                  <span className="font-jost text-xs text-[#C59B63] font-medium">{svc.price}</span>
                  <ArrowRight size={12} className="text-[#C59B63] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Barbershop Spotlight ─────────────────────────────────────────────────────
// Dark section dedicated to the men's experience

function BarbershopSpotlight() {
  return (
    <section className="bg-[#111010] py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-[#C59B63]/50" />
              <span className="font-jost text-xs tracking-[0.3em] uppercase text-[#C59B63] font-medium">Espace Homme</span>
            </div>
            <h2 className="font-playfair text-3xl md:text-5xl font-semibold text-white leading-[1.15] mb-6">
              Le Coin du<br />
              <span className="italic font-normal text-[#C59B63]">Gentleman</span>
            </h2>
            <p className="font-jost text-sm text-white/50 leading-relaxed mb-10 max-w-sm">
              Un espace dédié aux hommes — moderne, confidentiel, raffiné. Coupe signature,
              rituel barbe, coloration et packs complets par nos maîtres barbiers Karim et Yassine.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {[
                { num: "150 DH", label: "Coupe Signature" },
                { num: "80 DH", label: "Taille de Barbe" },
                { num: "250 DH", label: "Pack Royal Homme" },
                { num: "100 DH", label: "Coloration Barbe" },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 rounded-xl p-4">
                  <div className="font-playfair text-xl font-semibold text-[#C59B63] mb-1">{item.num}</div>
                  <div className="font-jost text-xs text-white/40 tracking-wide">{item.label}</div>
                </div>
              ))}
            </div>

            <a
              href="#booking"
              className="inline-flex items-center gap-2 font-jost text-xs font-medium tracking-[0.2em] uppercase border border-[#C59B63] text-[#C59B63] px-7 py-4 hover:bg-[#C59B63] hover:text-white transition-all"
            >
              Réserver une séance <ArrowRight size={12} />
            </a>
          </div>

          {/* Images grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#222] row-span-2">
              <img
                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=600&fit=crop&auto=format"
                alt="Barbier au travail"
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#222]">
              <img
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&h=300&fit=crop&auto=format"
                alt="Coupe homme signature"
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#222]">
              <img
                src="https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=300&h=300&fit=crop&auto=format"
                alt="Rasage traditionnel"
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────// ─── Cart ─────────────────────────────────────────────────────────────────────────────

type CartItem = { item: PriceItem; categoryName: string; gender: "m" | "f" };

function parsePrice(p: string): number {
  const m = p.replace(/\s/g, "").match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function CartDrawer({
  cart, onRemove, onClear, onClose, onBook
}: {
  cart: CartItem[]; onRemove: (i: number) => void;
  onClear: () => void; onClose: () => void; onBook: () => void;
}) {
  const total = cart.reduce((s, c) => s + parsePrice(c.item.price), 0);
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-[70] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C59B63] flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-semibold text-[#1A1A1A]">Mon Panier</h3>
              <p className="font-jost text-xs text-[#706F6C] mt-0.5">
                {cart.length} service{cart.length > 1 ? "s" : ""} sélectionné{cart.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button onClick={onClear} className="flex items-center gap-1 font-jost text-xs text-[#706F6C] hover:text-red-400 transition-colors px-2 py-1 rounded">
                <Trash2 size={12} /> Vider
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center hover:bg-[#E5E0D8] transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border-2 border-dashed border-[#E5E0D8] flex items-center justify-center">
                <ShoppingBag size={24} className="text-[#C59B63]/40" />
              </div>
              <p className="font-jost text-sm text-[#706F6C]">Votre panier est vide</p>
              <p className="font-jost text-xs text-[#706F6C]/60">Ajoutez des services depuis la liste tarifaire</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] group hover:border-[#C59B63]/40 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm ${
                    c.gender === "f" ? "bg-[#C59B63]/10" : "bg-[#1A1A1A]/10"
                  }`}>
                    {c.gender === "f" ? "✨" : "✂️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-jost text-sm font-semibold text-[#1A1A1A] leading-tight">{c.item.name}</p>
                    <p className="font-jost text-[11px] text-[#706F6C] mt-0.5">{c.categoryName}</p>
                    <p className="font-playfair text-base font-semibold text-[#C59B63] mt-1.5">{c.item.price}</p>
                  </div>
                  <button
                    onClick={() => onRemove(i)}
                    className="w-7 h-7 rounded-full bg-white border border-[#E5E0D8] flex items-center justify-center hover:border-red-300 hover:text-red-400 transition-colors shrink-0 mt-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#E5E0D8] bg-[#FAF8F5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-jost text-sm text-[#706F6C]">Total estimé</span>
              <span className="font-playfair text-2xl font-semibold text-[#1A1A1A]">
                {total} <span className="text-base text-[#706F6C]">DH</span>
              </span>
            </div>
            <p className="font-jost text-[10px] text-[#706F6C]/70">
              * Prix indicatifs — confirmation en salon lors de votre RDV
            </p>
            <button
              onClick={onBook}
              className="w-full font-jost text-xs font-semibold tracking-[0.2em] uppercase bg-[#C59B63] text-white py-4 hover:bg-[#A07840] transition-all rounded flex items-center justify-center gap-2"
            >
              Réserver ces services <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}


function Pricing({
  cart,
  setCart,
}: {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}) {
  const [gender, setGender] = useState<"f" | "m">("f");
  const [allCategories, setAllCategories] = useState<PricingCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    getPricing().then((data) => {
      setAllCategories(data);
      const initialCat = data.find(c => c.gender === "f");
      if (initialCat) setActiveTab(initialCat.id);
    });
  }, []);

  const categories = allCategories.filter((c) => c.gender === gender);

  const handleGender = (g: "f" | "m") => {
    setGender(g);
    const newCat = allCategories.find((c) => c.gender === g);
    if (newCat) setActiveTab(newCat.id);
  };

  const activeCategory = categories.find((c) => c.id === activeTab);
  const items: PriceItem[] = activeCategory?.items || [];

  const isInCart = (item: PriceItem) => cart.some(c => c.item.name === item.name);

  const addToCart = (item: PriceItem) => {
    if (!isInCart(item))
      setCart(prev => [...prev, { item, categoryName: activeCategory?.name || "", gender }]);
  };

  const removeFromCart = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const removeByName = (name: string) => setCart(prev => prev.filter(c => c.item.name !== name));

  const clearCart = () => setCart([]);

  const handleBook = () => {
    setCartOpen(false);
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  const totalDH = cart.reduce((s, c) => s + parsePrice(c.item.price), 0);

  return (
    <section id="pricing" className="py-24 md:py-32 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <GoldDivider />
          <SectionLabel>Nos Tarifs</SectionLabel>
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4">
            Tarification Transparente
          </h2>
          <p className="font-jost text-[#706F6C] text-sm mb-8">
            Sélectionnez vos services et constituez votre devis personnalisé
          </p>

          {/* Gender Toggle */}
          <div className="inline-flex border border-[#E5E0D8] rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => handleGender("f")}
              className={`font-jost text-xs font-medium tracking-[0.2em] uppercase px-10 py-3.5 transition-all ${
                gender === "f"
                  ? "bg-[#C59B63] text-white shadow-inner"
                  : "bg-white text-[#706F6C] hover:text-[#1A1A1A]"
              }`}
            >
              ❆ Pour Elle
            </button>
            <button
              onClick={() => handleGender("m")}
              className={`font-jost text-xs font-medium tracking-[0.2em] uppercase px-10 py-3.5 transition-all ${
                gender === "m"
                  ? "bg-[#1A1A1A] text-white shadow-inner"
                  : "bg-white text-[#706F6C] hover:text-[#1A1A1A]"
              }`}
            >
              ❆ Pour Lui
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar categories */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                  activeTab === cat.id
                    ? gender === "m"
                      ? "bg-[#1A1A1A] text-white shadow-lg"
                      : "bg-[#C59B63] text-white shadow-[0_4px_20px_rgba(197,155,99,0.35)]"
                    : "bg-white text-[#706F6C] border border-[#E5E0D8] hover:border-[#C59B63]/50"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="font-jost text-sm font-medium">{cat.name}</span>
                {activeTab === cat.id && <ChevronRight size={14} className="ml-auto hidden lg:block" />}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div className="space-y-3">
            {items.map((item) => {
              const inCart = isInCart(item);
              return (
                <div
                  key={item.num}
                  className={`group bg-white rounded-xl border transition-all p-5 flex items-center gap-5 ${
                    inCart
                      ? "border-[#C59B63] shadow-[0_4px_20px_rgba(197,155,99,0.18)] bg-[#FFFCF7]"
                      : "border-[#E5E0D8] hover:border-[#C59B63]/50 hover:shadow-[0_4px_20px_rgba(197,155,99,0.08)]"
                  }`}
                >
                  <span className="font-playfair text-2xl font-semibold text-[#E5E0D8] flex-shrink-0 w-10">{item.num}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-playfair text-base font-semibold text-[#1A1A1A]">{item.name}</h3>
                      {item.badge && (
                        <span className="font-jost text-[10px] font-medium tracking-wide uppercase bg-[#C59B63]/10 text-[#C59B63] px-2.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {inCart && (
                        <span className="font-jost text-[10px] font-medium tracking-wide uppercase bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
                          ✓ Ajouté
                        </span>
                      )}
                    </div>
                    <p className="font-jost text-xs text-[#706F6C]">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-playfair text-xl font-semibold text-[#C59B63]">{item.price}</span>
                    <button
                      onClick={() => inCart ? removeByName(item.name) : addToCart(item)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold text-lg shrink-0 ${
                        inCart
                          ? "bg-[#C59B63] text-white hover:bg-red-400 hover:scale-95"
                          : "bg-[#FAF8F5] border-2 border-[#E5E0D8] text-[#C59B63] hover:bg-[#C59B63] hover:text-white hover:border-[#C59B63] hover:scale-105"
                      }`}
                      title={inCart ? "Retirer du panier" : "Ajouter au panier"}
                    >
                      {inCart ? "✓" : "+"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div className="bg-[#1A1A1A] text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag size={22} className="text-[#C59B63]" />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C59B63] rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {cart.length}
                </span>
              </div>
              <div>
                <p className="font-jost text-sm font-semibold">{cart.length} service{cart.length > 1 ? "s" : ""}</p>
                <p className="font-jost text-[11px] text-white/50">sélectionné{cart.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-playfair text-xl font-semibold text-[#C59B63]">{totalDH} DH</span>
              <button
                onClick={() => setCartOpen(true)}
                className="font-jost text-xs font-semibold tracking-[0.15em] uppercase bg-[#C59B63] text-white px-5 py-2.5 rounded-xl hover:bg-[#A07840] transition-colors flex items-center gap-2"
              >
                Mon panier <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onRemove={removeFromCart}
          onClear={clearCart}
          onClose={() => setCartOpen(false)}
          onBook={handleBook}
        />
      )}
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    {
      quote: "Service impeccable et résultat très professionnel. Mon balayage blond est magnifique et brille à la perfection ! Je ne vais plus nulle part ailleurs.",
      author: "Sofia B.", detail: "Cliente fidèle — Agadir", gender: "f",
    },
    {
      quote: "Karim est un artiste. Ma coupe et ma barbe sont toujours parfaites. L'ambiance est top, on se sent vraiment dans un espace premium.",
      author: "Amine R.", detail: "Client régulier — Agadir", gender: "m",
    },
  ];

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-[#1A1A1A] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #C59B63 0%, transparent 70%)" }} />
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <SectionLabel>Avis Clients</SectionLabel>
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-white">Ce qu&apos;ils disent</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t) => (
            <div key={t.author} className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-[#C59B63] text-[#C59B63] mr-0.5" />
                ))}
              </div>
              <blockquote className="font-playfair text-base md:text-lg italic font-normal text-white/80 leading-relaxed mb-8">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-playfair font-semibold text-sm ${t.gender === "m" ? "bg-[#2A2018]" : "bg-gradient-to-br from-[#C59B63] to-[#A07840]"}`}>
                  {t.author[0]}
                </div>
                <div>
                  <div className="font-jost text-sm font-medium text-white">{t.author}</div>
                  <div className="font-jost text-xs text-white/30 tracking-wide">{t.detail}</div>
                </div>
                <div className={`ml-auto text-[9px] font-jost font-medium uppercase tracking-wide px-2.5 py-1 rounded-full ${t.gender === "m" ? "bg-white/10 text-white/40" : "bg-[#C59B63]/20 text-[#C59B63]"}`}>
                  {t.gender === "m" ? "Homme" : "Femme"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Booking ──────────────────────────────────────────────────────────────────

function Booking({
  cart,
  clearCart,
}: {
  cart: CartItem[];
  clearCart: () => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", specialist: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Veuillez saisir votre nom complet.");
    if (!form.phone.trim()) return setError("Veuillez saisir votre numéro de téléphone.");
    if (!form.date) return setError("Veuillez choisir une date.");
    if (!form.time) return setError("Veuillez choisir une heure.");
    if (!form.specialist) return setError("Veuillez choisir un spécialiste.");
    if (cart.length === 0) return setError("Votre panier est vide. Veuillez sélectionner au moins un service.");

    setSubmitting(true);
    try {
      const servicesToSave = cart.map(c => ({
        name: c.item.name,
        price: parsePrice(c.item.price)
      }));

      await saveReservation({
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        barber: form.specialist,
        services: servicesToSave
      });

      setSuccess(true);
      clearCart();
      setForm({ name: "", phone: "", date: "", time: "", specialist: "" });
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de l'enregistrement de votre réservation. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full font-jost text-sm text-[#1A1A1A] bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#C59B63] focus:ring-1 focus:ring-[#C59B63]/30 transition-all placeholder:text-[#B8B4AE]";

  if (success) {
    return (
      <section id="booking" className="py-24 md:py-32 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-10 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 text-2xl font-bold">
              ✓
            </div>
            <h2 className="font-playfair text-3xl font-semibold text-[#1A1A1A]">
              Réservation Confirmée !
            </h2>
            <p className="font-jost text-[#706F6C] text-sm max-w-md mx-auto">
              Votre demande de réservation a été enregistrée avec succès. Notre équipe vous contactera par téléphone ou WhatsApp sous 2 heures pour la validation définitive.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="font-jost text-xs font-semibold tracking-[0.2em] uppercase bg-[#C59B63] text-white px-8 py-3.5 rounded-xl hover:bg-[#A07840] transition-colors"
            >
              Faire une autre réservation
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-24 md:py-32 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <GoldDivider />
          <SectionLabel>Réservation</SectionLabel>
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4">
            Réserver Votre Soin
          </h2>
          <p className="font-jost text-[#706F6C] text-sm">
            Notre équipe confirme les réservations par téléphone ou WhatsApp sous 2h
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-8 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { key: "name", label: "Nom Complet", type: "text", placeholder: "Votre nom" },
              { key: "phone", label: "Téléphone", type: "tel", placeholder: "06 XX XX XX XX" },
              { key: "date", label: "Date", type: "date", placeholder: "" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block font-jost text-xs font-medium text-[#1A1A1A] tracking-wide uppercase mb-2">{label}</label>
                <input type={type} placeholder={placeholder} value={(form as Record<string,string>)[key]} onChange={update(key)} className={inputClass} required />
              </div>
            ))}
            <div>
              <label className="block font-jost text-xs font-medium text-[#1A1A1A] tracking-wide uppercase mb-2">Heure</label>
              <select value={form.time} onChange={update("time")} className={inputClass} required>
                <option value="">Choisir une heure</option>
                {hours.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block font-jost text-xs font-medium text-[#1A1A1A] tracking-wide uppercase mb-2">Spécialiste</label>
              <select value={form.specialist} onChange={update("specialist")} className={inputClass} required>
                <option value="">Choisir</option>
                {specialists.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="mt-6 border-t border-[#E5E0D8] pt-6">
            <label className="block font-jost text-xs font-medium text-[#1A1A1A] tracking-wide uppercase mb-3">
              Services Sélectionnés
            </label>
            {cart.length === 0 ? (
              <div className="bg-[#FFFDF9] border border-dashed border-[#E5E0D8] rounded-xl p-6 text-center">
                <p className="font-jost text-sm text-[#706F6C] mb-2">Votre panier est vide</p>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-1.5 font-jost text-xs font-semibold text-[#C59B63] hover:text-[#A07840] transition-colors"
                >
                  Choisir des services dans nos tarifs <ArrowRight size={12} />
                </a>
              </div>
            ) : (
              <div className="bg-[#FFFDF9] border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2.5 pr-2">
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs">{c.gender === "f" ? "✨" : "✂️"}</span>
                        <span className="font-jost text-[#1A1A1A] font-medium truncate">
                          {c.item.name}
                        </span>
                        <span className="font-jost text-[10px] text-[#706F6C] bg-[#FAF8F5] border border-[#E5E0D8] px-2 py-0.5 rounded-full shrink-0">
                          {c.categoryName}
                        </span>
                      </div>
                      <span className="font-playfair font-semibold text-[#C59B63] shrink-0">
                        {c.item.price}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E5E0D8] pt-3 flex justify-between items-center">
                  <span className="font-jost text-xs font-semibold text-[#706F6C] uppercase tracking-wide">
                    Total
                  </span>
                  <span className="font-playfair text-lg font-bold text-[#1A1A1A]">
                    {cart.reduce((s, c) => s + parsePrice(c.item.price), 0)} DH
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full font-jost text-sm font-medium tracking-[0.2em] uppercase bg-[#C59B63] text-white py-4 rounded-xl hover:bg-[#A07840] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Enregistrement..." : "Réserver maintenant"}
            </button>
            <a href="https://wa.me/212688687633?text=Bonjour%20Flouritta%2C%20je%20souhaite%20prendre%20rendez-vous." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full font-jost text-sm font-medium tracking-wide text-[#1A1A1A] border border-[#E5E0D8] py-4 rounded-xl hover:border-[#C59B63] hover:text-[#C59B63] transition-colors">
              <MessageCircle size={16} />
              Réserver directement via WhatsApp
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32 bg-[#FAF8F5] border-t border-[#E5E0D8]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <GoldDivider />
            <SectionLabel>Nous Trouver</SectionLabel>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-2">
              Visiter FLOURITTA
            </h2>
            <p className="font-jost text-sm italic text-[#C59B63] mb-8">Where Beauty Blooms Naturally</p>
            <div className="space-y-5 mb-10">
              {[
                { Icon: MapPin,         label: "Adresse",    value: "Magasin n°6 GH 17, Islane, Agadir",  href: "https://maps.google.com/?q=Islane+Agadir" },
                { Icon: Phone,          label: "Téléphone",   value: "06 88 68 76 33",                      href: "tel:+212688687633" },
                { Icon: Clock,          label: "Horaires",   value: "Lun–Sam 9h–22h · Dim 10h–20h",         href: null },
                { Icon: MessageCircle,  label: "Email",      value: "contact@flouritta.ma",                  href: "mailto:contact@flouritta.ma" },
                { Icon: Globe,          label: "Site web",   value: "www.flouritta.ma",                       href: "https://www.flouritta.ma" },
                { Icon: Instagram,      label: "Instagram",  value: "@flouritaa.beautycenter",               href: "https://www.instagram.com/flouritta.beautycenter?igsh=MWIxZXRlaGE4czltaA%3D%3D&utm_source=qr" },
              ].map(({ Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-white border border-[#E5E0D8] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-[#C59B63]" />
                  </div>
                  <div>
                    <div className="font-jost text-[10px] font-medium tracking-wide uppercase text-[#706F6C] mb-0.5">{label}</div>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="font-jost text-sm text-[#1A1A1A] hover:text-[#C59B63] transition-colors">{value}</a>
                    ) : (
                      <div className="font-jost text-sm text-[#1A1A1A]">{value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://wa.me/212688687633?text=Bonjour%20Flouritta%2C%20je%20souhaite%20prendre%20rendez-vous." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 font-jost text-xs font-medium tracking-[0.15em] uppercase bg-[#C59B63] text-white px-6 py-3 rounded-xl hover:bg-[#A07840] transition-colors">
                <MessageCircle size={13} /> Discuter sur WhatsApp
              </a>
              <a href="https://maps.google.com/?q=Islane+Agadir" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 font-jost text-xs font-medium tracking-[0.15em] uppercase border border-[#E5E0D8] text-[#1A1A1A] px-6 py-3 rounded-xl hover:border-[#C59B63] hover:text-[#C59B63] transition-colors">
                <MapPin size={13} /> Ouvrir dans Maps
              </a>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#E5E0D8] aspect-[4/3] relative shadow-inner">
            <iframe
              src="https://maps.google.com/maps?q=Islane%20Agadir&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps Flouritta"
              className="w-full h-full absolute inset-0 grayscale-[20%] contrast-[1.1] opacity-90 hover:opacity-100 hover:grayscale-0 transition-all duration-500"
            />
            {/* Enforce border style around iframe */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const footerLinks = [
    { name: "À Propos", href: "#about" },
    { name: "Équipe", href: "#team" },
    { name: "Services", href: "#services" },
    { name: "Avis Clients", href: "#testimonials" },
    { name: "Réserver", href: "#booking" },
    { name: "Nos Tarifs", href: "#pricing" },
    { name: "Contact", href: "#contact" }
  ];
  return (
    <footer className="bg-[#1A1A1A] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-white/10">
          <div>
            <div className="mb-5">
              <img src="/logo.png" alt="Flouritta" className="h-20 w-auto object-contain" />
            </div>
            <p className="font-jost text-sm text-white/70 leading-relaxed max-w-xs mb-3">
              Salon mixte premium à Agadir — coiffure, esthétique et barbershop réunis dans un havre d&apos;élégance.
            </p>
            <p className="font-playfair text-xs italic text-[#C59B63] mb-6">Where Beauty Blooms Naturally</p>
            <div className="flex gap-2">
              <span className="font-jost text-[10px] uppercase tracking-widest text-[#C59B63] border border-[#C59B63]/30 px-3.5 py-1.5 rounded-full">Pour Elle</span>
              <span className="font-jost text-[10px] uppercase tracking-widest text-white/55 border border-white/10 px-3.5 py-1.5 rounded-full">Pour Lui</span>
            </div>
          </div>
          <div>
            <div className="font-jost text-xs font-medium tracking-[0.2em] uppercase text-[#C59B63] mb-6">Navigation</div>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-6">
              {footerLinks.map((link) => (
                <a key={link.name} href={link.href} className="font-jost text-sm text-white/60 hover:text-[#C59B63] transition-colors">{link.name}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="font-jost text-xs font-medium tracking-[0.2em] uppercase text-[#C59B63] mb-6">Contact</div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-[#C59B63] flex-shrink-0 mt-0.5" />
                <span className="font-jost text-sm text-white/70">Magasin n°6 GH 17, Islane, Agadir</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-[#C59B63] flex-shrink-0" />
                <a href="tel:+212688687633" className="font-jost text-sm text-white/70 hover:text-[#C59B63] transition-colors">06 88 68 76 33</a>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-[#C59B63] flex-shrink-0" />
                <span className="font-jost text-sm text-white/70">Lun–Sam 9h–22h · Dim 10h–20h</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle size={14} className="text-[#C59B63] flex-shrink-0" />
                <a href="mailto:contact@flouritta.ma" className="font-jost text-sm text-white/70 hover:text-[#C59B63] transition-colors">contact@flouritta.ma</a>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-[#C59B63] flex-shrink-0" />
                <a href="https://www.flouritta.ma" target="_blank" rel="noopener noreferrer" className="font-jost text-sm text-white/70 hover:text-[#C59B63] transition-colors">www.flouritta.ma</a>
              </div>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/flouritta.beautycenter?igsh=MWIxZXRlaGE4czltaA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors group">
                  <Instagram size={14} className="text-[#C59B63] flex-shrink-0 group-hover:text-[#C59B63] transition-colors" />
                  <span className="font-jost text-sm text-white/70 group-hover:text-[#C59B63] transition-colors">@flouritaa.beautycenter</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-jost text-xs text-white/40 tracking-wide">© 2026 FLOURITTA Beauty Center. Tous droits réservés.</p>
          <div className="flex items-center gap-2">
            <div className="h-px w-6 bg-[#C59B63]/40" />
            <span className="font-playfair text-sm italic text-[#C59B63]/80">Prestige · Beauté · Élégance</span>
            <div className="h-px w-6 bg-[#C59B63]/40" />
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Jost', system-ui, sans-serif" }}>
      <style>{`
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .font-jost { font-family: 'Jost', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C59B63; border-radius: 2px; }
      `}</style>

      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero />
      <Stats />
      <About />
      <Team />
      <Services />
      <BarbershopSpotlight />
      <Pricing cart={cart} setCart={setCart} />
      <Testimonials />
      <Booking cart={cart} clearCart={() => setCart([])} />
      <Contact />
      <Footer />
    </div>
  );
}
