// Limitation du nombre de comptes créés depuis un même appareil.
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/hooks/usePresence";

export const MAX_ACCOUNTS_PER_DEVICE = 2;

export const DEVICE_LIMIT_MESSAGE =
  "Limite atteinte : cet appareil a déjà servi à créer 2 comptes. La création d'un nouveau compte est bloquée.";

const deviceInfo = () =>
  `${navigator.platform || ""} · ${navigator.userAgent.slice(0, 90)}`;

/** Nombre de comptes déjà créés depuis cet appareil (0 si indisponible). */
export async function countAccountsOnDevice(): Promise<number> {
  try {
    const { data, error } = await (supabase.rpc as never as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: number | null; error: unknown }>)("device_accounts_used", {
      _device_id: getDeviceId(),
    });
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

/** Vrai si l'appareil peut encore accueillir un nouveau compte. */
export async function canCreateAccountOnDevice(): Promise<boolean> {
  return (await countAccountsOnDevice()) < MAX_ACCOUNTS_PER_DEVICE;
}

/** Enregistre le compte fraîchement créé sur cet appareil. */
export async function registerAccountOnDevice(userId: string): Promise<void> {
  try {
    await (supabase.from("device_accounts" as never) as never as {
      insert: (v: Record<string, unknown>) => Promise<unknown>;
    }).insert({ device_id: getDeviceId(), user_id: userId, device_info: deviceInfo() });
  } catch {
    /* non bloquant */
  }
}
