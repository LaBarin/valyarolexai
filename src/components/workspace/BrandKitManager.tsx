import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Save, Loader2, Palette, Type, Phone, Globe, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandKit, type BrandKit } from "@/hooks/useBrandKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const FONT_OPTIONS = [
  "Space Grotesk", "Inter", "Plus Jakarta Sans", "Poppins", "Montserrat",
  "Playfair Display", "Lora", "DM Sans", "Manrope", "Outfit",
];
const MUSIC_MOODS = ["cinematic", "upbeat", "corporate", "luxury", "dramatic", "chill", "epic"];

const empty: BrandKit = {
  business_name: "",
  slogan: "",
  website: "",
  phone: "",
  email: "",
  address: "",
  primary_color: "#00d4ff",
  secondary_color: "#0ea5e9",
  accent_color: "#f59e0b",
  heading_font: "Space Grotesk",
  body_font: "Inter",
  default_cta: "Learn More",
  default_music_mood: "cinematic",
};

export default function BrandKitManager() {
  const { user } = useAuth();
  const { kit, logoUrl, loading, refresh } = useBrandKit();
  const [form, setForm] = useState<BrandKit>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (kit) setForm({ ...empty, ...kit });
  }, [kit]);

  const set = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Logo must be under 4MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      // Remove previous logo if it exists and is different
      if (form.logo_path && form.logo_path !== path) {
        await supabase.storage.from("brand-assets").remove([form.logo_path]);
      }
      set("logo_path", path);
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (form.logo_path) {
      await supabase.storage.from("brand-assets").remove([form.logo_path]);
    }
    set("logo_path", null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { ...form, user_id: user.id };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;
      const { error } = await supabase
        .from("brand_kits")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Brand kit saved — auto-applied to new ads");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Brand Kit
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set your brand once. It auto-applies to every new ad, video, deck, and campaign you create.
        </p>
      </div>

      {/* Logo + Identity */}
      <Card className="p-6 space-y-5 bg-card/40 border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" /> Identity
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-xl border border-dashed border-border/60 bg-background/40 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Brand logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  disabled={uploading}
                />
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {logoUrl ? "Replace" : "Upload"}
                </span>
              </label>
              {logoUrl && (
                <button
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>

          {/* Name + slogan */}
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Business name</Label>
              <Input value={form.business_name ?? ""} onChange={(e) => set("business_name", e.target.value)} placeholder="Acme Coffee Co." maxLength={120} />
            </div>
            <div>
              <Label className="text-xs">Slogan / tagline</Label>
              <Input value={form.slogan ?? ""} onChange={(e) => set("slogan", e.target.value)} placeholder="Roasted with care, served with love." maxLength={160} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Default CTA button text</Label>
              <Input value={form.default_cta ?? ""} onChange={(e) => set("default_cta", e.target.value)} placeholder="Learn More" maxLength={40} />
            </div>
          </div>
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-6 space-y-4 bg-card/40 border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" /> Contact
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Website</Label>
            <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://acmecoffee.com" maxLength={255} />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 123-4567" maxLength={40} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="hello@acmecoffee.com" maxLength={255} />
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City" maxLength={255} />
          </div>
        </div>
      </Card>

      {/* Colors */}
      <Card className="p-6 space-y-4 bg-card/40 border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Palette className="w-3.5 h-3.5" /> Colors
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {(["primary_color", "secondary_color", "accent_color"] as const).map((k, i) => (
            <div key={k}>
              <Label className="text-xs">{["Primary", "Secondary", "Accent"][i]}</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form[k] ?? "#000000"}
                  onChange={(e) => set(k, e.target.value)}
                  className="w-12 h-10 rounded-md border border-border/40 bg-background cursor-pointer"
                />
                <Input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className="font-mono text-xs" maxLength={7} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Typography + Voice */}
      <Card className="p-6 space-y-4 bg-card/40 border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Type className="w-3.5 h-3.5" /> Typography & Voice
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Heading font</Label>
            <Select value={form.heading_font ?? ""} onValueChange={(v) => set("heading_font", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Body font</Label>
            <Select value={form.body_font ?? ""} onValueChange={(v) => set("body_font", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Default music mood</Label>
            <Select value={form.default_music_mood ?? ""} onValueChange={(v) => set("default_music_mood", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MUSIC_MOODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Default voice ID (ElevenLabs)</Label>
            <Input value={form.default_voice_id ?? ""} onChange={(e) => set("default_voice_id", e.target.value)} placeholder="Optional — pick from Voiceover Studio" maxLength={64} />
          </div>
        </div>
      </Card>

      {/* Live preview */}
      <Card className="p-6 bg-gradient-to-br from-background to-card/60 border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Preview</div>
        <div
          className="rounded-xl p-6 flex items-center gap-4"
          style={{
            background: `linear-gradient(135deg, ${form.primary_color}22, ${form.secondary_color}22)`,
            borderLeft: `4px solid ${form.primary_color}`,
          }}
        >
          {logoUrl && <img src={logoUrl} alt="" className="w-14 h-14 rounded-lg object-contain bg-background/40 p-1" />}
          <div className="flex-1 min-w-0">
            <div style={{ fontFamily: form.heading_font ?? undefined, color: form.primary_color ?? undefined }} className="text-xl font-bold truncate">
              {form.business_name || "Your business name"}
            </div>
            <div style={{ fontFamily: form.body_font ?? undefined }} className="text-sm text-muted-foreground truncate">
              {form.slogan || "Your tagline appears here"}
            </div>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full text-white whitespace-nowrap"
            style={{ background: form.accent_color ?? undefined }}
          >
            {form.default_cta || "CTA"}
          </span>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save brand kit
        </Button>
      </div>
    </motion.div>
  );
}
