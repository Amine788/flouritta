import { useState, useEffect } from "react";
import { Phone, Save, Check, Loader2 } from "lucide-react";
import {
  getContactPhone,
  saveContactPhone,
  getDisplayPhone,
  saveDisplayPhone,
  saveAdminPassword,
} from "../../../lib/store";

export function Settings() {
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    Promise.all([getContactPhone(), getDisplayPhone()]).then(([wp, dp]) => {
      setWhatsappPhone(wp);
      setDisplayPhone(dp);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setPasswordError("");

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
    }

    setSaving(true);
    try {
      await saveContactPhone(whatsappPhone);
      await saveDisplayPhone(displayPhone);

      let passwordChanged = false;
      if (newPassword) {
        await saveAdminPassword(newPassword);
        passwordChanged = true;
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSaved(true);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (passwordChanged) {
        setTimeout(() => setPasswordSaved(false), 3000);
      }
    } catch (err) {
      setPasswordError("Erreur lors de l'enregistrement. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="text-[#D4AF37]/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#040809] border border-[#D4AF37]/10 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
            <Phone size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-[#f0ebe0] text-lg font-bold" style={{ fontFamily: "Playfair Display, serif" }}>
              Coordonnées de Contact
            </h2>
            <p className="text-[#f0ebe0]/30 text-xs tracking-wider uppercase mt-1">
              Gérez les numéros affichés sur le site
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* WhatsApp API Phone */}
          <div className="space-y-3">
            <label className="text-[#D4AF37]/60 text-[10px] tracking-[0.3em] uppercase block">
              Numéro WhatsApp (Format: 212xxxxxxxxx)
            </label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="212659659715"
              className="w-full bg-[#060b07] border border-[#D4AF37]/20 p-4 text-[#f0ebe0] focus:border-[#D4AF37]/50 outline-none transition-all"
            />
            <p className="text-[#f0ebe0]/20 text-[10px] leading-relaxed italic">
              * Ce numéro est utilisé pour les liens WhatsApp. Ne mettez pas de "+" ou d'espaces.
            </p>
          </div>

          {/* Display Phone */}
          <div className="space-y-3">
            <label className="text-[#D4AF37]/60 text-[10px] tracking-[0.3em] uppercase block">
              Numéro Affiché sur le site
            </label>
            <input
              type="text"
              value={displayPhone}
              onChange={(e) => setDisplayPhone(e.target.value)}
              placeholder="05 28 32 63 64"
              className="w-full bg-[#060b07] border border-[#D4AF37]/20 p-4 text-[#f0ebe0] focus:border-[#D4AF37]/50 outline-none transition-all"
            />
            <p className="text-[#f0ebe0]/20 text-[10px] leading-relaxed italic">
              * Ce numéro sera affiché dans la section contact et le pied de page.
            </p>
          </div>
        </div>

      <div className="mt-10 bg-[#040809] border border-[#D4AF37]/10 p-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#f0ebe0]/10 border border-[#f0ebe0]/20 flex items-center justify-center">
              <span className="text-[#f0ebe0] text-sm font-bold">P</span>
            </div>
            <div>
              <h2 className="text-[#f0ebe0] text-lg font-bold" style={{ fontFamily: "Playfair Display, serif" }}>
                Changer le mot de passe admin
              </h2>
              <p className="text-[#f0ebe0]/30 text-xs tracking-wider uppercase mt-1">
                Modifiez le mot de passe de connexion au panneau d'administration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[#D4AF37]/60 text-[10px] tracking-[0.3em] uppercase block">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez un nouveau mot de passe"
                className="w-full bg-[#060b07] border border-[#D4AF37]/20 p-4 text-[#f0ebe0] focus:border-[#D4AF37]/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[#D4AF37]/60 text-[10px] tracking-[0.3em] uppercase block">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="w-full bg-[#060b07] border border-[#D4AF37]/20 p-4 text-[#f0ebe0] focus:border-[#D4AF37]/50 outline-none transition-all"
              />
            </div>
          </div>
          {passwordError && (
            <div className="text-[#f87171] text-sm">{passwordError}</div>
          )}
          {passwordSaved && (
            <div className="text-emerald-400 text-sm">Mot de passe admin mis à jour avec succès.</div>
          )}
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-[#D4AF37]/10 flex justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 px-4 py-2 text-[10px] tracking-wider">
            <Check size={12} /> Enregistré
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 px-10 py-4 text-[10px] tracking-[0.3em] uppercase transition-all duration-300 bg-[#D4AF37] text-[#040809] hover:bg-[#c9a632] hover:shadow-xl hover:shadow-[#D4AF37]/10 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Enregistrement…</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>Enregistrer les modifications</span>
            </>
          )}
        </button>
      </div>
    </div>

    <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-6">
      <p className="text-[#D4AF37]/70 text-[11px] leading-relaxed">
        <span className="font-bold mr-2">Note :</span>
        Les modifications seront appliquées instantanément sur le site. Si vous ne voyez pas les changements, rafraîchissez la page du site public.
      </p>
    </div>
  </div>
  );
}
