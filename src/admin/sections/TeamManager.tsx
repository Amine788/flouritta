import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Save, Edit2, X, Check, ImageIcon, User, Plus, Trash2, Loader2, Upload } from "lucide-react";
import { getBarbers, saveBarbers, uploadPhoto, getImageUrl, type Barber } from "../../../lib/store";

const parsePhotoPosition = (value?: string) => {
  if (!value) return { x: 50, y: 50 };
  const normalized = value.trim().toLowerCase();
  const presets: Record<string, { x: number; y: number }> = {
    center: { x: 50, y: 50 },
    top: { x: 50, y: 0 },
    bottom: { x: 50, y: 100 },
    left: { x: 0, y: 50 },
    right: { x: 100, y: 50 },
    "top left": { x: 0, y: 0 },
    "top right": { x: 100, y: 0 },
    "bottom left": { x: 0, y: 100 },
    "bottom right": { x: 100, y: 100 },
  };
  if (presets[normalized]) return presets[normalized];

  const match = normalized.match(/^(\d+)%\s*(\d+)%$/);
  if (match) {
    return { x: Number(match[1]), y: Number(match[2]) };
  }

  return { x: 50, y: 50 };
};

const formatPhotoPosition = (x: number, y: number) => `${x}% ${y}%`;

const WEBP_QUALITY = 0.85;

async function convertToWebP(file: File): Promise<{ blob: Blob }> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (file.type === "image/webp" || file.type === "image/x-webp" || ext === "webp") {
      resolve({ blob: file });
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas non supporté"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Échec conversion"));
            return;
          }
          resolve({ blob });
        },
        "image/webp",
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image invalide"));
    };

    img.src = objectUrl;
  });
}

export function TeamManager() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Barber | null>(null);
  const [saved, setSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const triggerPhotoUpload = (index: number) => {
    setActiveUploadIndex(index);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const updatePhotoPosition = (x: number, y: number) => {
    if (!draft) return;
    setDraft({ ...draft, photoPosition: formatPhotoPosition(x, y) });
  };

  const handlePreviewPointer = (clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)));
    updatePhotoPosition(x, y);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handlePreviewPointer(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handlePreviewPointer(e.clientX, e.clientY);
  };

  const stopDragging = () => setIsDragging(false);

  useEffect(() => {
    getBarbers().then((data) => {
      setBarbers(data);
      setLoading(false);
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editingId !== null && draft) {
      setUploading(true);
      try {
        let fileToSend = file;
        try {
          const { blob } = await convertToWebP(file);
          fileToSend = new File([blob], `barber-${Date.now()}.webp`, { type: "image/webp" });
        } catch (err) {
          console.warn("Échec conversion WebP client, envoi image originale", err);
        }

        const url = await uploadPhoto(fileToSend);
        setDraft({ ...draft, photo: url });
      } catch (err) {
        alert("Erreur lors de l'upload de l'image");
        console.error(err);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return;
    }

    if (activeUploadIndex === null) return;
    const targetIndex = activeUploadIndex;

    setUploading(true);
    try {
      let fileToSend = file;
      try {
        const { blob } = await convertToWebP(file);
        fileToSend = new File([blob], `barber-${Date.now()}.webp`, { type: "image/webp" });
      } catch (err) {
        console.warn("Échec conversion WebP client, envoi image originale", err);
      }

      const url = await uploadPhoto(fileToSend);
      
      const updated = barbers.map((b, i) => i === targetIndex ? { ...b, photo: url } : b);
      await saveBarbers(updated);
      setBarbers(updated);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Erreur lors de l'upload de l'image");
      console.error(err);
    } finally {
      setUploading(false);
      setActiveUploadIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startEdit = (index: number) => {
    setEditingId(index);
    setDraft({ ...barbers[index] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (draft === null || editingId === null) return;
    const updated = barbers.map((b, i) => (i === editingId ? draft : b));
    setSaving(true);
    try {
      await saveBarbers(updated);
      setBarbers(updated);
      setEditingId(null);
      setDraft(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const addMember = async () => {
    const newBarber: Barber = {
      name:          "Nouveau Barbier",
      title:         "Expert Barber",
      specialty:     "Spécialiste Coupe & Style",
      experience:    "5+ Ans",
      photo:         "",
      tag:           "Expert Barber",
      photoPosition: "50% 50%",
    };
    const updated = [...barbers, newBarber];
    setBarbers(updated);
    await saveBarbers(updated);
    startEdit(updated.length - 1);
  };

  const deleteMember = async (index: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce barbier ?")) return;
    const updated = barbers.filter((_, i) => i !== index);
    setBarbers(updated);
    await saveBarbers(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="text-[#D4AF37]/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[#f0ebe0] text-xl"
            style={{ fontFamily: "Playfair Display, serif", fontWeight: 700 }}
          >
            Gestion de l'Équipe
          </h2>
          <p className="text-[#f0ebe0]/40 text-xs tracking-wider mt-1">
            Gérez les barbiers qui apparaissent sur le site
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 px-4 py-2 text-[10px] tracking-wider"
            >
              <Check size={12} /> Sauvegardé avec succès
            </motion.div>
          )}
          <button
            onClick={addMember}
            className="flex items-center gap-2 bg-[#D4AF37] text-[#040809] px-5 py-2.5 text-[10px] tracking-widest uppercase font-bold hover:bg-[#c9a632] transition-colors"
          >
            <Plus size={14} /> Ajouter un membre
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {barbers.map((barber, index) => {
            const isEditing = editingId === index;
            const current = isEditing && draft ? draft : barber;

            return (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-[#0a110a] border transition-all duration-300 overflow-hidden relative ${
                  isEditing ? "border-[#D4AF37]/40" : "border-[#D4AF37]/10 hover:border-[#D4AF37]/25"
                }`}
              >
                  {/* Photo */}
                <div className="relative h-52 overflow-hidden bg-[#040809] group/photo">
                  {current.photo ? (
                    <img
                      src={getImageUrl(current.photo)}
                      alt={current.name}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: current.photoPosition ?? 'center' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={40} className="text-[#D4AF37]/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a110a] to-transparent pointer-events-none" />
                  
                  {/* Overlay upload photo : visible si en édition OU au survol en mode normal */}
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ${
                    isEditing ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover/photo:opacity-100 pointer-events-none group-hover/photo:pointer-events-auto"
                  }`}>
                    <button 
                      onClick={() => triggerPhotoUpload(index)}
                      disabled={uploading}
                      className="flex flex-col items-center gap-2 text-[#D4AF37] hover:text-[#f0ebe0] transition-colors"
                    >
                      {uploading && (isEditing ? editingId === index : activeUploadIndex === index) ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <Upload size={20} />
                          <span className="text-[9px] uppercase tracking-widest font-bold">Changer la photo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions buttons */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => deleteMember(index)}
                          className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-500 p-2 hover:bg-red-500/20 transition-all duration-200"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          onClick={() => startEdit(index)}
                          className="bg-[#040809]/80 backdrop-blur-sm border border-[#D4AF37]/30 text-[#D4AF37] p-2 hover:bg-[#D4AF37]/15 transition-all duration-200"
                        >
                          <Edit2 size={13} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Name overlay */}
                  <div className="absolute bottom-3 left-3">
                    <div
                      className="text-[#f0ebe0] text-base"
                      style={{ fontFamily: "Playfair Display, serif", fontWeight: 700 }}
                    >
                      {current.name}
                    </div>
                    <div className="text-[#D4AF37]/60 text-[9px] tracking-[0.25em] uppercase mt-0.5">
                      {current.title}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {isEditing && draft ? (
                    <div className="space-y-3">
                      {/* Name field */}
                      <div>
                        <label className="text-[#D4AF37]/55 text-[9px] tracking-[0.3em] uppercase block mb-1.5">
                          Nom du barbier
                        </label>
                        <div className="relative">
                          <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 pointer-events-none" />
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            className="w-full bg-[#040809] border border-[#D4AF37]/20 pl-8 pr-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/50 outline-none transition-colors"
                            placeholder="Nom du barbier"
                          />
                        </div>
                      </div>

                      {/* Specialty field */}
                      <div className="pt-2">
                        <label className="text-[#D4AF37]/55 text-[9px] tracking-[0.3em] uppercase block mb-1.5">
                          Spécialité
                        </label>
                        <input
                          type="text"
                          value={draft.specialty}
                          onChange={(e) => setDraft({ ...draft, specialty: e.target.value })}
                          className="w-full bg-[#040809] border border-[#D4AF37]/20 px-3 py-2.5 text-[#f0ebe0] text-xs focus:border-[#D4AF37]/50 outline-none transition-colors"
                          placeholder="Spécialité"
                        />
                      </div>

                    <div className="pt-2">
                      <label className="text-[#D4AF37]/55 text-[9px] tracking-[0.3em] uppercase block mb-1.5">
                        Ajustement du cadrage
                      </label>
                      <div
                        ref={previewRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={stopDragging}
                        onMouseLeave={stopDragging}
                        className={`relative mx-auto max-w-[320px] aspect-square overflow-hidden rounded-lg border border-[#D4AF37]/20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} bg-[#040809]`}
                      >
                        {draft.photo ? (
                          <img
                            src={getImageUrl(draft.photo)}
                            alt={draft.name}
                            className="w-full h-full object-cover transition-transform duration-300"
                            style={{ objectPosition: draft.photoPosition ?? 'center' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/30">
                            <User size={28} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030706]/95 via-[#030706]/30 to-transparent pointer-events-none" />
                        <div className="absolute top-4 left-4">
                          <span
                            className="bg-[#D4AF37]/15 backdrop-blur-sm border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-1 text-[9px] tracking-[0.25em] uppercase"
                            style={{ fontFamily: 'Raleway, sans-serif' }}
                          >
                            {draft.tag}
                          </span>
                        </div>
                        {([draft.name, draft.title, draft.tag].some((value) => value?.toLowerCase().includes('directeur'))) && (
                          <div className="absolute top-4 right-4">
                            <span
                              className="bg-white/10 border border-white/20 text-white px-2 py-1 text-[8px] tracking-[0.35em] uppercase"
                              style={{ fontFamily: 'Raleway, sans-serif' }}
                            >
                              Directeur
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-left pointer-events-none">
                          <div className="text-[#f0ebe0] text-sm" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
                            {draft.name}
                          </div>
                          <div className="text-[#D4AF37]/70 text-[10px] tracking-[0.2em] uppercase mt-1" style={{ fontFamily: 'Raleway, sans-serif' }}>
                            {draft.title}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3">
                        {[
                          { label: 'Haut', value: '50% 0%' },
                          { label: 'Bas', value: '50% 100%' },
                          { label: 'Centre', value: '50% 50%' },
                          { label: 'Gauche', value: '0% 50%' },
                          { label: 'Droite', value: '100% 50%' },
                          { label: 'Centre haut', value: '50% 20%' },
                        ].map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => setDraft({ ...draft, photoPosition: option.value })}
                            className="rounded-md border border-[#D4AF37]/20 bg-[#040809]/80 px-2 py-2 text-[9px] uppercase tracking-[0.25em] text-[#f0ebe0] transition-all hover:border-[#D4AF37]/40"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#D4AF37] text-[#040809] py-2.5 text-[9px] tracking-[0.25em] uppercase hover:bg-[#c9a632] transition-colors font-bold disabled:opacity-60"
                      >
                        {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                        Sauvegarder
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center justify-center gap-1.5 border border-[#D4AF37]/20 text-[#f0ebe0]/40 hover:text-[#f0ebe0]/70 px-3 py-2.5 text-[9px] tracking-wider uppercase transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                  ) : (
                    <div>
                      <p className="text-[#f0ebe0]/45 text-[10px] leading-relaxed">
                        {barber.specialty}
                      </p>
                      <button
                        onClick={() => startEdit(index)}
                        className="mt-3 w-full flex items-center justify-center gap-2 border border-[#D4AF37]/20 text-[#D4AF37]/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 py-2.5 text-[9px] tracking-[0.25em] uppercase transition-all duration-200"
                      >
                        <Edit2 size={11} /> Modifier
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="text-[#f0ebe0]/20 text-[10px] tracking-wider text-center pt-2">
        Les modifications sont appliquées immédiatement sur le site et dans la page de réservation.
      </p>
      {/* Input de fichier unique et global pour éviter les doublons de refs dans la boucle */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
