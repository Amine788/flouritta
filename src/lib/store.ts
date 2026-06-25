// src/lib/store.ts

// Types
export type LoginResult = any;
export type Barber = any;
export type GalleryPhoto = any;

export type Reservation = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  barber: string;
  status: "En attente" | "Confirm\u00e9" | "Annul\u00e9" | "Servi";
  services: Array<{ name: string; price: number }>;
  createdAt: string;
};

export type PriceItem = {
  num: string;
  name: string;
  desc: string;
  price: string;
  badge?: string;
  popular?: boolean;
  fromPrice?: boolean;
};

export type PricingCategory = {
  id: string;
  name: string;
  icon?: string;
  gender: "m" | "f";
  items: PriceItem[];
};

// Auth / Session
export const login = async (password: string) => ({ success: true });
export const verifyOTP = async (otp: string) => ({ success: true });
export const logout = async () => {};
export const getSessionInfo = () => ({ sessionLeft: 3600 });
export const refreshActivity = () => {};
export const checkInactivityTimeout = () => {};

// Reservations
export const saveReservation = async (
  data: Omit<Reservation, "id" | "createdAt" | "status">
): Promise<Reservation> => {
  const stored = localStorage.getItem("flouritta_reservations");
  const all: Reservation[] = stored ? JSON.parse(stored) : [];
  const newRes: Reservation = {
    ...data,
    id: Date.now().toString(),
    status: "En attente",
    createdAt: new Date().toISOString(),
  };
  all.unshift(newRes);
  localStorage.setItem("flouritta_reservations", JSON.stringify(all));
  return newRes;
};

export const getReservations = async (): Promise<Reservation[]> => {
  const stored = localStorage.getItem("flouritta_reservations");
  return stored ? JSON.parse(stored) : [];
};

export const updateReservationStatus = async (id: string, status: string) => {
  const stored = localStorage.getItem("flouritta_reservations");
  if (!stored) return;
  const all: Reservation[] = JSON.parse(stored);
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) {
    all[idx].status = status as Reservation["status"];
    localStorage.setItem("flouritta_reservations", JSON.stringify(all));
  }
};

export const deleteReservation = async (id: string) => {
  const stored = localStorage.getItem("flouritta_reservations");
  if (!stored) return;
  const all: Reservation[] = JSON.parse(stored);
  localStorage.setItem(
    "flouritta_reservations",
    JSON.stringify(all.filter((r) => r.id !== id))
  );
};

// Barbers (Team)
export const getBarbers = async () => [];
export const saveBarbers = async (barbers: any) => {};

// Photos / Media
export const uploadPhoto = async (file: File) => "url";
export const getImageUrl = (url: string) => url;
export const uploadPhotoWithProgress = async (file: File, onProgress: any) => "url";
export const fetchGalleryPhotos = async () => [];
export const deleteGalleryPhoto = async (id: string) => {};

// Settings
export const getContactPhone = async () => "06 00 00 00 00";
export const saveContactPhone = async (phone: string) => {};
export const getDisplayPhone = async () => "06 00 00 00 00";
export const saveDisplayPhone = async (phone: string) => {};
export const saveAdminPassword = async (pwd: string) => {};

// ─── Default Pricing Data ───────────────────────────────────────────────────
const defaultPricing: PricingCategory[] = [
  // Homme
  {
    id: "coupe", icon: "✂️", name: "Coupe & Style", gender: "m",
    items: [
      { num: "01", name: "Coupe Classique",    desc: "Coupe soignée, shampooing, séchage et finition",                  price: "80 DH",  badge: "Populaire" },
      { num: "02", name: "Coupe + Styling",    desc: "Coupe + produits de coiffage professionnels appliqués",           price: "100 DH" },
      { num: "03", name: "Dégradé Américain", desc: "Fondu peau progressif, finitions précises au rasoir",              price: "100 DH" },
      { num: "04", name: "Coupe Enfant",       desc: "Coupe douce et soignée pour les moins de 12 ans",                 price: "60 DH"  },
      { num: "05", name: "Shampooing seul",    desc: "Shampooing + soin capillaire adapté",                             price: "40 DH"  },
    ]
  },
  {
    id: "barbe", icon: "🪒", name: "Barbe & Rasage", gender: "m",
    items: [
      { num: "01", name: "Taille de Barbe",          desc: "Sculpture et taille précise avec serviette chaude",         price: "60 DH",  badge: "Populaire" },
      { num: "02", name: "Rasage Classique",          desc: "Rasage au rasoir traditionnel + rituel serviette chaude",  price: "70 DH"  },
      { num: "03", name: "Barbe + Masque Hydratant", desc: "Taille + application masque nourrissant peau et poils",    price: "90 DH"  },
      { num: "04", name: "Coloration Barbe",          desc: "Camouflage naturel des poils blancs, résultat naturel",    price: "80 DH"  },
    ]
  },
  {
    id: "soinsH", icon: "✨", name: "Soins & Rituel", gender: "m",
    items: [
      { num: "01", name: "Soin Visage Homme",        desc: "Nettoyage + masque purifiant + hydratation profonde",       price: "120 DH", badge: "Premium" },
      { num: "02", name: "Soin Cuir Chevelu",        desc: "Traitement anti-chute et stimulation capillaire",           price: "100 DH" },
      { num: "03", name: "Massage Crânien",          desc: "Massage relaxant du cuir chevelu et nuque (20 min)",        price: "80 DH"  },
      { num: "04", name: "Rituel Cire / Épilation", desc: "Épilation oreilles, nez ou front",                          price: "50 DH"  },
    ]
  },
  {
    id: "packsH", icon: "👑", name: "Packs Homme", gender: "m",
    items: [
      { num: "01", name: "Pack Royal Homme",   desc: "Coupe classique + Taille barbe + Soin visage",                   price: "220 DH", badge: "Best-seller" },
      { num: "02", name: "Pack Gentleman",     desc: "Coupe + Styling + Barbe sculptée + Masque",                      price: "260 DH" },
      { num: "03", name: "Pack VIP Prestige", desc: "Coupe + Barbe + Soin visage + Massage crânien + Coloration",     price: "380 DH", badge: "Meilleure valeur" },
    ]
  },

  // Femme
  {
    id: "coiffure", icon: "💇", name: "Coiffure & Lissage", gender: "f",
    items: [
      { num: "01", name: "Coupe Femme",                desc: "Coupe personnalisée avec conseil stylistique inclus",            price: "150 DH" },
      { num: "02", name: "Brushing Luxe",              desc: "Mise en forme soignée avec finition brillance",                  price: "120 DH" },
      { num: "03", name: "Lissage Brésilien",         desc: "Lissage longue durée à la kératine premium",                    price: "450 DH", badge: "Best-seller" },
      { num: "04", name: "Lissage Japonais",          desc: "Lissage permanent ultra-lisse et durable",                       price: "550 DH" },
      { num: "05", name: "Coiffure Mariée",           desc: "Coiffure de cérémonie sur-mesure avec accessoires",              price: "600 DH", badge: "Sur RDV" },
      { num: "06", name: "Tresses & Nattes",         desc: "Tressage africain, nattes, ou coiffures afro",                   price: "200 DH" },
    ]
  },
  {
    id: "coloration", icon: "🎨", name: "Colorations & Style", gender: "f",
    items: [
      { num: "01", name: "Coloration Globale",   desc: "Coloration complète avec soin post-couleur inclus",           price: "250 DH", badge: "Populaire" },
      { num: "02", name: "Balayage & Mèches",   desc: "Technique balayage naturelle, lumière et volume",             price: "350 DH" },
      { num: "03", name: "Ombré & Tie-Dye",     desc: "Dégradé de couleurs tendance, effets modernes",              price: "400 DH", badge: "Tendance" },
      { num: "04", name: "Patine & Revers",     desc: "Correction tonalité, reflets froids ou chauds",              price: "180 DH" },
      { num: "05", name: "Décoloration",        desc: "Éclaircissement avec soin protecteur capillaire",            price: "300 DH" },
    ]
  },
  {
    id: "soinsF", icon: "🌸", name: "Soins & Esthétique", gender: "f",
    items: [
      { num: "01", name: "Soin Hydratant Visage",    desc: "Nettoyage + masque + hydratation profonde",                  price: "150 DH" },
      { num: "02", name: "Soin Anti-Âge Prestige",  desc: "Protocole lifting et fermeté avec actifs premium",           price: "280 DH", badge: "Premium" },
      { num: "03", name: "Épilation Corps",          desc: "Épilation à la cire (jambes, aisselles, bikini…)",          price: "80 DH"  },
      { num: "04", name: "Massage Relaxant",         desc: "Massage corps complet ou ciblé (dos / épaules)",            price: "200 DH" },
      { num: "05", name: "Maquillage Journée",       desc: "Maquillage naturel ou soirée avec conseil teint",           price: "150 DH" },
      { num: "06", name: "Maquillage Mariée",        desc: "Maquillage de cérémonie longue tenue, sur RDV",             price: "500 DH", badge: "Sur RDV" },
    ]
  },
  {
    id: "manucure", icon: "💅", name: "Manucure & Regard", gender: "f",
    items: [
      { num: "01", name: "Manucure Classique",         desc: "Soin complet des mains + pose vernis au choix",            price: "100 DH" },
      { num: "02", name: "Pose Gel / Semi-permanent",  desc: "Pose gel longue durée, design et forme au choix",         price: "180 DH", badge: "Populaire" },
      { num: "03", name: "Pédicure Classique",         desc: "Soin complet des pieds + vernis",                          price: "120 DH" },
      { num: "04", name: "Nail Art",                   desc: "Décoration artistique sur ongles, motifs personnalisés",  price: "50 DH"  },
    ]
  },
  {
    id: "packsF", icon: "✨", name: "Packs Prestige", gender: "f",
    items: [
      { num: "01", name: "Pack Beauté Totale",    desc: "Coiffure + Maquillage + Soin visage + Manucure",              price: "900 DH",  badge: "Meilleure valeur" },
      { num: "02", name: "Pack Mariée Prestige", desc: "Essai + Coiffure cérémonie + Maquillage + Soins complète",   price: "1500 DH", badge: "Sur RDV" },
      { num: "03", name: "Pack Détox Femme",     desc: "Soin visage + Massage relaxant + Manucure classique",        price: "450 DH" },
    ]
  }
];

// Pricing API
export const getPricing = async (): Promise<PricingCategory[]> => {
  const stored = localStorage.getItem("flouritta_pricing");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored pricing", e);
    }
  }
  return defaultPricing;
};

export const savePricing = async (pricing: PricingCategory[]) => {
  localStorage.setItem("flouritta_pricing", JSON.stringify(pricing));
};
