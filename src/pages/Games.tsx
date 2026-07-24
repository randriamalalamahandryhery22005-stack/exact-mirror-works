import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Crown, Gamepad2, Shield, KeyRound, Star, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OnlineStatus from "@/components/OnlineStatus";
import { useGameStats } from "@/hooks/useGameStats";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import aviatorLogo from "@/assets/logo-aviator.png";
import cosmoxLogo from "@/assets/logo-cosmox.png";
import jetxLogo from "@/assets/logo-jetx.png";
import aviatorPremiumLogo from "@/assets/logo-aviator-premium.png";
import virtuelLogo from "@/assets/logo-virtuel.png";
import penaltyLogo from "@/assets/logo-penalty.png";
import aviatorStudioLogo from "@/assets/logo-aviator-studio.png";
import aviatorSpribeLogo from "@/assets/logo-aviator-spribe.png";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";


import OptionalUpdateBanner from "@/components/OptionalUpdateBanner";
import { DynamicConfigRenderer } from "@/components/DynamicConfigRenderer";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import InfoModal from "@/components/InfoModal";
import Bet261Hub, { BET261_GAMES } from "@/components/hubs/Bet261Hub";
import OnexbetHub, { ONEXBET_GAMES } from "@/components/hubs/OnexbetHub";

// Platform game lists moved to src/components/hubs/*

const Games = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, loading, accessCodeRequired, accessCodeVerified, verifyAccessCode } = useAuth();
  const { gameStats, myPoints, trackGameUsage, getMostPopular, refreshStats } = useGameStats();
  const [codeInput, setCodeInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [customPreds, setCustomPreds] = useState<Array<{ id: string; name: string; slug: string; description: string | null; requires_subscription: boolean }>>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("custom_predictions")
        .select("id, name, slug, description, requires_subscription")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setCustomPreds(data ?? []);
    })();
  }, []);
  // Real-time sync for game access and settings changes
  const refreshAll = useCallback(() => {
    refreshStats();
  }, []);
  useRealtimeSync({ onGameAccessChange: refreshAll, onSettingsChange: refreshAll });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) { navigate("/login"); return null; }

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const handleCodeVerify = async () => {
    if (!codeInput.trim()) return;
    setVerifying(true);
    const ok = await verifyAccessCode(codeInput.trim());
    if (ok) toast.success("Code vérifié !");
    else toast.error("Code d'accès incorrect");
    setVerifying(false);
  };

  const mostPopular = getMostPopular();

  if (accessCodeRequired && !accessCodeVerified && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6" style={{ animation: "fade-up 0.5s ease forwards" }}>
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <KeyRound className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Code d'accès requis</h1>
          <p className="text-sm text-muted-foreground max-w-xs">Entrez le code fourni par l'administrateur.</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Entrez le code d'accès"
            className="h-14 bg-secondary/80 border-border/50 text-center text-lg font-mono font-bold tracking-widest"
            onKeyDown={(e) => e.key === "Enter" && handleCodeVerify()} />
          <Button variant="premium" className="w-full h-12 font-bold" onClick={handleCodeVerify} disabled={verifying}>
            {verifying ? "Vérification..." : "Valider"}
          </Button>
        </div>
        <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-4 flex items-center gap-1">
          <LogOut className="w-3 h-3" /> Se déconnecter
        </button>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "Bonne nuit";
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  })();
  const totalGames = BET261_GAMES.filter(g => g.available).length + ONEXBET_GAMES.filter(g => g.available).length;
  const totalOnline = gameStats.reduce((s, g) => s + (g.online_users || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <InfoModal />
      {/* Header — modernized welcome */}
      <header className="relative px-5 pt-5 pb-4 border-b border-border/40 bg-gradient-to-br from-primary/15 via-card/60 to-background overflow-hidden animate-blur-in">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none animate-aurora" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-aurora" style={{ animationDelay: "2s" }} />

        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-[-4px] rounded-2xl opacity-70 pointer-events-none"
                style={{
                  background: "conic-gradient(from 0deg, hsla(43, 96%, 56%, 0.6), transparent, hsla(43, 96%, 56%, 0.6))",
                  animation: "orbit-ring 5s linear infinite",
                  filter: "blur(6px)",
                }} />
              <div className="relative w-11 h-11 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/30">
                <Gamepad2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-background live-dot" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{greeting}</p>
              <h1 className="text-base font-black tracking-tight text-shine leading-tight truncate">
                {profile?.full_name || "Joueur"}
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-primary font-bold"><Shield className="w-3 h-3" /> Administrateur</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" /> En ligne</span>
                )}
              </p>
            </div>
          </div>
        </div>

      </header>

      <OptionalUpdateBanner />

      {/* Content */}
      <main className="flex-1 px-5 py-5 space-y-6 overflow-y-auto">
        {/* Contenu dynamique piloté par IA (temps réel) */}
        <DynamicConfigRenderer />

        {/* Plateforme Bet261 — Emerald Prestige */}
        <Bet261Hub gameStats={gameStats} mostPopular={mostPopular} onTrack={trackGameUsage} />

        {/* Prédictions personnalisées (admin-defined) */}
        {customPreds.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4" style={{ animation: "fade-up 0.4s ease 200ms forwards", opacity: 0 }}>
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold gold-text">Prédictions personnalisées</h2>
                <p className="text-[9px] text-muted-foreground">{customPreds.length} disponibles</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {customPreds.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/custom/${p.slug}`)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 bg-gradient-to-b from-primary/10 to-card border-primary/25 hover:border-primary/50 transition-all active:scale-[0.96] hover:scale-[1.03]"
                  style={{ animation: `fade-up 0.4s ease ${300 + i * 60}ms forwards`, opacity: 0 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="font-bold text-xs truncate gold-text">{p.name}</p>
                    {p.description && <p className="text-[9px] text-muted-foreground truncate">{p.description}</p>}
                  </div>
                  {p.requires_subscription && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold flex items-center gap-0.5">
                      <Crown className="w-2 h-2" /> Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Plateforme 1xBet — Sunset Blaze */}
        <OnexbetHub gameStats={gameStats} onTrack={trackGameUsage} />
      </main>

      {/* Bottom spacer for nav */}
      <div className="h-20" />

      <BottomNav />
    </div>
  );
};

export default Games;
