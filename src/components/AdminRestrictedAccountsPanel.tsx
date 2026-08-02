import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShieldAlert,
  Search,
  Loader2,
  Mail,
  Phone,
  Globe2,
  Calendar,
  Smartphone,
  Clock,
  RotateCcw,
  Ban,
  Lock,
} from "lucide-react";

type RestrictedProfile = {
  user_id: string;
  name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  country_code: string | null;
  region: string | null;
  birth_date: string | null;
  gender: string | null;
  status: string;
  device_id: string | null;
  device_info: string | null;
  login_count: number | null;
  last_seen_at: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  blocked: { label: "Bloqué", className: "bg-rose-500/10 text-rose-300 border-rose-400/30" },
  restricted: { label: "Restreint", className: "bg-amber-500/10 text-amber-300 border-amber-400/30" },
};

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

/** Panneau d'administration des comptes restreints et bloqués. */
export default function AdminRestrictedAccountsPanel() {
  const [rows, setRows] = useState<RestrictedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "blocked" | "restricted">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id,name,full_name,email,phone,avatar_url,country_code,region,birth_date,gender,status,device_id,device_info,login_count,last_seen_at,created_at",
      )
      .in("status", ["blocked", "restricted"])
      .order("created_at", { ascending: false });
    if (error) toast.error("Chargement impossible : " + error.message);
    setRows((data || []) as RestrictedProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (userId: string, status: string) => {
    setBusy(userId);
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
    setBusy(null);
    if (error) { toast.error("Mise à jour impossible : " + error.message); return; }
    toast.success(status === "active" ? "Compte réactivé" : "Statut mis à jour");
    void load();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return [r.full_name, r.name, r.email, r.phone, r.country_code, r.device_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-rose-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold">Comptes restreints</h2>
          <p className="text-xs text-muted-foreground">
            Comptes bloqués ou en restriction, avec leurs informations complètes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, e-mail, téléphone, appareil)…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-foreground/[0.04] border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1 shrink-0">
          {(["all", "blocked", "restricted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 h-10 rounded-xl text-[11px] font-semibold border transition ${
                filter === f
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-foreground/[0.03] border-border/60 text-muted-foreground"
              }`}
            >
              {f === "all" ? "Tous" : STATUS_META[f].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Aucun compte restreint pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const meta = STATUS_META[r.status] ?? {
              label: r.status,
              className: "bg-foreground/5 text-foreground/70 border-border/60",
            };
            const displayName = r.full_name || r.name || "Utilisateur";
            return (
              <div key={r.user_id} className="rounded-2xl border border-border/60 bg-foreground/[0.03] p-3.5 space-y-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xs font-bold uppercase">{displayName.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{r.email || r.phone || r.user_id}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5 min-w-0"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{r.email || "—"}</span></span>
                  <span className="flex items-center gap-1.5 min-w-0"><Phone className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{r.phone || "—"}</span></span>
                  <span className="flex items-center gap-1.5 min-w-0"><Globe2 className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{[r.country_code, r.region].filter(Boolean).join(" · ") || "—"}</span></span>
                  <span className="flex items-center gap-1.5 min-w-0"><Calendar className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{r.birth_date || "—"} {r.gender ? `· ${r.gender}` : ""}</span></span>
                  <span className="flex items-center gap-1.5 min-w-0"><Smartphone className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{r.device_info || r.device_id || "Appareil inconnu"}</span></span>
                  <span className="flex items-center gap-1.5 min-w-0"><Clock className="w-3.5 h-3.5 shrink-0" /><span className="truncate">Vu : {fmt(r.last_seen_at)} · {r.login_count ?? 0} connexions</span></span>
                  <span className="flex items-center gap-1.5 min-w-0 sm:col-span-2"><Clock className="w-3.5 h-3.5 shrink-0" /><span className="truncate">Créé le {fmt(r.created_at)} · ID {r.user_id}</span></span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busy === r.user_id}
                    onClick={() => updateStatus(r.user_id, "active")}
                    className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-[11px] font-semibold bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Réactiver
                  </button>
                  {r.status !== "restricted" && (
                    <button
                      disabled={busy === r.user_id}
                      onClick={() => updateStatus(r.user_id, "restricted")}
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-[11px] font-semibold bg-amber-500/15 border border-amber-400/30 text-amber-300 disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" /> Restreindre
                    </button>
                  )}
                  {r.status !== "blocked" && (
                    <button
                      disabled={busy === r.user_id}
                      onClick={() => updateStatus(r.user_id, "blocked")}
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-[11px] font-semibold bg-rose-500/15 border border-rose-400/30 text-rose-300 disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" /> Bloquer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
