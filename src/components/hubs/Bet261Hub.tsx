import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Search, Zap, Flame, X } from "lucide-react";
import { toast } from "sonner";
import aviatorLogo from "@/assets/logo-aviator.png";
import cosmoxLogo from "@/assets/logo-cosmox.png";
import jetxLogo from "@/assets/logo-jetx.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FEATURED_REGIONS, REGIONS, groupByContinent } from "@/lib/regions";

import type { GameStats } from "@/hooks/useGameStats";

export interface Bet261GameCard {
  id: string;
  name: string;
  logo: string;
  description: string;
  available: boolean;
  premium?: boolean;
  route: string;
  /** token de couleur néon */
  tone: "aviator" | "jetx" | "cosmox";
}

export const BET261_GAMES: Bet261GameCard[] = [
  { id: "aviator", name: "Aviator", logo: aviatorLogo, description: "Basique & Pro", available: true, route: "/aviator", tone: "aviator" },
  { id: "jetx",    name: "JetX",    logo: jetxLogo,    description: "Vol premium",   available: true, route: "/jetx",    tone: "jetx" },
  { id: "cosmox",  name: "CosmoX",  logo: cosmoxLogo,  description: "Cosmique",      available: true, route: "/cosmox",  tone: "cosmox" },
];

interface Props {
  gameStats: GameStats[];
  mostPopular: string | null;
  onTrack: (id: string) => void;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="px-1 text-[11px] font-black tracking-[0.18em] uppercase text-muted-foreground">{children}</h3>
);

const Bet261Hub = ({ gameStats, mostPopular, onTrack }: Props) => {
  const navigate = useNavigate();
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? REGIONS.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)) : REGIONS;
    return groupByContinent(list);
  }, [query]);

  const handleClick = (g: Bet261GameCard) => {
    if (!g.available) { toast.info("Ce jeu est actuellement indisponible"); return; }
    onTrack(g.id);
    navigate(g.route);
  };

  return (
    <section aria-label="Jeux principaux" className="space-y-5">
      {/* ---------------- JEUX PRINCIPAUX ---------------- */}
      <div className="space-y-3">
        <SectionTitle>Jeux principaux</SectionTitle>

        <div className="grid grid-cols-3 gap-3">
          {BET261_GAMES.map((g, i) => {
            const stat = gameStats.find((s) => s.game_name === g.id);
            const hot = mostPopular === g.id;
            const tone = `var(--game-${g.tone})`;
            const deep = `var(--game-${g.tone}-deep)`;
            return (
              <button
                key={g.id}
                onClick={() => handleClick(g)}
                disabled={!g.available}
                aria-label={g.name}
                className={`group relative flex flex-col items-center justify-between gap-2 rounded-[26px] border p-3 pt-4 overflow-hidden
                  transition-all duration-300 will-change-transform active:scale-[0.96] hover:scale-[1.04] hover:-translate-y-0.5
                  ${!g.available ? "opacity-40 grayscale cursor-not-allowed" : ""}`}
                style={{
                  animation: `region-in 0.5s cubic-bezier(0.16,1,0.3,1) ${100 + i * 80}ms both`,
                  borderColor: `hsl(${tone} / 0.45)`,
                  background: `radial-gradient(120% 90% at 50% 0%, hsl(${tone} / 0.28), transparent 62%), linear-gradient(165deg, hsl(${deep} / 0.95), hsl(0 0% 4% / 0.98))`,
                  boxShadow: `0 14px 34px -16px hsl(${tone} / 0.6), inset 0 1px 0 hsl(${tone} / 0.25)`,
                }}
              >
                {/* halo néon au survol */}
                <span
                  className="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `0 0 0 1px hsl(${tone} / 0.65), 0 0 28px hsl(${tone} / 0.45)` }}
                />
                {/* balayage lumineux */}
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
                  <span
                    className="absolute top-0 h-full w-1/3 opacity-0 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(100deg, transparent, hsl(${tone} / 0.25), transparent)`,
                      animation: "neon-sweep 1.4s ease-in-out infinite",
                    }}
                  />
                </span>

                {hot && (
                  <span
                    className="absolute top-1.5 left-1.5 z-10 text-[7px] px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5 text-foreground"
                    style={{ background: `hsl(${tone} / 0.85)`, boxShadow: `0 0 12px hsl(${tone} / 0.6)` }}
                  >
                    <Flame className="w-2 h-2" /> Hot
                  </span>
                )}
                {g.available && (
                  <span
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full live-dot"
                    style={{ background: `hsl(${tone})`, boxShadow: `0 0 10px hsl(${tone} / 0.9)` }}
                  />
                )}

                <div className="relative">
                  <span
                    className="absolute inset-[-10px] rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ background: `radial-gradient(circle, hsl(${tone} / 0.55), transparent 70%)` }}
                  />
                  <img
                    src={g.logo}
                    alt=""
                    className="relative w-14 h-14 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <p className="relative text-[12px] font-black uppercase tracking-wide text-foreground leading-none">
                  {g.name}
                </p>

                {stat && (stat.total_uses > 0 || stat.online_users > 0) ? (
                  <span
                    className="relative flex items-center gap-1.5 text-[8px] font-semibold px-1.5 py-0.5 rounded-full text-foreground/80"
                    style={{ background: `hsl(${tone} / 0.14)`, border: `1px solid hsl(${tone} / 0.3)` }}
                  >
                    {stat.online_users > 0 && (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: `hsl(${tone})` }} />
                        {stat.online_users}
                      </span>
                    )}
                    {stat.total_uses > 0 && (
                      <span className="flex items-center gap-0.5"><Zap className="w-2 h-2" />{stat.total_uses}</span>
                    )}
                  </span>
                ) : (
                  <span className="relative text-[8px] text-muted-foreground">{g.description}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- REGIONS DISPONIBLES ---------------- */}
      <div className="space-y-3">
        <SectionTitle>Régions disponibles</SectionTitle>

        <div className="grid grid-cols-5 gap-2">
          {FEATURED_REGIONS.map((r, i) => {
            const active = selected === r.code;
            return (
              <button
                key={r.code}
                onClick={() => setSelected(active ? null : r.code)}
                aria-pressed={active}
                className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all duration-300 active:scale-[0.94] hover:-translate-y-0.5
                  ${active
                    ? "border-[hsl(var(--gold)/0.7)] bg-[hsl(var(--gold)/0.12)] shadow-[0_0_22px_-6px_hsl(var(--gold)/0.7)]"
                    : "border-[hsl(var(--gold)/0.18)] bg-[hsl(0_0%_100%/0.03)] hover:border-[hsl(var(--gold)/0.45)]"}`}
                style={{ animation: `region-in 0.45s cubic-bezier(0.16,1,0.3,1) ${120 + i * 60}ms both` }}
              >
                <span className="w-9 h-9 rounded-xl bg-[hsl(0_0%_100%/0.06)] border border-[hsl(0_0%_100%/0.08)] flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110">
                  {r.flag}
                </span>
                <span className="text-[8px] font-semibold text-foreground/80 leading-tight text-center truncate w-full">{r.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setRegionsOpen(true)}
            aria-label="Voir toutes les régions"
            className="group relative flex flex-col items-center gap-1.5 rounded-2xl border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.06)] p-2 transition-all duration-300 active:scale-[0.94] hover:-translate-y-0.5 hover:border-[hsl(var(--gold)/0.6)] hover:shadow-[0_0_22px_-8px_hsl(var(--gold)/0.8)]"
            style={{ animation: "region-in 0.45s cubic-bezier(0.16,1,0.3,1) 360ms both" }}
          >
            <span className="w-9 h-9 rounded-xl bg-[hsl(0_0%_100%/0.06)] border border-[hsl(0_0%_100%/0.08)] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <MoreHorizontal className="w-4 h-4 text-[hsl(var(--gold-soft))]" />
            </span>
            <span className="text-[8px] font-semibold text-foreground/80 leading-tight">Autres</span>
          </button>
        </div>
      </div>

      {/* ---------------- MODALE TOUTES LES RÉGIONS ---------------- */}
      <Dialog open={regionsOpen} onOpenChange={setRegionsOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-[hsl(var(--gold)/0.25)] bg-[hsl(158_60%_5%)]/97 backdrop-blur-xl">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="font-display gold-text text-base">Toutes les régions</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un pays…"
                className="w-full rounded-2xl border border-[hsl(var(--gold)/0.22)] bg-[hsl(0_0%_100%/0.04)] py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--gold)/0.6)] transition-colors"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-4 pb-5 space-y-4">
            {grouped.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune région trouvée.</p>
            )}
            {grouped.map((group) => (
              <div key={group.continent} className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--gold-soft))]">{group.continent}</p>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((r, i) => (
                    <button
                      key={r.code}
                      onClick={() => { setSelected(r.code); setRegionsOpen(false); }}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all duration-300 active:scale-[0.94] hover:-translate-y-0.5
                        ${selected === r.code
                          ? "border-[hsl(var(--gold)/0.7)] bg-[hsl(var(--gold)/0.12)]"
                          : "border-[hsl(var(--gold)/0.16)] bg-[hsl(0_0%_100%/0.03)] hover:border-[hsl(var(--gold)/0.45)]"}`}
                      style={{ animation: `region-in 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms both` }}
                    >
                      <span className="text-xl leading-none">{r.flag}</span>
                      <span className="text-[9px] font-semibold text-foreground/80 text-center leading-tight">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Bet261Hub;
