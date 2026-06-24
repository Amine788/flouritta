import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, Save, Check, Edit2, X, Crown, Star,
  ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import {
  getPricing, savePricing,
  type PricingCategory, type PriceItem,
} from "../../../lib/store";

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
        <Loader2 size={32} className="text-[#D4AF37]/40 animate-spin" />
      </div>
    );
  }

  const cat = categories[activeTab];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#f0ebe0] text-xl" style={{ fontFamily: "Playfair Display, serif", fontWeight: 700 }}>
            Gestion des Tarifs
          </h2>
          <p className="text-[#f0ebe0]/40 text-xs tracking-wider mt-1">
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
            className={`flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all duration-200 border ${
              activeTab === i
                ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-[#D4AF37]/15 text-[#f0ebe0]/45 hover:border-[#D4AF37]/35 hover:text-[#f0ebe0]/70"
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
            {c.id === "vip" && <Crown size={10} />}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="bg-[#0a110a] border border-[#D4AF37]/12 overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/10 bg-[#040908]">
          <div className="flex items-center gap-3">
            <span className="text-[#D4AF37] text-lg">{cat.icon}</span>
            <h3 className="text-[#f0ebe0]" style={{ fontFamily: "Playfair Display, serif", fontSize: "1rem", fontWeight: 700 }}>
              {cat.label}
            </h3>
            <span className="text-[#f0ebe0]/20 text-[10px]">— {cat.items.length} service{cat.items.length > 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={() => { setAddingItem(activeTab); setEditingItem(null); }}
            className="flex items-center gap-2 bg-[#D4AF37] text-[#040809] px-4 py-2 text-[9px] tracking-[0.25em] uppercase hover:bg-[#c9a632] transition-colors font-bold"
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
              className="border-b border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] px-6 py-5"
            >
              <p className="text-[#D4AF37]/70 text-[9px] tracking-[0.3em] uppercase mb-4">Nouveau service</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nom du service *"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="bg-[#040809] border border-[#D4AF37]/20 px-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/50 outline-none"
                />
                <input
                  type="text"
                  placeholder="Prix (ex: 150 DH) *"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="bg-[#040809] border border-[#D4AF37]/20 px-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/50 outline-none"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newItem.desc}
                  onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
                  className="bg-[#040809] border border-[#D4AF37]/20 px-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/50 outline-none"
                />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!newItem.popular}
                    onChange={(e) => setNewItem({ ...newItem, popular: e.target.checked })}
                    className="accent-[#D4AF37]"
                  />
                  <span className="text-[#f0ebe0]/50 text-[10px] tracking-wider">Populaire</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!newItem.fromPrice}
                    onChange={(e) => setNewItem({ ...newItem, fromPrice: e.target.checked })}
                    className="accent-[#D4AF37]"
                  />
                  <span className="text-[#f0ebe0]/50 text-[10px] tracking-wider">À partir de</span>
                </label>
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => confirmAdd(activeTab)}
                    disabled={!newItem.name || !newItem.price}
                    className="flex items-center gap-1.5 bg-[#D4AF37] text-[#040809] px-4 py-2 text-[9px] tracking-[0.2em] uppercase hover:bg-[#c9a632] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
                  >
                    <Save size={11} /> Ajouter
                  </button>
                  <button
                    onClick={() => setAddingItem(null)}
                    className="border border-[#D4AF37]/20 text-[#f0ebe0]/40 hover:text-[#f0ebe0]/70 px-3 py-2 text-[9px] tracking-wider transition-colors"
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
          <div className="px-6 py-12 text-center text-[#f0ebe0]/25 text-sm tracking-wider">
            Aucun service — cliquez sur "Ajouter"
          </div>
        ) : (
          cat.items.map((item, ii) => {
            const isEditing = editingItem?.catIdx === activeTab && editingItem?.itemIdx === ii;
            return (
              <div key={ii} className={`border-b border-[#D4AF37]/8 last:border-b-0 transition-all duration-200 ${isEditing ? "bg-[#D4AF37]/[0.04]" : "hover:bg-[#D4AF37]/[0.02]"}`}>
                {isEditing && draftItem ? (
                  <div className="px-6 py-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[#D4AF37]/50 text-[9px] tracking-[0.3em] uppercase block mb-1.5">Nom</label>
                        <input
                          autoFocus
                          type="text"
                          value={draftItem.name}
                          onChange={(e) => setDraftItem({ ...draftItem, name: e.target.value })}
                          className="w-full bg-[#040809] border border-[#D4AF37]/25 px-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/55 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#D4AF37]/50 text-[9px] tracking-[0.3em] uppercase block mb-1.5">Prix</label>
                        <input
                          type="text"
                          value={draftItem.price}
                          onChange={(e) => setDraftItem({ ...draftItem, price: e.target.value })}
                          className="w-full bg-[#040809] border border-[#D4AF37]/25 px-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/55 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#D4AF37]/50 text-[9px] tracking-[0.3em] uppercase block mb-1.5">Description</label>
                        <input
                          type="text"
                          value={draftItem.desc}
                          onChange={(e) => setDraftItem({ ...draftItem, desc: e.target.value })}
                          className="w-full bg-[#040809] border border-[#D4AF37]/25 px-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/55 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!draftItem.popular} onChange={(e) => setDraftItem({ ...draftItem, popular: e.target.checked })} className="accent-[#D4AF37]" />
                        <span className="text-[#f0ebe0]/50 text-[10px] tracking-wider flex items-center gap-1"><Star size={10} /> Populaire</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!draftItem.fromPrice} onChange={(e) => setDraftItem({ ...draftItem, fromPrice: e.target.checked })} className="accent-[#D4AF37]" />
                        <span className="text-[#f0ebe0]/50 text-[10px] tracking-wider">À partir de</span>
                      </label>
                      <div className="flex gap-2 ml-auto">
                        <button onClick={saveEdit} className="flex items-center gap-1.5 bg-[#D4AF37] text-[#040809] px-4 py-2 text-[9px] tracking-[0.2em] uppercase hover:bg-[#c9a632] transition-colors font-bold">
                          <Save size={11} /> Sauvegarder
                        </button>
                        <button onClick={cancelEdit} className="border border-[#D4AF37]/20 text-[#f0ebe0]/40 hover:text-[#f0ebe0]/70 px-3 py-2 text-[9px] tracking-wider transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-6 py-4">
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveItem(activeTab, ii, -1)} disabled={ii === 0} className="text-[#D4AF37]/25 hover:text-[#D4AF37]/60 disabled:opacity-20 transition-colors">
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => moveItem(activeTab, ii, 1)} disabled={ii === cat.items.length - 1} className="text-[#D4AF37]/25 hover:text-[#D4AF37]/60 disabled:opacity-20 transition-colors">
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#f0ebe0]/90 text-sm" style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}>{item.name}</span>
                        {item.popular && (
                          <span className="text-[#060b07] bg-[#D4AF37] text-[7px] tracking-[0.2em] uppercase px-1.5 py-0.5 flex items-center gap-0.5">
                            <Star size={7} /> Populaire
                          </span>
                        )}
                        {item.fromPrice && (
                          <span className="border border-[#D4AF37]/30 text-[#D4AF37]/60 text-[7px] tracking-[0.15em] uppercase px-1.5 py-0.5">
                            à partir de
                          </span>
                        )}
                      </div>
                      <p className="text-[#f0ebe0]/30 text-[11px] truncate">{item.desc}</p>
                    </div>

                    {/* Price */}
                    <div className="text-[#D4AF37] shrink-0" style={{ fontFamily: "Playfair Display, serif", fontSize: "1rem", fontWeight: 700 }}>
                      {item.price}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => startEdit(activeTab, ii)}
                        className="border border-[#D4AF37]/20 text-[#D4AF37]/50 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 p-2 transition-all duration-200"
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

      <p className="text-[#f0ebe0]/20 text-[10px] tracking-wider text-center">
        Les modifications sont appliquées immédiatement sur la carte des prix du site.
      </p>
    </div>
  );
}
