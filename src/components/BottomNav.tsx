import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Crown,
  Shield,
  Menu as MenuIcon,
  User,
  Info,
  Settings,
  MessageCircle,
  LogOut,
  Bell,
  Volume2,
  Moon,
  Sun,
  ChevronRight,
  Mail,
  Sparkles,
  KeyRound,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import { useUnreadStore } from "@/hooks/useUnreadStore";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "+261 33 67 561 85";
const WHATSAPP_RAW = "261336756185";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_RAW}`;
const APP_NAME = "Jeux d'Hazard";
const APP_VERSION = "0.0.1";

type SettingKey = "notifications" | "sound" | "darkMode";

const readBool = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(`webify.${key}`);
  return v === null ? fallback : v === "1";
};

const writeBool = (key: string, v: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`webify.${key}`, v ? "1" : "0");
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, user, profile, signOut } = useAuth();
  const unreadChats = useUnreadChats(user?.id ?? null);
  const { count: unreadStore } = useUnreadStore(user?.id ?? null);
  const [ripple, setRipple] = useState<{ id: string; x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNotifications(readBool("notifications", true));
    setSound(readBool("sound", true));
    setDarkMode(readBool("darkMode", true));
  }, []);

  const toggleSetting = (key: SettingKey, next: boolean) => {
    if (key === "notifications") setNotifications(next);
    if (key === "sound") setSound(next);
    if (key === "darkMode") {
      setDarkMode(next);
      document.documentElement.classList.toggle("dark", next);
    }
    writeBool(key, next);
    toast.success(next ? "Activé" : "Désactivé");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setMenuOpen(false);
      setSettingsOpen(false);
      toast.success("Déconnexion réussie");
      navigate("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const copyWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_NUMBER);
      setCopied(true);
      toast.success("Numéro copié");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const navItems: Array<{ label: string; icon: typeof Home; path: string }> = [
    { label: "Accueil", icon: Home, path: "/games" },
    { label: "Chat", icon: MessageCircle, path: "/chat" },
    { label: "Boutique", icon: ShoppingBag, path: "/gen-store" },
    { label: "Premium", icon: Crown, path: "/premium" },
    ...(isAdmin ? [{ label: "Admin", icon: Shield, path: "/admin" }] : []),
  ];

  const isActive = (path: string) => {
    const [p, hash] = path.split("#");
    if (location.pathname !== p) return false;
    if (!hash) return location.hash === "" || (p === "/premium" && location.hash === "");
    return location.hash.replace("#", "") === hash;
  };

  const handleClick = (path: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (path === "/admin" && !isAdmin) {
      toast.error("Accès réservé aux administrateurs");
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ id: path + Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 500);
    navigate(path);
  };

  const menuBtnClass = (active: boolean) =>
    `relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-2xl overflow-hidden transition-all duration-300 active:scale-90 min-h-[48px] ${
      active
        ? "text-white bg-gradient-to-br from-[hsl(var(--sunset-orange)/0.35)] via-[hsl(var(--sunset-magenta)/0.30)] to-[hsl(var(--sunset-violet)/0.35)] shadow-inner"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;

  const displayName = profile?.full_name || profile?.name || user?.email?.split("@")[0] || "Invité";
  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        style={{
          background: "linear-gradient(180deg, hsl(258 45% 6% / 0.85), hsl(258 45% 5% / 0.96))",
          backdropFilter: "blur(24px) saturate(160%)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 -12px 40px -10px hsl(18 100% 55% / 0.28)",
        }}
      >
        <div className="flex items-stretch justify-around gap-0.5 px-1.5 py-1.5 sm:py-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                onClick={(e) => handleClick(item.path, e)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={menuBtnClass(active)}
              >
                {active && (
                  <span
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(var(--sunset-orange)), hsl(var(--sunset-magenta)), hsl(var(--sunset-violet)))" }}
                  />
                )}
                {ripple?.id.startsWith(item.path) && (
                  <span
                    className="pointer-events-none absolute rounded-full bg-white/25"
                    style={{
                      top: ripple.y,
                      left: ripple.x,
                      width: 8,
                      height: 8,
                      transform: "translate(-50%,-50%)",
                      animation: "pm-scale-in 0.5s ease-out forwards",
                    }}
                  />
                )}
                <div className="relative">
                  <item.icon className={`w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 transition-transform ${active ? "scale-110" : ""}`} />
                  {item.path === "/chat" && unreadChats > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-gradient-to-br from-amber-500 to-amber-600 ring-2 ring-slate-900 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-[scale-in_0.25s_ease-out]"
                      aria-label={`${unreadChats} messages non lus`}
                    >
                      {unreadChats > 99 ? "99+" : unreadChats}
                    </span>
                  )}
                  {item.path === "/gen-store" && unreadStore > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-gradient-to-br from-amber-500 to-amber-600 ring-2 ring-slate-900 shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-[scale-in_0.25s_ease-out]"
                      aria-label={`${unreadStore} nouvelles publications`}
                    >
                      {unreadStore > 99 ? "99+" : unreadStore}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold leading-none tracking-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}


          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button aria-label="Menu" className={menuBtnClass(false)}>
                <MenuIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0" />
                <span className="text-[9px] font-bold leading-none tracking-tight truncate max-w-full">
                  Menu
                </span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-[28px] border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white max-h-[88vh] overflow-y-auto p-5"
            >
              {/* Grabber */}
              <div className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-white/15" aria-hidden />

              <SheetHeader className="text-left space-y-0.5">
                <SheetTitle className="text-white text-[15px] font-semibold tracking-tight">Menu</SheetTitle>
                <SheetDescription className="text-slate-400 text-[12px]">
                  Profil, préférences et support à portée de main.
                </SheetDescription>
              </SheetHeader>

              {/* User card — refined glass */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate(user ? "/profile" : "/login");
                }}
                className="mt-5 w-full flex items-center gap-3 rounded-2xl p-3.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 transition text-left backdrop-blur"
              >
                <div className="relative shrink-0">
                  <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-amber-500 via-amber-500 to-emerald-500 opacity-70 blur-[3px]" />
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-900 ring-1 ring-white/20 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-base font-bold text-white">{initial}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] truncate leading-tight">{displayName}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {user?.email || "Non connecté"}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>

              {/* Section: Compte */}
              <p className="mt-5 mb-2 px-1 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Compte</p>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] divide-y divide-white/5 overflow-hidden">
                <MenuRow
                  icon={<User className="w-[18px] h-[18px] text-amber-300" />}
                  label="Profil"
                  sublabel="Nom, photo, e-mail, sécurité"
                  onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                />
                <MenuRow
                  icon={<Settings className="w-[18px] h-[18px] text-emerald-300" />}
                  label="Paramètres"
                  sublabel="Notifications, apparence, session"
                  onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
                />
              </div>

              {/* Section: Assistance */}
              <p className="mt-4 mb-2 px-1 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Assistance</p>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] divide-y divide-white/5 overflow-hidden">
                <MenuRow
                  icon={<Info className="w-[18px] h-[18px] text-amber-300" />}
                  label="À propos"
                  sublabel={`Version ${APP_VERSION}`}
                  onClick={() => { setMenuOpen(false); setAboutOpen(true); }}
                />
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3.5 hover:bg-white/[0.04] transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-[18px] h-[18px] text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-white text-[14px] leading-tight">Support WhatsApp</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{WHATSAPP_NUMBER}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </a>
              </div>

              {user && (
                <>
                  <p className="mt-4 mb-2 px-1 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Session</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition font-semibold text-[14px]"
                  >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </button>
                </>
              )}

              <p className="mt-5 text-center text-[10px] text-slate-600">
                {APP_NAME} · v{APP_VERSION}
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </nav>


      {/* Paramètres */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-white/10 bg-slate-900 text-white max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-300" /> Paramètres
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Personnalisez l'application et gérez votre session.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5">
            <section>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Préférences
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
                <ToggleRow
                  icon={<Bell className="w-5 h-5 text-amber-300" />}
                  label="Notifications"
                  sublabel="Alertes et rappels dans l'application"
                  checked={notifications}
                  onCheckedChange={(v) => toggleSetting("notifications", v)}
                />
                <ToggleRow
                  icon={<Volume2 className="w-5 h-5 text-amber-300" />}
                  label="Sons"
                  sublabel="Effets sonores dans les jeux"
                  checked={sound}
                  onCheckedChange={(v) => toggleSetting("sound", v)}
                />
                <ToggleRow
                  icon={darkMode ? <Moon className="w-5 h-5 text-amber-300" /> : <Sun className="w-5 h-5 text-amber-300" />}
                  label="Mode sombre"
                  sublabel="Thème visuel de l'application"
                  checked={darkMode}
                  onCheckedChange={(v) => toggleSetting("darkMode", v)}
                />
              </div>
            </section>

            {user && (
              <section>
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                  Session
                </p>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition font-medium"
                >
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </section>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* À propos */}
      <Sheet open={aboutOpen} onOpenChange={setAboutOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-white/10 bg-slate-900 text-white max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-300" /> À propos
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Informations sur l'application et le support.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            {/* Identity card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-600/20 via-emerald-600/10 to-transparent p-4">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-tight">{APP_NAME}</p>
                  <p className="text-[11px] text-slate-400">
                    Assistant de prédiction & d'analyse pour jeux crash
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-200">
                      Version {APP_VERSION}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" /> En service
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* About / description */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                À propos de {APP_NAME}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {APP_NAME} est une application mobile de prédictions et d'analyses
                statistiques dédiée aux jeux crash et virtuels des plateformes Bet261 et
                1xBet — <span className="text-white font-semibold">Aviator</span>,{" "}
                <span className="text-white font-semibold">JetX</span>,{" "}
                <span className="text-white font-semibold">CosmoX</span>, Penalty
                Shootout, football virtuel et plus encore. Elle combine un moteur d'analyse
                d'image, des signaux temps réel et des modèles statistiques dédiés à chaque
                jeu pour éclairer chaque décision.
              </p>
            </div>

            {/* Feature cards */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Ce que propose l'application
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    title: "Analyse du tour",
                    desc: "Verdict à partir d'une capture d'écran de l'historique.",
                    color: "from-amber-500/20 to-amber-500/5 border-amber-500/25 text-amber-300",
                  },
                  {
                    title: "Prédictions multi-jeux",
                    desc: "Aviator, JetX, CosmoX, Virtuel, Penalty.",
                    color: "from-amber-500/20 to-amber-500/5 border-amber-500/25 text-amber-200",
                  },
                  {
                    title: "Signaux temps réel",
                    desc: "Synchronisation live des statistiques et notifications.",
                    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/25 text-emerald-200",
                  },
                  {
                    title: "Espace Premium",
                    desc: "Modes exclusifs, précision accrue, support prioritaire.",
                    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/25 text-emerald-200",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className={`rounded-2xl border bg-gradient-to-br ${f.color} p-3`}
                  >
                    <p className="text-[12px] font-bold leading-tight text-white">{f.title}</p>
                    <p className="text-[10px] text-slate-300 mt-1 leading-snug">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key facts */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-3">
                Fiche technique
              </p>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {[
                  ["Éditeur", "J&H Studio"],
                  ["Origine", "Antananarivo, Madagascar"],
                  ["Plateformes", "Bet261 · 1xBet"],
                  ["Langue", "Français"],
                  ["Type", "Application web mobile"],
                  ["Public", "Joueurs majeurs (18+)"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
                      {k}
                    </p>
                    <p className="text-slate-200 font-medium leading-tight mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Support — WhatsApp + Email preserved exactly */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Contact & Support
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10 overflow-hidden">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs text-slate-400 truncate">{WHATSAPP_NUMBER}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
                <button
                  onClick={copyWhatsapp}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-amber-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{copied ? "Numéro copié" : "Copier le numéro"}</p>
                    <p className="text-xs text-slate-400 truncate">{WHATSAPP_NUMBER}</p>
                  </div>
                </button>
                <a
                  href={`mailto:jeuxdhazardmada@gmail.com`}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium">E-mail</p>
                    <p className="text-xs text-slate-400 truncate">jeuxdhazardmada@gmail.com</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-snug">
                Support technique et commercial du lundi au dimanche, réponse moyenne
                sous quelques heures via WhatsApp.
              </p>
            </div>

            {/* Legal */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Mentions légales
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                © 2017 {APP_NAME}. Tous droits réservés. L'utilisation de
                l'application implique l'acceptation des conditions générales.
                Les prédictions et analyses sont fournies à titre informatif et
                statistique ; elles ne garantissent aucun résultat de jeu.
                Réservé à un public majeur — jouez de manière responsable.
              </p>
            </div>
          </div>

        </SheetContent>
      </Sheet>
    </>
  );
};

const MenuRow = ({
  icon,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3.5 py-3.5 hover:bg-white/[0.04] transition text-left active:scale-[0.99]"
  >
    <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-white text-[14px] leading-tight">{label}</p>
      {sublabel && <p className="text-[11px] text-slate-400 truncate mt-0.5">{sublabel}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-slate-500" />
  </button>
);


const ActionRow = ({
  icon,
  label,
  sublabel,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition text-left ${danger ? "text-amber-300" : ""}`}
  >
    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
      {danger ? <Trash2 className="w-5 h-5 text-amber-400" /> : icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 truncate">{sublabel}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-slate-400" />
  </button>
);

const ToggleRow = ({
  icon,
  label,
  sublabel,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) => (
  <div className="flex items-center gap-3 px-3 py-3">
    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-white">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 truncate">{sublabel}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default BottomNav;
