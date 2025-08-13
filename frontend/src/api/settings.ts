// src/api/settings.ts
import { supabase } from "@/lib/supabase";
import type { HubSettings, WipLimits } from "@/lib/types";

const DEFAULT_SETTINGS: HubSettings = {
  id: "default",
  wip_enabled: false,
  wip_limits: {},
  updated_at: new Date().toISOString(),
};

export async function getSettings(): Promise<HubSettings> {
  const { data, error } = await supabase
    .from("hub_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle(); // <- não estoura erro se não existir

  if (error) {
    console.warn("[settings] erro ao buscar, usando defaults:", error);
    return DEFAULT_SETTINGS;
  }
  if (!data) {
    // opcionalmente já cria o registro default no primeiro acesso
    const { data: created, error: upErr } = await supabase
      .from("hub_settings")
      .insert({ id: "default", wip_enabled: false, wip_limits: {} })
      .select()
      .single();
    if (upErr) {
      console.warn("[settings] falhou ao criar default, usando em memória:", upErr);
      return DEFAULT_SETTINGS;
    }
    return created as HubSettings;
  }
  return data as HubSettings;
}

export async function saveSettings(patch: Partial<HubSettings>): Promise<HubSettings> {
  const { data, error } = await supabase
    .from("hub_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", "default")
    .select()
    .single();
  if (error) throw error;
  return data as HubSettings;
}

export async function setWipEnabled(enabled: boolean) {
  return saveSettings({ wip_enabled: enabled });
}

export async function setWipLimits(limits: WipLimits) {
  return saveSettings({ wip_limits: limits as any });
}
