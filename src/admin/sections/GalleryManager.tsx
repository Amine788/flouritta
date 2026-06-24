import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload, X, CheckCircle2, AlertCircle, Trash2,
  ImageIcon, Loader2, ZoomIn, FileImage, ArrowDownToLine,
} from "lucide-react";
import {
  uploadPhotoWithProgress,
  fetchGalleryPhotos,
  deleteGalleryPhoto,
  type GalleryPhoto,
} from "../../lib/store";

// ─── Constantes ───────────────────────────────────────────────────────────────
const WEBP_QUALITY  = 0.85;        // qualité WebP recommandée
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo max côté client
const ACCEPTED_MIME = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/x-webp",
  "image/gif", "image/bmp", "image/tiff", "application/octet-stream"
];
const ALLOWED_EXTS  = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Conversion en WebP via Canvas API ───────────────────────────────────────
async function convertToWebP(file: File): Promise<{ blob: Blob; originalSize: number; webpSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas non supporté par ce navigateur"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Échec de la conversion WebP"));
            return;
          }
          resolve({ blob, originalSize: file.size, webpSize: blob.size });
        },
        "image/webp",
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image corrompue ou format non supporté"));
    };

    img.src = objectUrl;
  });
}

// ─── Types internes ───────────────────────────────────────────────────────────
type UploadStatus = "pending" | "converting" | "uploading" | "done" | "error";

interface FileEntry {
  id: string;
  originalFile: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;       // 0–100
  originalSize: number;
  webpSize: number | null;
  uploadedUrl: string | null;
  error: string | null;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function GalleryManager() {
  const [files, setFiles]         = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [gallery, setGallery]     = useState<GalleryPhoto[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError]     = useState<string | null>(null);
  const [lightbox, setLightbox]   = useState<GalleryPhoto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Chargement de la galerie existante ─────────────────────────────────────
  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const photos = await fetchGalleryPhotos();
      setGallery(photos);
    } catch (e) {
      setGalleryError((e as Error).message);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  // ── Traitement des fichiers sélectionnés ───────────────────────────────────
  const processFiles = useCallback((rawFiles: FileList | File[]) => {
    const arr = Array.from(rawFiles);

    const entries: FileEntry[] = arr
      .filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() || "";
        const isAcceptedMime = ACCEPTED_MIME.includes(f.type);
        const isAcceptedExt  = ALLOWED_EXTS.includes(ext);

        if (!isAcceptedMime && !isAcceptedExt) return false; // format non supporté
        if (f.size > MAX_FILE_SIZE) return false;           // trop volumineux
        return true;
      })
      .map((f) => ({
        id:           `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        originalFile: f,
        previewUrl:   URL.createObjectURL(f),
        status:       "pending" as UploadStatus,
        progress:     0,
        originalSize: f.size,
        webpSize:     null,
        uploadedUrl:  null,
        error:        null,
      }));

    setFiles((prev) => [...prev, ...entries]);
  }, []);

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  // ── Upload d'une seule entrée ──────────────────────────────────────────────
  const uploadEntry = useCallback(async (id: string) => {
    const entry = files.find((f) => f.id === id);
    if (!entry || entry.status !== "pending") return;

    // 1. Conversion WebP
    setFiles((prev) => prev.map((f) =>
      f.id === id ? { ...f, status: "converting", progress: 0 } : f
    ));

    let blob: Blob;
    let webpSize: number;

    try {
      const result = await convertToWebP(entry.originalFile);
      blob    = result.blob;
      webpSize = result.webpSize;
    } catch (e) {
      setFiles((prev) => prev.map((f) =>
        f.id === id ? { ...f, status: "error", error: (e as Error).message } : f
      ));
      return;
    }

    // 2. Création du fichier WebP avec nom horodaté
    const webpFile = new File(
      [blob],
      `photo-${Date.now()}.webp`,
      { type: "image/webp" }
    );

    setFiles((prev) => prev.map((f) =>
      f.id === id ? { ...f, status: "uploading", webpSize, progress: 0 } : f
    ));

    // 3. Upload avec progression XHR
    try {
      const url = await uploadPhotoWithProgress(webpFile, (pct) => {
        setFiles((prev) => prev.map((f) =>
          f.id === id ? { ...f, progress: pct } : f
        ));
      });

      setFiles((prev) => prev.map((f) =>
        f.id === id ? { ...f, status: "done", progress: 100, uploadedUrl: url } : f
      ));

      // Rafraîchit la galerie après upload réussi
      loadGallery();
    } catch (e) {
      setFiles((prev) => prev.map((f) =>
        f.id === id ? { ...f, status: "error", error: (e as Error).message } : f
      ));
    }
  }, [files, loadGallery]);

  // ── Upload de tous les fichiers en attente ─────────────────────────────────
  const uploadAll = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending");
    for (const entry of pending) {
      await uploadEntry(entry.id);
    }
  }, [files, uploadEntry]);

  // ── Suppression d'une photo de la galerie ─────────────────────────────────
  const handleDelete = async (photo: GalleryPhoto) => {
    if (!confirm(`Supprimer "${photo.filename}" ? Cette action est irréversible.`)) return;
    setDeletingId(photo.filename);
    try {
      await deleteGalleryPhoto(photo.filename);
      setGallery((prev) => prev.filter((p) => p.filename !== photo.filename));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Nettoyage des URLs object ──────────────────────────────────────────────
  const removeEntry = (id: string) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearDone = () => {
    setFiles((prev) => {
      prev.filter((f) => f.status === "done").forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return prev.filter((f) => f.status !== "done");
    });
  };

  const pendingCount  = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => ["converting","uploading"].includes(f.status)).length;
  const doneCount     = files.filter((f) => f.status === "done").length;
  const errorCount    = files.filter((f) => f.status === "error").length;

  return (
    <div className="space-y-8">

      {/* ── En-tête ── */}
      <div>
        <h2
          className="text-[#1A1A1A]/80 text-sm tracking-[0.25em] uppercase mb-1"
          style={{ fontFamily: "Raleway, sans-serif", fontWeight: 600 }}
        >
          Gestion de la Galerie
        </h2>
        <p className="text-[#1A1A1A]/30 text-xs" style={{ fontFamily: "Raleway, sans-serif" }}>
          Uploadez vos photos — elles sont automatiquement converties en WebP et publiées sur le site.
        </p>
      </div>

      {/* ── Zone de dépôt ── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-none cursor-pointer transition-all duration-300 p-10 text-center ${
          isDragging
            ? "border-[#C59B63]/70 bg-[#C59B63]/10"
            : "border-[#C59B63]/20 bg-[#C59B63]/3 hover:border-[#C59B63]/40 hover:bg-[#C59B63]/6"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          id="gallery-file-input"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        <motion.div
          animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={`w-16 h-16 border flex items-center justify-center transition-colors duration-300 ${
            isDragging ? "border-[#C59B63]/60 bg-[#C59B63]/15" : "border-[#C59B63]/25 bg-[#C59B63]/10"
          }`}>
            <Upload size={24} className={`transition-colors duration-300 ${isDragging ? "text-[#C59B63]" : "text-[#C59B63]/50"}`} />
          </div>

          <div>
            <p className="text-[#1A1A1A]/70 text-sm mb-1" style={{ fontFamily: "Raleway, sans-serif" }}>
              {isDragging ? "Relâchez pour ajouter les photos" : "Glissez vos photos ici"}
            </p>
            <p className="text-[#1A1A1A]/30 text-xs" style={{ fontFamily: "Raleway, sans-serif" }}>
              ou <span className="text-[#C59B63]/60 underline underline-offset-2">cliquez pour parcourir</span>
            </p>
            <p className="text-[#1A1A1A]/20 text-[10px] mt-2 tracking-wider uppercase">
              JPG · PNG · WebP · GIF · Max 5 Mo · Conversion WebP automatique
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── File d'attente ── */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Barre d'actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] tracking-wider uppercase">
                {pendingCount   > 0 && <span className="text-[#1A1A1A]/40">{pendingCount} en attente</span>}
                {uploadingCount > 0 && <span className="text-amber-400/80">{uploadingCount} en cours</span>}
                {doneCount      > 0 && <span className="text-emerald-400/80">{doneCount} terminé{doneCount > 1 ? "s" : ""}</span>}
                {errorCount     > 0 && <span className="text-red-400/80">{errorCount} erreur{errorCount > 1 ? "s" : ""}</span>}
              </div>
              <div className="flex gap-2">
                {doneCount > 0 && (
                  <button
                    onClick={clearDone}
                    className="text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 text-[10px] tracking-wider uppercase transition-colors"
                  >
                    Effacer terminés
                  </button>
                )}
                {pendingCount > 0 && uploadingCount === 0 && (
                  <button
                    onClick={uploadAll}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C59B63] hover:bg-[#C59B63]/90 text-[#060b07] text-[11px] tracking-[0.2em] uppercase font-semibold transition-colors"
                    style={{ fontFamily: "Raleway, sans-serif" }}
                  >
                    <ArrowDownToLine size={12} />
                    Uploader tout ({pendingCount})
                  </button>
                )}
              </div>
            </div>

            {/* Liste des fichiers */}
            <div className="space-y-2">
              <AnimatePresence>
                {files.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-4 bg-white border border-[#E5E0D8] p-3"
                  >
                    {/* Miniature */}
                    <div className="w-14 h-14 shrink-0 overflow-hidden bg-white">
                      <img
                        src={entry.previewUrl}
                        alt="aperçu"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[#1A1A1A]/70 text-xs truncate mb-1"
                        style={{ fontFamily: "Raleway, sans-serif" }}
                      >
                        {entry.originalFile.name}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-[#1A1A1A]/30">
                        <span>Original : {formatBytes(entry.originalSize)}</span>
                        {entry.webpSize !== null && (
                          <>
                            <span>→</span>
                            <span className={entry.webpSize < entry.originalSize ? "text-emerald-400/70" : "text-amber-400/70"}>
                              WebP : {formatBytes(entry.webpSize)}
                              {entry.webpSize < entry.originalSize && (
                                <span className="ml-1">
                                  (-{Math.round((1 - entry.webpSize / entry.originalSize) * 100)}%)
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Barre de progression */}
                      {(entry.status === "converting" || entry.status === "uploading") && (
                        <div className="mt-2">
                          <div className="h-0.5 bg-[#C59B63]/10 w-full">
                            <motion.div
                              className="h-full bg-[#C59B63]"
                              initial={{ width: "0%" }}
                              animate={{
                                width: entry.status === "converting"
                                  ? "30%"
                                  : `${Math.max(30, entry.progress)}%`
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-[9px] text-[#C59B63]/50 mt-1 tracking-wider uppercase">
                            {entry.status === "converting" ? "Conversion WebP…" : `Upload ${entry.progress}%`}
                          </p>
                        </div>
                      )}

                      {entry.status === "error" && (
                        <p className="text-red-400/80 text-[10px] mt-1">⚠ {entry.error}</p>
                      )}
                    </div>

                    {/* Statut + actions */}
                    <div className="shrink-0 flex items-center gap-2">
                      {entry.status === "pending" && (
                        <button
                          onClick={() => uploadEntry(entry.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#C59B63]/30 text-[#C59B63]/70 hover:text-[#C59B63] hover:border-[#C59B63]/60 text-[10px] tracking-wider uppercase transition-colors"
                        >
                          <Upload size={10} />
                          Upload
                        </button>
                      )}
                      {(entry.status === "converting" || entry.status === "uploading") && (
                        <Loader2 size={16} className="text-[#C59B63]/60 animate-spin" />
                      )}
                      {entry.status === "done" && (
                        <CheckCircle2 size={16} className="text-emerald-400/80" />
                      )}
                      {entry.status === "error" && (
                        <AlertCircle size={16} className="text-red-400/80" />
                      )}
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="text-[#1A1A1A]/20 hover:text-red-400/60 transition-colors p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Galerie existante ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#C59B63]/25" />
            <h3
              className="text-[#1A1A1A]/50 text-[10px] tracking-[0.35em] uppercase"
              style={{ fontFamily: "Raleway, sans-serif" }}
            >
              Photos publiées ({gallery.length})
            </h3>
          </div>
          <button
            onClick={loadGallery}
            className="text-[#C59B63]/40 hover:text-[#C59B63]/70 transition-colors"
            title="Rafraîchir"
          >
            <FileImage size={14} />
          </button>
        </div>

        {galleryLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white animate-pulse" />
            ))}
          </div>
        )}

        {galleryError && !galleryLoading && (
          <div className="flex items-center gap-3 p-4 border border-red-400/20 bg-red-400/5">
            <AlertCircle size={14} className="text-red-400/60 shrink-0" />
            <p className="text-red-400/70 text-xs">{galleryError}</p>
          </div>
        )}

        {!galleryLoading && !galleryError && gallery.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 border border-[#E5E0D8]">
            <ImageIcon size={28} className="text-[#C59B63]/20" />
            <p className="text-[#1A1A1A]/20 text-xs tracking-wider uppercase">
              Aucune photo uploadée
            </p>
          </div>
        )}

        {!galleryLoading && gallery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {gallery.map((photo, i) => (
                <motion.div
                  key={photo.filename}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="group relative aspect-square bg-white overflow-hidden"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay au survol */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Infos + actions */}
                  <div className="absolute inset-0 flex flex-col justify-between p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(photo)}
                        disabled={deletingId === photo.filename}
                        className="w-7 h-7 bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                        title="Supprimer"
                      >
                        {deletingId === photo.filename
                          ? <Loader2 size={11} className="animate-spin text-white" />
                          : <Trash2 size={11} className="text-white" />
                        }
                      </button>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[#1A1A1A]/70 text-[9px] leading-none">{formatBytes(photo.size)}</p>
                        <p className="text-[#1A1A1A]/40 text-[8px] mt-0.5">{formatDate(photo.created_at)}</p>
                      </div>
                      <button
                        onClick={() => setLightbox(photo)}
                        className="w-7 h-7 bg-[#C59B63]/20 border border-[#C59B63]/40 hover:bg-[#C59B63]/40 flex items-center justify-center transition-colors"
                      >
                        <ZoomIn size={11} className="text-[#C59B63]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1A1A1A]/90 flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.url}
                alt={lightbox.filename}
                className="max-h-[85vh] max-w-[90vw] object-contain"
              />
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#C59B63]/50" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#C59B63]/50" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-[#C59B63]/60 text-[9px] tracking-[0.25em] uppercase">
                  {lightbox.filename} — {formatBytes(lightbox.size)}
                </p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 bg-white border border-[#C59B63]/35 p-2 text-[#C59B63] hover:bg-[#C59B63]/12 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
