import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Rocket, ChevronRight, Lock, Radio, Activity, Cpu, AlertTriangle, Zap,
} from "lucide-react";
import { toast } from "sonner";
import onexbetLogo from "@/assets/1xbet-logo.png";
import aviatorStudioLogo from "@/assets/logo-aviator-studio.png";
import aviatorSpribeLogo from "@/assets/logo-aviator-spribe.png";
import jetxLogo from "@/assets/logo-jetx.png";
import type { GameStats } from "@/hooks/useGameStats";

export interface OnexbetGameCard {
  id: string;
  name: string;
  logo: string;
  description: string;
  available: boolean;
  premium?: boolean;
  route: string;
  tone: "orange" | "magenta" | "violet";
}

export const ONEXBET_GAMES: OnexbetGameCard[] = [
  { id: "aviator-studio", name: "Studio", logo: aviatorStudioLogo, description: "Temps réel",   available: true, premium: true, route: "/aviator-studio", tone: "orange" },
  { id: "aviator-spribe", name: "Spribe", logo: aviatorSpribeLogo, description: "HH:MM:SS",     available: true, premium: true, route: "/aviator-spribe", tone: "magenta" },
  
];

const toneAccent: Record<OnexbetGameCard["tone"], string> = {
  orange:  "hsl(var(--sunset-orange))",
  magenta: "hsl(var(--sunset-magenta))",
  violet:  "hsl(var(--sunset-violet))",
};

interface Props {
  gameStats: GameStats[];
  onTrack: (id: string) => void;
}

/** 1xBet hub — Sunset Blaze identity (mesh orange→magenta→violet, chevrons, tilt cards) */
const OnexbetHub = ({ gameStats, onTrack }: Props) => {
  const navigate = useNavigate();
  const active = useMemo(() => ONEXBET_GAMES.filter((g) => g.available).length, []);

  const handleClick = (g: OnexbetGameCard) => {
    if (!g.available) { toast.info("Ce jeu est actuellement indisponible"); return; }
    onTrack(g.id);
    navigate(g.route);
  };

  return (
    <section aria-label="Plateforme 1xBet" className="space-y-4">
      {/* Hero header — mesh sunset panel with diagonal shimmer */}
      <div className="relative overflow-hidden rounded-tl-3xl rounded-tr-md rounded-bl-md rounded-br-3xl mesh-sunset p-4 animate-shimmer-sunset"
           style={{ animation: "blur-in 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        <div className="relative flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-[hsl(var(--sunset-magenta)/0.5)] animate-zoom-in-soft animate-glow-sunset-loop">
            <img src={onexbetLogo} alt="" className="w-full h-full object-contain p-0.5 bg-[hsl(var(--sunset-ink))] animate-zoom-pulse" loading="lazy" decoding="async" />
          </div>
          <div className="min-w-0 flex-1 animate-slide-in-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.22em] font-bold text-[hsl(var(--sunset-amber))]">Live Engine</span>
              <Radio className="w-3 h-3 text-[hsl(var(--sunset-magenta))]" />
            </div>
            <h2 className="text-lg font-black sunset-text leading-tight">1xBet</h2>
            <p className="text-[10px] text-[hsl(45_20%_88%/0.7)] truncate">{active} moteurs actifs · Sunset AI v2.4</p>
          </div>
          <div className="flex flex-col items-end gap-1 animate-slide-in-right">
            <span className="text-[9px] px-2 py-1 rounded-md sunset-gradient text-primary-foreground font-black flex items-center gap-1 shadow-lg shadow-[hsl(var(--sunset-magenta)/0.4)]">
              <Activity className="w-3 h-3" /> Boost
            </span>
            <span className="text-[8px] text-[hsl(45_20%_88%/0.6)] font-mono">v2.4.1</span>
          </div>
        </div>

        {/* Precision strip */}
        <div className="relative mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-widest text-[hsl(var(--sunset-amber))] font-bold flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" /> Précision moteur
              </span>
              <span className="text-[10px] font-mono font-black text-[hsl(45_50%_92%)]">94.2%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-[hsl(var(--sunset-ink))]/70 ring-1 ring-[hsl(var(--sunset-magenta)/0.25)]">
              <div className="h-full sunset-gradient animate-progress-fill" style={{ width: "94%" }} />
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[hsl(var(--sunset-orange))] animate-chevron" />
        </div>
      </div>

      {/* Cards — aligned grid, contained logos, readable badges */}
      <div className="grid grid-cols-3 gap-3">
        {ONEXBET_GAMES.map((g, i) => {
          const stat = gameStats.find((s) => s.game_name === g.id);
          const accent = toneAccent[g.tone];
          return (
            <button
              key={g.id}
              onClick={() => handleClick(g)}
              disabled={!g.available}
              className={`group relative flex flex-col items-center justify-between gap-2 pt-5 pb-3 px-2 rounded-2xl transition-all duration-300 sunset-border overflow-hidden min-h-[172px]
                bg-[linear-gradient(155deg,hsl(var(--sunset-ink))_0%,hsl(258_45%_10%)_100%)]
                hover:-translate-y-1 active:scale-[0.96]
                ${!g.available ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
              style={{ animation: `fade-up 0.55s cubic-bezier(0.16,1,0.3,1) ${140 + i * 80}ms forwards`, opacity: 0 }}
            >
              {/* Top badge — single, centered, non-overlapping */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10">
                {!g.available ? (
                  <span className="text-[8px] px-2 py-0.5 rounded-full bg-destructive/90 text-destructive-foreground font-bold flex items-center gap-0.5 shadow-md whitespace-nowrap">
                    <Lock className="w-2 h-2" /> Bientôt
                  </span>
                ) : g.premium ? (
                  <span className="text-[8px] px-2 py-0.5 rounded-full sunset-gradient text-primary-foreground font-black flex items-center gap-0.5 shadow-md shadow-[hsl(var(--sunset-magenta)/0.5)] whitespace-nowrap">
                    <Rocket className="w-2 h-2" /> PRO
                  </span>
                ) : null}
              </div>

              {/* Live dot */}
              {g.available && (
                <div className="absolute bottom-1.5 right-1.5">
                  <div className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
                </div>
              )}

              {/* Icon tile with contained logo */}
              <div className="relative mt-3 animate-zoom-in-soft" style={{ animationDelay: `${200 + i * 80}ms` }}>
                <div className="absolute inset-[-4px] rounded-2xl opacity-50 group-hover:opacity-80 transition-opacity blur-md"
                     style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }} />
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-1 bg-[hsl(var(--sunset-ink))] flex items-center justify-center"
                     style={{ borderColor: accent }}>
                  <img src={g.logo} alt={g.name} className="w-full h-full object-contain p-1.5 group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" />
                </div>
              </div>

              <div className="text-center space-y-0.5 px-1">
                <p className="font-black text-xs leading-tight truncate" style={{ color: accent }}>{g.name}</p>
                <p className="text-[9px] text-[hsl(45_20%_88%/0.6)] leading-snug truncate">{g.description}</p>
              </div>

              {stat && (stat.total_uses > 0 || stat.online_users > 0) ? (
                <div className="flex items-center gap-1.5 text-[8px] text-[hsl(45_20%_88%/0.75)] bg-[hsl(var(--sunset-ink))]/70 px-1.5 py-0.5 rounded-md border" style={{ borderColor: `${accent}30` }}>
                  {stat.online_users > 0 && (
                    <span className="flex items-center gap-0.5">
                      <div className="w-1 h-1 rounded-full" style={{ background: accent }} />
                      {stat.online_users}
                    </span>
                  )}
                  {stat.total_uses > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-2 h-2" style={{ color: accent }} />
                      {stat.total_uses}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-[16px]" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default OnexbetHub;