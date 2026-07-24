import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = 1 | 2 | 3;
type CodeLength = 6 | 8 | 10;

const generateCode = (len: CodeLength) => {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [identifier, setIdentifier] = useState("");
  const [codeLength, setCodeLength] = useState<CodeLength>(6);
  const [generatedCode, setGeneratedCode] = useState("");
  const [typedCode, setTypedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const progress = useMemo(() => (step / 3) * 100, [step]);

  const goStep1Next = () => {
    if (!identifier.trim()) {
      toast.error("Veuillez entrer votre email ou numéro de téléphone");
      return;
    }
    const code = generateCode(codeLength);
    setGeneratedCode(code);
    setTypedCode(code); // auto-fill as requested
    setStep(2);
  };

  const regenerate = (len: CodeLength) => {
    setCodeLength(len);
    const c = generateCode(len);
    setGeneratedCode(c);
    setTypedCode(c);
  };

  const goStep2Next = () => {
    if (typedCode !== generatedCode) {
      toast.error("Le code saisi ne correspond pas");
      return;
    }
    setStep(3);
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("direct-password-reset", {
        body: { identifier: identifier.trim(), new_password: newPassword },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Erreur lors de la réinitialisation");

      // Auto sign-in with the new password
      const loginEmail = data.email || (identifier.includes("@") ? identifier.trim() : null);
      if (loginEmail) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: newPassword,
        });
        if (signInErr) {
          toast.success("Mot de passe modifié. Connectez-vous.");
          navigate("/login");
          return;
        }
      } else if (data.phone) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          phone: data.phone,
          password: newPassword,
        });
        if (signInErr) {
          toast.success("Mot de passe modifié. Connectez-vous.");
          navigate("/login");
          return;
        }
      }

      toast.success("Connexion réussie !");
      navigate("/games");
    } catch (err: any) {
      toast.error(err?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) navigate("/login");
    else setStep((step - 1) as Step);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5 px-6 py-8">
      <button
        onClick={goBack}
        className="p-2 rounded-lg hover:bg-secondary transition-colors active:scale-95 self-start mb-6"
      >
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-[10px] font-semibold uppercase tracking-wider">
            <span className={step >= 1 ? "text-primary" : "text-muted-foreground"}>Identifiant</span>
            <span className={step >= 2 ? "text-primary" : "text-muted-foreground"}>Code</span>
            <span className={step >= 3 ? "text-primary" : "text-muted-foreground"}>Nouveau MDP</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/70 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div
          key={step}
          className="flex-1 flex flex-col"
          style={{ animation: "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30">
                  <Mail className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
                <p className="text-sm text-muted-foreground">
                  Entrez votre email ou numéro de téléphone pour commencer.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Email ou téléphone
                </Label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="vous@exemple.com ou +33..."
                  className="h-14 bg-secondary/80 border-border/50 text-base"
                />

                <div className="space-y-2 pt-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Longueur du code
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[6, 8, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCodeLength(n as CodeLength)}
                        className={`h-11 rounded-xl border transition-all font-bold text-sm ${
                          codeLength === n
                            ? "border-primary bg-primary/10 text-primary shadow-md"
                            : "border-border/40 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {n} chiffres
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button variant="premium" className="w-full h-12 text-base" onClick={goStep1Next}>
                <Sparkles className="w-4 h-4 mr-2" /> Générer le code
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30">
                  <ShieldCheck className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold">Code de vérification</h1>
                <p className="text-sm text-muted-foreground">
                  Voici votre code généré. Confirmez-le ci-dessous.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-card to-primary/5 border border-primary/30 text-center space-y-2 shadow-lg shadow-primary/10">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Code généré
                </p>
                <p className="text-3xl font-black font-mono tracking-[0.3em] text-primary break-all">
                  {generatedCode}
                </p>
                <button
                  type="button"
                  onClick={() => regenerate(codeLength)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Régénérer
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Saisissez le code
                </Label>
                <Input
                  value={typedCode}
                  onChange={(e) => setTypedCode(e.target.value.replace(/\D/g, "").slice(0, codeLength))}
                  className="h-14 bg-secondary/80 border-border/50 font-mono tracking-[0.3em] text-center text-xl"
                  maxLength={codeLength}
                  inputMode="numeric"
                />
              </div>

              <Button variant="premium" className="w-full h-12 text-base" onClick={goStep2Next}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Vérifier le code
              </Button>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30">
                  <KeyRound className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
                <p className="text-sm text-muted-foreground">
                  Choisissez votre nouveau mot de passe. Vous serez connecté automatiquement.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 bg-secondary/80 border-border/50 pl-11 pr-11 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 bg-secondary/80 border-border/50 pl-11 text-base"
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="premium"
                className="w-full h-12 text-base"
                onClick={submitNewPassword}
                disabled={loading}
              >
                {loading ? "Mise à jour..." : "Valider et me connecter"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
