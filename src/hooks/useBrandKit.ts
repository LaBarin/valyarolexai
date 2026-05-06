import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BrandKit = {
  id?: string;
  user_id?: string;
  business_name?: string | null;
  slogan?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  heading_font?: string | null;
  body_font?: string | null;
  default_cta?: string | null;
  logo_path?: string | null;
  default_voice_id?: string | null;
  default_music_mood?: string | null;
};

export function useBrandKit() {
  const { user } = useAuth();
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setKit(null);
      setLogoUrl(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setKit(data ?? null);

    if (data?.logo_path) {
      const { data: signed } = await supabase.storage
        .from("brand-assets")
        .createSignedUrl(data.logo_path, 60 * 60);
      setLogoUrl(signed?.signedUrl ?? null);
    } else {
      setLogoUrl(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { kit, logoUrl, loading, refresh };
}
