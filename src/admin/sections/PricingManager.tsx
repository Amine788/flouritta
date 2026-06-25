import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, Save, Check, Edit2, X, Crown, Star,
  ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import {
  getPricing, savePricing,
  type PricingCategory, type PriceItem,
} from "../../lib/store";

export function PricingManager() {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editingItem, setEditingItem] = useState<{ catIdx: number; itemIdx: number } | null>(null);
  const [draftItem, setDraftItem] = useState<PriceItem | null>(null);
  const [addingItem, setAddingItem] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<PriceItem>({ name: "", price: "", desc: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPricing().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  const persist = async (updated: PricingCategory[]) => {
    setCategories(updated);
    await savePricing(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Edit item ──────────────────────────────────────────────────────────────
  const startEdit = (catIdx: number, itemIdx: number) => {
    setEditingItem({ catIdx, itemIdx });
    setDraftItem({ ...categories[catIdx].items[itemIdx] });
    setAddingItem(null);
  };

  const saveEdit = async () => {
    if (!editingItem || !draftItem) return;
    const updated = categories.map((cat, ci) =>
      ci === editingItem.catIdx
        ? { ...cat, items: cat.items.map((item, ii) => (ii === editingItem.itemIdx ? draftItem : item)) }
        : cat
    );
    await persist(updated);
    setEditingItem(null);
    setDraftItem(null);
  };

  const cancelEdit = () => { setEditingItem(null); setDraftItem(null); };

  // ── Delete item ────────────────────────────────────────────────────────────
  const deleteItem = async (catIdx: number, itemIdx: number) => {
    const updated = categories.map((cat, ci) =>
      ci === catIdx ? { ...cat, items: cat.items.filter((_, ii) => ii !== itemIdx) } : cat
    );
    await persist(updated);
    if (editingItem?.catIdx === catIdx && editingItem?.itemIdx === itemIdx) cancelEdit();
  };

  // ── Add item ───────────────────────────────────────────────────────────────
  const confirmAdd = async (catIdx: number) => {
    if (!newItem.name || !newItem.price) return;
    const updated = categories.map((cat, ci) =>
      ci === catIdx ? { ...cat, items: [...cat.items, { ...newItem }] } : cat
    );
    await persist(updated);
    setAddingItem(null);
    setNewItem({ name: "", price: "", desc: "" });
  };

  // ── Move item ──────────────────────────────────────────────────────────────
  const moveItem = async (catIdx: number, itemIdx: number, dir: -1 | 1) => {
    const items = [...categories[catIdx].items];
    const target = itemIdx + dir;
    if (target < 0 || target >= items.length) return;
    [items[itemIdx], items[target]] = [items[target], items[itemIdx]];
    const updated = categories.map((cat, ci) => (ci === catIdx ? { ...cat, items } : cat));
    await persist(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="text-[#C59B63]/40 animate-spin" />
      </div>
    );
  }

  const cat = categories[activeTab];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1A1A1A] text-xl" style={{ fontFamily: "Playfair Display, serif", fontWeight: 700 }}>
            Gestion des Tarifs
          </h2>
          <p className="text-[#1A1A1A]/40 text-xs tracking-wider mt-1">
            Modifiez les prix et services affichés sur le site
          </p>
        </div>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 px-4 py-2 text-[10px] tracking-wider"
          >
            <Check size={12} /> Sauvegardé
          </motion.div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c, i) => (
          <button
            key={c.id}
            onClick={() => { setActiveTab(i); setEditingItem(null); setAddingItem(null); }}
            className={`flex flex-col gap-1.5 items-start px-4 py-2.5 transition-all duration-200 border rounded-xl ${
              activeTab === i
                ? "border-[#C59B63] bg-[#C59B63] text-white shadow-md"
                : "border-[#E5E0D8] bg-white text-[#706F6C] hover:border-[#C59B63]/50 hover:text-[#1A1A1A]"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase font-jost">
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </div>
            <span className={`text-[8px] font-bold tracking-[0.2em] px-1.5 py-0.5 rounded uppercase ${
              c.gender === 'm' ? (activeTab === i ? 'bg-white text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white') : (activeTab === i ? 'bg-white text-[#C59B63]' : 'bg-[#C59B63] text-white')
            }`}>
              {c.gender === 'm' ? 'HOMME' : 'FEMME'}
            </span>
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="bg-white border border-[#E5E0D8] overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-white">
          <div className="flex items-center gap-3">
            <span className="text-[#C59B63] text-lg">{cat.icon}</span>
            <h3 className="text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, serif", fontSize: "1.1rem", fontWeight: 700 }}>
              {cat.name}
            </h3>
            <span className="text-[#706F6C] text-xs font-jost">— {cat.items.length} service{cat.items.length > 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={() => { setAddingItem(activeTab); setEditingItem(null); }}
            className="flex items-center gap-2 bg-[#C59B63] text-[#040809] px-4 py-2 text-[9px] tracking-[0.25em] uppercase hover:bg-[#c9a632] transition-colors font-bold"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>

        {/* Add new item form */}
        <AnimatePresence>
          {addingItem === activeTab && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-[#E5E0D8] bg-[#C59B63]/[0.04] px-6 py-5"
            >
              <p className="text-[#C59B63]/70 text-[9px] tracking-[0.3em] uppercase mb-4">Nouveau service</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nom du service *"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="bg-white border border-[#C59B63]/20 px-3 py-2.5 text-[#1A1A1A] text-xs focus:border-[#C59B63]/50 outline-none"
                />
                <input
                  type="text"
                  placeholder="Prix (ex: 150 DH) *"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="bg-white border border-[#C59B63]/20 px-3 py-2.5 text-[#1A1A1A] text-xs focus:border-[#C59B63]/50 outline-none"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newItem.desc}
                  onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
                  className="bg-white border border-[#C59B63]/20 px-3 py-2.5 text-[#1A1A1A] text-xs focus:border-[#C59B63]/50 outline-none"
                />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!newItem.popular}
                    onChange={(e) => setNewItem({ ...newItem, popular: e.target.checked })}
                    className="accent-[#C59B63]"
                  />
                  <span className="text-[#1A1A1A]/50 text-[10px] tracking-wider">Populaire</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!newItem.fromPrice}
                    onChange={(e) => setNewItem({ ...newItem, fromPrice: e.target.checked })}
                    className="accent-[#C59B63]"
                  />
                  <span className="text-[#1A1A1A]/50 text-[10px] tracking-wider">À partir de</span>
                </label>
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => confirmAdd(activeTab)}
                    disabled={!newItem.name || !newItem.price}
                    className="flex items-center gap-1.5 bg-[#C59B63] text-[#040809] px-4 py-2 text-[9px] tracking-[0.2em] uppercase hover:bg-[#c9a632] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    <Save size={11} /> Ajouter
                  </button>
                  <button
                    onClick={() => setAddingItem(null)}
                    className="border border-[#C59B63]/20 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 px-3 py-2 text-[9px] tracking-wider transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items */}
        {cat.items.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#1A1A1A]/25 text-sm tracking-wider">
            Aucun service — cliquez sur "Ajouter"
          </div>
        ) : (
          cat.items.map((item, ii) => {
            const isEditing = editingItem?.catIdx === activeTab && editingItem?.itemIdx === ii;
            return (
              <div key={ii} className={`border-b border-[#C59B63]/8 last:border-b-0 transition-all duration-200 ${isEditing ? "bg-[#C59B63]/[0.04]" : "hover:bg-[#C59B63]/[0.02]"}`}>
                {isEditing && draftItem ? (
                  <div className="px-6 py-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[#C59B63]/50 text-[9px] tracking-[0.3em] uppercase block mb-1.5">Nom</label>
                        <input
                          autoFocus
                          type="text"
                          value={draftItem.name}
                          onChange={(e) => setDraftItem({ ...draftItem, name: e.target.value })}
                          className="w-full bg-white border border-[#C59B63]/25 px-3 py-2.5 text-[#1A1A1A] text-xs focus:border-[#C59B63]/55 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#C59B63]/50 text-[9px] tracking-[0.3em] uppercase block mb-1.5">Prix</label>
                        <input
                          type="text"
                          value={draftItem.price}
                          onChange={(e) => setDraftItem({ ...draftItem, price: e.target.value })}
                          className="w-full bg-white border border-[#C59B63]/25 px-3 py-2.5 text-[#1A1A1A] text-xs focus:border-[#C59B63]/55 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#C59B63]/50 text-[9px] tracking-[0.3em] uppercase block mb-1.5">Description</label>
                        <input
                          type="text"
                          value={draftItem.desc}
                          onChange={(e) => setDraftItem({ ...draftItem, desc: e.target.value })}
                          className="w-full bg-white border border-[#C59B63]/25 px-3 py-2.5 text-[#1A1A1A] text-xs focus:border-[#C59B63]/55 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!draftItem.popular} onChange={(e) => setDraftItem({ ...draftItem, popular: e.target.checked })} className="accent-[#C59B63]" />
                        <span className="text-[#1A1A1A]/50 text-[10px] tracking-wider flex items-center gap-1"><Star size={10} /> Populaire</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!draftItem.fromPrice} onChange={(e) => setDraftItem({ ...draftItem, fromPrice: e.target.checked })} className="accent-[#C59B63]" />
                        <span className="text-[#1A1A1A]/50 text-[10px] tracking-wider">À partir de</span>
                      </label>
                      <div className="flex gap-2 ml-auto">
                        <button onClick={saveEdit} className="flex items-center gap-1.5 bg-[#C59B63] text-[#040809] px-4 py-2 text-[9px] tracking-[0.2em] uppercase hover:bg-[#c9a632] transition-colors font-bold">
                          <Save size={11} /> Sauvegarder
                        </button>
                        <button onClick={cancelEdit} className="border border-[#C59B63]/20 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 px-3 py-2 text-[9px] tracking-wider transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-6 py-4">
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveItem(activeTab, ii, -1)} disabled={ii === 0} className="text-[#C59B63]/25 hover:text-[#C59B63]/60 disabled:opacity-20 transition-colors">
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => moveItem(activeTab, ii, 1)} disabled={ii === cat.items.length - 1} className="text-[#C59B63]/25 hover:text-[#C59B63]/60 disabled:opacity-20 transition-colors">
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#1A1A1A]/90 text-sm" style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}>{item.name}</span>
                        {item.popular && (
                          <span className="text-[#060b07] bg-[#C59B63] text-[7px] tracking-[0.2em] uppercase px-1.5 py-0.5 flex items-center gap-0.5">
                            <Star size={7} /> Populaire
                          </span>
                        )}
                        {item.fromPrice && (
                          <span className="border border-[#C59B63]/30 text-[#C59B63]/60 text-[7px] tracking-[0.15em] uppercase px-1.5 py-0.5">
                            à partir de
                          </span>
                        )}
                      </div>
                      <p className="text-[#1A1A1A]/30 text-[11px] truncate">{item.desc}</p>
                    </div>

                    {/* Price */}
                    <div className="text-[#C59B63] shrink-0" style={{ fontFamily: "Playfair Display, serif", fontSize: "1rem", fontWeight: 700 }}>
                      {item.price}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => startEdit(activeTab, ii)}
                        className="border border-[#C59B63]/20 text-[#C59B63]/50 hover:text-[#C59B63] hover:border-[#C59B63]/40 p-2 transition-all duration-200"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => deleteItem(activeTab, ii)}
                        className="border border-red-400/15 text-red-400/40 hover:text-red-400 hover:border-red-400/40 hover:bg-red-400/8 p-2 transition-all duration-200"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-[#1A1A1A]/20 text-[10px] tracking-wider text-center">
        Les modifications sont appliquées immédiatement sur la carte des prix du site.
      </p>
    </div>
  );
}
