import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Phone, Shield, Loader2, Lock, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jhLogo from "@/assets/jh-logo.png";

const emailSchema = z.object({
  identifier: z.string().trim().toLowerCase().email("Adresse email invalide").max(255, "Email trop long"),
  password: z.string().min(6, "Mot de passe : 6 caractères minimum").max(72, "Mot de passe trop long"),
});
const phoneSchema = z.object({
  identifier: z.string().trim().regex(/^\+?\d[\d\s().-]{6,20}$/, "Numéro de téléphone invalide"),
  password: z.string().min(6, "Mot de passe : 6 caractères minimum").max(72, "Mot de passe trop long"),
});

const Login = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const schema = loginMethod === "email" ? emailSchema : phoneSchema;
    const parsed = schema.safeParse({ identifier, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Données invalides");
      return;
    }
    const creds = parsed.data;

    setLoading(true);
    try {
      const payload = loginMethod === "email"
        ? { email: creds.identifier, password: creds.password }
        : { phone: creds.identifier.replace(/[\s().-]/g, ""), password: creds.password };
      const { error } = await supabase.auth.signInWithPassword(payload as any);
      if (error) throw error;
      toast.success("Connexion réussie !");
      navigate("/games");
    } catch (err: any) {
      setError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Luxe aurora backdrop */}
      <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-[hsl(152_72%_35%_/_0.30)] blur-[110px] animate-aurora" />
      <div className="absolute -bottom-24 -right-24 w-[440px] h-[440px] rounded-full bg-[hsl(42_82%_50%_/_0.25)] blur-[110px] animate-aurora" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 -right-16 w-[280px] h-[280px] rounded-full bg-[hsl(45_92%_60%_/_0.10)] blur-[90px]" />

      {/* Fine grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--gold)/0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)/0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Back */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-5 z-20 inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" /> Accueil
      </button>

      <div className="w-full max-w-sm relative z-10 stagger-up">
        {/* Header */}
        <div className="flex flex-col items-center gap-5 mb-7">
          <div className="relative animate-blur-in">
            <div
              className="absolute inset-[-14px] rounded-[36px] opacity-70 pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 0deg, hsl(42 82% 55%), hsl(45 92% 70%), hsl(152 72% 45%), hsl(42 82% 55%))",
                filter: "blur(14px)",
                animation: "orbit-ring 6s linear infinite",
              }}
            />
            <div
              className="relative w-24 h-24 rounded-[24px] overflow-hidden"
              style={{
                boxShadow: "0 20px 50px -10px hsl(42 82% 45% / 0.55), inset 0 0 0 1px hsl(42 82% 55% / 0.3)",
              }}
            >
              <img src={jhLogo} alt="Jeux d'Hazard" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/5 border border-[hsl(var(--gold)/0.25)] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))] animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-foreground/70">
                Salon Privé
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight leading-tight">
              <span className="text-foreground">Bon </span>
              <span className="gold-text">retour</span>
            </h1>
            <p className="text-foreground/50 text-xs flex items-center justify-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
              Connexion sécurisée · Jeux d'Hazard
            </p>
          </div>
        </div>

        {/* Glass card */}
        <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-[hsl(var(--gold)/0.5)] via-[hsl(var(--accent)/0.3)] to-[hsl(var(--gold)/0.5)] shadow-[0_30px_80px_-20px_hsl(158_60%_3%/0.7)]">
          <div className="rounded-[27px] bg-card/70 backdrop-blur-2xl border border-border/50 p-5 sm:p-6 space-y-5">
            {/* Method toggle */}
            <div className="relative flex gap-1 p-1 rounded-2xl bg-background/60 border border-border/40">
              {(["email", "phone"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setLoginMethod(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    loginMethod === m
                      ? "gold-gradient text-[hsl(158_60%_8%)] shadow-[0_8px_20px_-6px_hsl(42_82%_45%_/_0.55)]"
                      : "text-foreground/50 hover:text-foreground/80"
                  }`}
                >
                  {m === "email" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  {m === "email" ? "Email" : "Téléphone"}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-[11px] uppercase tracking-[0.25em] text-foreground/50 font-bold flex items-center gap-1.5 ml-1">
                  {loginMethod === "email" ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                  {loginMethod === "email" ? "Adresse email" : "Numéro de téléphone"}
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none">
                    {loginMethod === "email" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </div>
                  <Input
                    id="identifier"
                    type={loginMethod === "email" ? "email" : "tel"}
                    placeholder={loginMethod === "email" ? "vous@exemple.com" : "+261 34 00 000 00"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12 bg-background/60 border-border/60 pl-11 rounded-2xl text-sm focus:border-[hsl(var(--gold)/0.6)] focus:ring-2 focus:ring-[hsl(var(--gold)/0.2)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.25em] text-foreground/50 font-bold flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Mot de passe
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[11px] text-[hsl(var(--gold))] hover:underline"
                  >
                    Oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-background/60 border-border/60 pl-11 pr-12 rounded-2xl text-sm focus:border-[hsl(var(--accent)/0.7)] focus:ring-2 focus:ring-[hsl(var(--accent)/0.2)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive text-xs text-center font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-13 py-4 rounded-2xl gold-gradient text-[hsl(158_60%_8%)] font-bold shadow-[0_20px_40px_-12px_hsl(42_82%_45%_/_0.5)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden font-display"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <span className="relative inline-flex items-center justify-center gap-2 text-[15px]">
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </span>
                )}
              </button>
            </form>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.35em] text-foreground/40 font-bold">ou</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            <button
              onClick={() => navigate("/signup")}
              className="w-full h-12 rounded-2xl border border-[hsl(var(--accent)/0.4)] bg-[hsl(var(--accent)/0.08)] hover:bg-[hsl(var(--accent)/0.16)] hover:border-[hsl(var(--accent)/0.6)] transition-all duration-300 inline-flex items-center justify-center gap-2 text-sm font-bold text-foreground"
            >
              <UserPlus className="w-4 h-4 text-[hsl(var(--accent))]" />
              Créer un nouveau compte
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-foreground/40 mt-6 px-4 leading-relaxed">
          En vous connectant, vous acceptez nos conditions d'utilisation et confirmez avoir lu notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
};

export default Login;
