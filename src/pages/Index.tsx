import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import AccountSearch from "@/components/AccountSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Search, UserPlus, LogIn, ArrowRight, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import jhLogo from "@/assets/jh-logo.png";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    if (loading) return;
    if (user) navigate("/games");
  }, [navigate, user, loading]);

  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden flex flex-col">
      {/* Ambient luxe */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[hsl(152_72%_35%_/_0.35)] blur-3xl animate-aurora" />
        <div className="absolute -bottom-24 -right-16 w-[22rem] h-[22rem] rounded-full bg-[hsl(42_82%_50%_/_0.22)] blur-3xl animate-aurora" style={{ animationDelay: "1.4s" }} />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--gold)/0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)/0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 78%)",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-12">
        {/* Brand */}
        <div className="text-center mb-10 animate-blur-in">
          <div className="relative inline-flex mx-auto mb-5">
            <div
              className="absolute inset-[-10px] rounded-[32px] opacity-70 blur-xl"
              style={{
                background:
                  "conic-gradient(from 0deg, hsl(42 82% 55%), hsl(45 92% 70%), hsl(152 72% 45%), hsl(42 82% 55%))",
                animation: "orbit-ring 8s linear infinite",
              }}
            />
            <div
              className="relative w-24 h-24 rounded-[24px] overflow-hidden ring-1 ring-[hsl(var(--gold)/0.35)]"
              style={{ boxShadow: "0 25px 60px -15px hsl(42 82% 45% / 0.55)" }}
            >
              <img src={jhLogo} alt="Jeux d'Hazard" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/[0.04] border border-[hsl(var(--gold)/0.3)] backdrop-blur mb-3">
            <ShieldCheck className="w-3 h-3 text-[hsl(var(--gold))]" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-foreground/70 font-bold">
              Casino · Édition Or
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight leading-[1.05]">
            <span className="text-foreground">Bienvenue chez </span>
            <span className="gold-text">Jeux d'Hazard</span>
          </h1>
          <p className="text-sm text-foreground/60 leading-relaxed max-w-xs mx-auto mt-3">
            Prédictions et analyses premium pour Aviator, JetX, CosmoX, Spribe et Studio.
          </p>
        </div>

        {!showSearch ? (
          <div className="space-y-3 stagger-up">
            {/* Hero — search account */}
            <button
              onClick={() => setShowSearch(true)}
              className="group relative w-full text-left p-[1.5px] rounded-3xl bg-gradient-to-br from-[hsl(var(--gold)/0.8)] via-[hsl(45_92%_70%_/_0.5)] to-[hsl(var(--gold)/0.8)] shadow-[0_15px_50px_-12px_hsl(42_82%_45%_/_0.55)] active:scale-[0.99] transition"
            >
              <div className="relative rounded-[calc(1.5rem-1.5px)] bg-card/95 p-5 flex items-center gap-4 overflow-hidden">
                <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-[hsl(var(--gold)/0.18)] blur-2xl group-hover:bg-[hsl(var(--gold)/0.28)] transition" />
                <div className="relative w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shrink-0">
                  <Search className="w-5 h-5 text-[hsl(158_60%_8%)]" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--gold))] font-bold">Recommandé</p>
                    <Sparkles className="w-3 h-3 text-[hsl(var(--gold))]" />
                  </div>
                  <p className="font-bold text-[15px] leading-tight mt-0.5">Rechercher mon compte</p>
                  <p className="text-[11px] text-foreground/50 mt-0.5">Retrouvez instantanément votre profil</p>
                </div>
                <ArrowRight className="relative w-4 h-4 text-foreground/60 group-hover:translate-x-0.5 group-hover:text-[hsl(var(--gold))] transition" />
              </div>
            </button>

            {/* Sign in */}
            <button
              onClick={() => navigate("/login")}
              className="group w-full text-left p-4 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border hover:border-[hsl(var(--gold)/0.4)] backdrop-blur transition flex items-center gap-4 active:scale-[0.99]"
            >
              <div className="w-11 h-11 rounded-xl bg-[hsl(var(--accent)/0.15)] border border-[hsl(var(--accent)/0.3)] flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4 text-[hsl(var(--accent))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px]">Se connecter</p>
                <p className="text-[11px] text-foreground/50 mt-0.5">Email ou téléphone + mot de passe</p>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground/70 group-hover:translate-x-0.5 transition" />
            </button>

            {/* Sign up */}
            <button
              onClick={() => navigate("/signup")}
              className="group w-full text-left p-4 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border hover:border-[hsl(var(--gold)/0.4)] backdrop-blur transition flex items-center gap-4 active:scale-[0.99]"
            >
              <div className="w-11 h-11 rounded-xl bg-[hsl(var(--gold)/0.15)] border border-[hsl(var(--gold)/0.3)] flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-[hsl(var(--gold))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px]">Créer un nouveau compte</p>
                <p className="text-[11px] text-foreground/50 mt-0.5">Rejoignez le salon en 30 s</p>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground/70 group-hover:translate-x-0.5 transition" />
            </button>

            <div className="flex items-center justify-center gap-2 pt-6 text-[10px] text-foreground/40 uppercase tracking-[0.3em]">
              <ShieldCheck className="w-3 h-3" /> Sécurisé · Chiffré · Premium
            </div>
          </div>
        ) : (
          <div className="relative animate-blur-in">
            <div className="p-[1.5px] rounded-3xl bg-gradient-to-br from-[hsl(var(--gold)/0.6)] via-border to-[hsl(var(--gold)/0.6)]">
              <div className="rounded-[calc(1.5rem-1.5px)] bg-card/95 p-5 backdrop-blur">
                <button
                  onClick={() => setShowSearch(false)}
                  className="text-xs text-foreground/60 hover:text-foreground mb-4 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Retour
                </button>
                <AccountSearch />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
