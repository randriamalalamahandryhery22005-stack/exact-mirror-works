import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { useCall } from "@/contexts/CallContext";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AccountBadges from "@/components/AccountBadges";
import UserProfileDialog from "@/components/UserProfileDialog";
import CallHistoryDialog from "@/components/CallHistoryDialog";
import MessageAttachments from "@/components/chat/MessageAttachments";
import RichText from "@/components/chat/RichText";
import { useAccountBadges } from "@/hooks/useAccountBadges";
import { useGlobalChat, type ChatRow, type Profile } from "@/hooks/useGlobalChat";
import { buildEditedContent, parseMessage } from "@/lib/chatMeta";
import { playNotificationSound, unlockAudioPlayback } from "@/lib/notificationSound";
import {
  MAX_IMAGES_PER_MESSAGE,
  humanSize,
  isImageFile,
  mergeSelection,
  readAttachments,
  uploadAttachments,
  uploadVoice,
  type Attachment,
} from "@/lib/chatAttachments";
import {
  ArrowLeft,
  Send,
  ImagePlus,
  Paperclip,
  X,
  Search,
  Reply,
  Trash2,
  Loader2,
  MessageCircle,
  Smile,
  Eye,
  Check,
  CheckCheck,
  Phone,
  FileText,
  Play,
  Pencil,
  History,
  PhoneCall,
  WifiOff,
  ChevronDown,
  Lock,
  Users,
  ShieldCheck,
  AtSign,
} from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🙏"];

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString();
}

type Directory = { user_id: string; name: string | null; full_name: string | null; avatar_url: string | null };

export default function Chat() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { admins, premium } = useAccountBadges();

  const {
    messages,
    profiles,
    reactions,
    reads,
    onlineIds,
    signedUrls,
    loading,
    connected,
    ingest,
    resolveAttachments,
    loadProfiles,
    onNewMessage,
  } = useGlobalChat(user?.id ?? null);

  /** Fil actif : `null` = salon public, sinon identifiant du correspondant privé. */
  const [peer, setPeer] = useState<string | null>(null);
  const [threadsOpen, setThreadsOpen] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<ChatRow | null>(null);
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [viewersFor, setViewersFor] = useState<ChatRow | null>(null);
  const [profileFor, setProfileFor] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [originalFor, setOriginalFor] = useState<ChatRow | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [directory, setDirectory] = useState<Directory[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const { openPanel: openCallPanel } = useCall();

  useEffect(() => {
    if (searchParams.get("call") === "1") {
      openCallPanel();
      const next = new URLSearchParams(searchParams);
      next.delete("call");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openCallPanel]);

  /* ------------------------------------------------------------------ */
  /* Annuaire (mentions + ouverture d'un message privé)                  */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("public_profiles")
        .select("user_id, name, full_name, avatar_url")
        .limit(500);
      if (alive && data) setDirectory(data as Directory[]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const dirName = useCallback(
    (id: string) => {
      const d = directory.find((x) => x.user_id === id);
      const p = profiles[id];
      return d?.full_name || d?.name || p?.full_name || p?.name || "Joueur";
    },
    [directory, profiles],
  );

  /** Correspondants privés autorisés : un utilisateur n'écrit qu'aux administrateurs. */
  const privatePeers = useMemo(() => {
    const ids = new Set<string>();
    for (const m of messages) {
      if (!m.private_with || !user) continue;
      if (m.user_id === user.id) ids.add(m.private_with);
      else if (m.private_with === user.id) ids.add(m.user_id);
    }
    if (!isAdmin) admins.forEach((a) => a !== user?.id && ids.add(a));
    return Array.from(ids);
  }, [messages, user, isAdmin, admins]);

  const contactOptions = useMemo(() => {
    if (!user) return [] as Directory[];
    const base = isAdmin ? directory : directory.filter((d) => admins.has(d.user_id));
    return base.filter((d) => d.user_id !== user.id);
  }, [directory, isAdmin, admins, user]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  atBottomRef.current = atBottom;

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Arrivée d'un message : son, suivi du fil ou compteur de non-lus.
  useEffect(() => {
    onNewMessage.current = (row: ChatRow) => {
      const mine = row.user_id === user?.id;
      if (!mine) playNotificationSound(/voice-/i.test(String(row.image_url || "")) ? "voice" : "message");
      if (mine || atBottomRef.current) window.setTimeout(() => scrollToBottom(true), 40);
      else setUnreadCount((c) => c + 1);
    };
    return () => {
      onNewMessage.current = null;
    };
  }, [onNewMessage, scrollToBottom, user?.id]);

  const firstPaint = useRef(true);
  useEffect(() => {
    if (!loading && firstPaint.current && messages.length > 0) {
      firstPaint.current = false;
      window.setTimeout(() => scrollToBottom(false), 60);
    }
  }, [loading, messages.length, scrollToBottom]);

  useEffect(() => {
    window.setTimeout(() => scrollToBottom(false), 60);
    setUnreadCount(0);
  }, [peer, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    setAtBottom(near);
    if (near) setUnreadCount(0);
  };

  /* ------------------------------------------------------------------ */
  /* Sélection de fichiers                                               */
  /* ------------------------------------------------------------------ */
  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const { files: next, error } = mergeSelection(files, incoming);
    if (error) toast.error(error);
    setFiles(next);
    const urls: Record<string, string> = {};
    for (const f of next) {
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      urls[key] = previews[key] || (isImageFile(f) ? URL.createObjectURL(f) : "");
    }
    setPreviews(urls);
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearFiles = () => {
    setFiles([]);
    setPreviews({});
  };

  /* ------------------------------------------------------------------ */
  /* Envoi                                                               */
  /* ------------------------------------------------------------------ */
  const insertRow = async (payload: {
    content: string;
    attachments: Attachment[];
  }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("global_chat_messages")
      .insert({
        user_id: user.id,
        content: payload.content,
        attachments: payload.attachments as unknown as never,
        image_url: payload.attachments[0]?.path ?? null,
        private_with: peer,
        reply_to_id: replyTo?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    if (data) {
      const row = data as ChatRow;
      ingest([row]);
      void resolveAttachments(readAttachments(row).map((a) => a.path));
    }
  };

  const send = async () => {
    if (!user || sending) return;
    const text = input.trim();
    if (!text && files.length === 0) return;
    setSending(true);
    try {
      let uploaded: Attachment[] = [];
      if (files.length > 0) {
        setUploadPct(0);
        uploaded = await uploadAttachments(user.id, files, (pct, index, total) =>
          setUploadPct(Math.round(((index + pct / 100) / total) * 100)),
        );
      }
      await insertRow({ content: text, attachments: uploaded });
      setInput("");
      clearFiles();
      setReplyTo(null);
      setMentionQuery(null);
      window.setTimeout(() => scrollToBottom(true), 40);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg ? `Échec de l'envoi : ${msg}` : "Échec de l'envoi");
      console.error(e);
    } finally {
      setSending(false);
      setUploadPct(null);
    }
  };

  const sendVoice = async (blob: Blob, durationMs: number) => {
    if (!user) return;
    try {
      setUploadPct(0);
      const att = await uploadVoice(user.id, blob, setUploadPct);
      await insertRow({
        content: `🎤 Message vocal · ${Math.max(1, Math.round(durationMs / 1000))}s`,
        attachments: [att],
      });
      setReplyTo(null);
      window.setTimeout(() => scrollToBottom(true), 40);
    } catch (e) {
      console.error(e);
      toast.error("Échec de l'envoi vocal");
    } finally {
      setUploadPct(null);
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("global_chat_messages").delete().eq("id", id);
    if (error) toast.error("Suppression impossible");
  };

  const startEdit = (m: ChatRow) => {
    setEditingId(m.id);
    setEditText(parseMessage(m.content).text);
  };

  const saveEdit = async (m: ChatRow) => {
    const next = editText.trim();
    const parsed = parseMessage(m.content);
    if (!next || next === parsed.text) {
      setEditingId(null);
      return;
    }
    const content = buildEditedContent(next, parsed.original ?? parsed.text);
    const { data, error } = await supabase
      .from("global_chat_messages")
      .update({ content })
      .eq("id", m.id)
      .select()
      .single();
    if (error) {
      toast.error("Modification impossible");
      return;
    }
    if (data) ingest([data as ChatRow]);
    setEditingId(null);
    toast.success("Message modifié");
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = reactions.find(
      (r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji,
    );
    if (existing) {
      const { error } = await supabase.from("chat_message_reactions").delete().eq("id", existing.id);
      if (error) toast.error("Impossible de retirer la réaction");
    } else {
      const { error } = await supabase
        .from("chat_message_reactions")
        .insert({ message_id: messageId, user_id: user.id, emoji });
      if (error) toast.error("Impossible d'ajouter la réaction");
    }
    setEmojiPickerFor(null);
  };

  /* ------------------------------------------------------------------ */
  /* Mentions                                                            */
  /* ------------------------------------------------------------------ */
  const onInputChange = (value: string) => {
    setInput(value);
    const m = /(?:^|\s)@([\p{L}\p{N}_ -]{0,24})$/u.exec(value);
    setMentionQuery(m ? m[1] : null);
  };

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.trim().toLowerCase();
    return directory
      .filter((d) => d.user_id !== user?.id)
      .filter((d) => !q || `${d.full_name || ""} ${d.name || ""}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, directory, user?.id]);

  const applyMention = (d: Directory) => {
    const label = d.full_name || d.name || "Joueur";
    setInput((prev) => prev.replace(/@([\p{L}\p{N}_ -]{0,24})$/u, `@${label} `));
    setMentionQuery(null);
  };

  const mentionNames = useMemo(() => directory.map((d) => d.full_name || d.name || "").filter(Boolean), [directory]);

  const openProfileByName = (name: string) => {
    const d = directory.find(
      (x) => (x.full_name || x.name || "").toLowerCase() === name.toLowerCase(),
    );
    if (d) setProfileFor(d.user_id);
  };

  /* --------------------------- Dérivés d'affichage --------------------------- */

  const threadMessages = useMemo(
    () =>
      messages.filter((m) => {
        if (!peer) return !m.private_with;
        if (!user) return false;
        return (
          (m.user_id === user.id && m.private_with === peer) ||
          (m.user_id === peer && m.private_with === user.id)
        );
      }),
    [messages, peer, user],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return threadMessages;
    const q = search.toLowerCase();
    return threadMessages.filter(
      (m) =>
        parseMessage(m.content).text.toLowerCase().includes(q) ||
        readAttachments(m).some((a) => a.name.toLowerCase().includes(q)),
    );
  }, [threadMessages, search]);

  const grouped = useMemo(() => {
    const out: Array<{ day: string; items: ChatRow[] }> = [];
    for (const m of filtered) {
      const day = formatDay(m.created_at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [filtered]);

  const msgById = useMemo(() => {
    const m: Record<string, ChatRow> = {};
    for (const x of messages) m[x.id] = x;
    return m;
  }, [messages]);

  const displayName = (p?: Profile) => p?.full_name || p?.name || "Joueur";

  const reactionsByMsg = useMemo(() => {
    const m: Record<string, Record<string, typeof reactions>> = {};
    for (const r of reactions) {
      m[r.message_id] ??= {};
      m[r.message_id][r.emoji] ??= [];
      m[r.message_id][r.emoji].push(r);
    }
    return m;
  }, [reactions]);

  const readsByMsg = useMemo(() => {
    const m: Record<string, typeof reads> = {};
    for (const r of reads) {
      m[r.message_id] ??= [];
      m[r.message_id].push(r);
    }
    return m;
  }, [reads]);

  const unreadByPeer = useMemo(() => {
    const out: Record<string, number> = {};
    if (!user) return out;
    const seen = new Set(reads.filter((r) => r.user_id === user.id).map((r) => r.message_id));
    for (const m of messages) {
      if (!m.private_with || m.user_id === user.id || seen.has(m.id)) continue;
      if (m.private_with !== user.id) continue;
      out[m.user_id] = (out[m.user_id] || 0) + 1;
    }
    return out;
  }, [messages, reads, user]);

  const viewers = viewersFor ? readsByMsg[viewersFor.id] || [] : [];

  useEffect(() => {
    if (privatePeers.length > 0) void loadProfiles(privatePeers);
  }, [privatePeers, loadProfiles]);

  const openThread = (id: string | null) => {
    unlockAudioPlayback();
    setPeer(id);
    setThreadsOpen(false);
    setReplyTo(null);
    clearFiles();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/10"
        style={{ background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.78))" }}
      >
        <div className="max-w-2xl mx-auto px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => (peer ? openThread(null) : navigate(-1))}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            aria-label="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => peer && setProfileFor(peer)}
            className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center shrink-0"
          >
            {peer && profiles[peer]?.avatar_url ? (
              <img src={profiles[peer]!.avatar_url!} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : peer ? (
              <span className="text-[11px] font-bold uppercase">{initials(dirName(peer))}</span>
            ) : (
              <MessageCircle className="w-4 h-4 text-white" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold leading-tight truncate flex items-center gap-1.5">
              {peer ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> {dirName(peer)}
                </>
              ) : (
                "J&H Chats"
              )}
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              {connected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {peer
                    ? onlineIds.has(peer)
                      ? "En ligne"
                      : "Message privé chiffré au compte"
                    : `Temps réel · ${onlineIds.size} en ligne`}
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" /> Reconnexion…
                </>
              )}
              <span className="text-slate-600">·</span>
              <span>{threadMessages.length} messages</span>
            </p>
          </div>
          <button
            onClick={() => setThreadsOpen(true)}
            className="relative w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            title="Conversations privées"
            aria-label="Conversations privées"
          >
            <Users className="w-4 h-4 text-amber-300" />
            {Object.keys(unreadByPeer).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold grid place-items-center">
                {Object.values(unreadByPeer).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            title="Historique des appels"
            aria-label="Historique des appels"
          >
            <PhoneCall className="w-4 h-4 text-emerald-300" />
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un message ou un fichier..."
              className="w-full pl-9 pr-3 h-9 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto" style={{ paddingBottom: "180px" }}>
        <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              {search.trim()
                ? "Aucun message ne correspond à votre recherche."
                : peer
                  ? "Démarrez cette conversation privée."
                  : "Aucun message pour l'instant. Soyez le premier à écrire !"}
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.day} className="space-y-2">
                <div className="flex justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full">
                    {g.day}
                  </span>
                </div>
                {g.items.map((m) => {
                  const mine = m.user_id === user?.id;
                  const p = profiles[m.user_id];
                  const online = onlineIds.has(m.user_id);
                  const reply = m.reply_to_id ? msgById[m.reply_to_id] : null;
                  const replyAuthor = reply ? profiles[reply.user_id] : null;
                  const atts = readAttachments(m);
                  const msgReactions = reactionsByMsg[m.id] || {};
                  const msgReads = readsByMsg[m.id] || [];
                  const readCount = msgReads.filter((r) => r.user_id !== m.user_id).length;
                  const parsed = parseMessage(m.content);
                  const isVoice = atts.some((a) => /voice-/i.test(a.path));

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 group ${mine ? "flex-row-reverse" : ""}`}
                      style={{ animation: "chat-in 0.25s ease-out" }}
                    >
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setProfileFor(m.user_id)}
                          className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 ring-1 ring-white/10 flex items-center justify-center"
                          title="Voir le profil"
                        >
                          {p?.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                            />
                          ) : (
                            <span className="text-[11px] font-bold uppercase">{initials(displayName(p))}</span>
                          )}
                        </button>
                        {online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                        )}
                      </div>
                      <div className={`min-w-0 max-w-[78%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                        <div className={`flex items-center gap-2 text-[11px] mb-1 ${mine ? "flex-row-reverse" : ""}`}>
                          <button
                            onClick={() => setProfileFor(m.user_id)}
                            className="font-semibold text-slate-200 truncate max-w-[150px] hover:underline"
                          >
                            {mine ? "Vous" : displayName(p)}
                          </button>
                          <AccountBadges userId={m.user_id} admins={admins} premium={premium} compact />
                          {m.private_with && <Lock className="w-3 h-3 text-emerald-300" />}
                          <span className="text-slate-500">{formatTime(m.created_at)}</span>
                        </div>

                        <div
                          className={`relative w-full min-w-0 px-3 py-2 rounded-2xl text-[14px] leading-snug break-words overflow-hidden shadow ${
                            mine
                              ? "bg-gradient-to-br from-amber-600 to-emerald-600 text-white rounded-tr-sm"
                              : "bg-white/[0.06] border border-white/10 text-slate-100 rounded-tl-sm"
                          }`}
                        >
                          {reply && (
                            <div
                              className={`mb-1.5 px-2 py-1 rounded-lg text-[11px] border-l-2 ${
                                mine ? "bg-white/10 border-white/40" : "bg-black/20 border-amber-400"
                              }`}
                            >
                              <div className="font-semibold opacity-80 truncate">
                                {reply.user_id === user?.id ? "Vous" : displayName(replyAuthor ?? undefined)}
                              </div>
                              <div className="opacity-70 truncate">
                                {parseMessage(reply.content).text ||
                                  (readAttachments(reply).length > 0 ? "📎 Pièce jointe" : "")}
                              </div>
                            </div>
                          )}

                          {atts.length > 0 && (
                            <div className="mb-1">
                              <MessageAttachments
                                attachments={atts}
                                urls={signedUrls}
                                mine={mine}
                                messageId={m.id}
                              />
                            </div>
                          )}

                          {editingId === m.id ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={2}
                                className="w-full min-w-[200px] resize-none rounded-xl bg-black/30 border border-white/20 px-2 py-1.5 text-[13px] text-white focus:outline-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-[11px] px-2 py-1 rounded-lg bg-white/10"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={() => saveEdit(m)}
                                  className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                                >
                                  Enregistrer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {parsed.text && (
                                <div className={isVoice ? "text-[11px] opacity-70 mt-0.5" : "whitespace-pre-wrap break-words"}>
                                  <RichText
                                    text={parsed.text}
                                    mentionNames={mentionNames}
                                    onMentionClick={openProfileByName}
                                  />
                                </div>
                              )}
                              {parsed.editedAt && (
                                <button
                                  onClick={() => setOriginalFor(m)}
                                  className="mt-1 text-[10px] italic opacity-70 underline underline-offset-2"
                                  title="Voir le message original"
                                >
                                  modifié · {new Date(parsed.editedAt).toLocaleString()}
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {Object.keys(msgReactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : ""}`}>
                            {Object.entries(msgReactions).map(([emoji, list]) => {
                              const active = user && list.some((r) => r.user_id === user.id);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(m.id, emoji)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition ${
                                    active
                                      ? "bg-amber-500/30 border-amber-400/60 text-white"
                                      : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="font-semibold">{list.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-1 flex-wrap ${mine ? "flex-row-reverse" : ""}`}>
                          <div className="relative">
                            <button
                              onClick={() => setEmojiPickerFor(emojiPickerFor === m.id ? null : m.id)}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center gap-1"
                            >
                              <Smile className="w-3 h-3" /> Réagir
                            </button>
                            {emojiPickerFor === m.id && (
                              <div className="absolute z-40 mt-1 p-1.5 rounded-xl bg-slate-800 border border-white/10 shadow-xl flex gap-1">
                                {EMOJIS.map((e) => (
                                  <button
                                    key={e}
                                    onClick={() => toggleReaction(m.id, e)}
                                    className="w-7 h-7 rounded-lg hover:bg-white/10 text-base"
                                  >
                                    {e}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setReplyTo(m)}
                            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" /> Répondre
                          </button>
                          {!mine && (
                            <button
                              onClick={() => onInputChange(`${input}${input && !input.endsWith(" ") ? " " : ""}@${displayName(p)} `)}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center gap-1"
                            >
                              <AtSign className="w-3 h-3" /> Mentionner
                            </button>
                          )}
                          {mine && !isVoice && (
                            <button
                              onClick={() => startEdit(m)}
                              className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center gap-1"
                            >
                              <Pencil className="w-3 h-3" /> Modifier
                            </button>
                          )}
                          {mine ? (
                            <button
                              onClick={() => setViewersFor(m)}
                              className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center gap-1"
                            >
                              {readCount > 0 ? (
                                <CheckCheck className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Vu · {readCount}
                            </button>
                          ) : (
                            <button
                              onClick={() => setViewersFor(m)}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> {readCount}
                            </button>
                          )}
                          {(mine || isAdmin) && (
                            <button
                              onClick={() => deleteMessage(m.id)}
                              className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> {isAdmin && !mine ? "Admin" : "Supprimer"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {(unreadCount > 0 || !atBottom) && (
        <button
          onClick={() => {
            scrollToBottom(true);
            setUnreadCount(0);
          }}
          className="fixed left-1/2 -translate-x-1/2 z-40"
          style={{ bottom: "180px" }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-semibold shadow-lg">
            {unreadCount > 0
              ? `${unreadCount} nouveau${unreadCount > 1 ? "x" : ""} message${unreadCount > 1 ? "s" : ""}`
              : "Revenir en bas"}
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      <div
        className="fixed left-0 right-0 z-30 border-t border-white/10 backdrop-blur-xl"
        style={{ bottom: "72px", background: "linear-gradient(180deg, rgba(15,23,42,0.85), rgba(15,23,42,0.98))" }}
      >
        <div className="max-w-2xl mx-auto px-3 py-2.5 space-y-2">
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <Reply className="w-3.5 h-3.5 text-amber-300" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-200 truncate">
                  Réponse à {replyTo.user_id === user?.id ? "vous" : displayName(profiles[replyTo.user_id])}
                </div>
                <div className="text-slate-400 truncate">
                  {parseMessage(replyTo.content).text ||
                    (readAttachments(replyTo).length > 0 ? "📎 Pièce jointe" : "")}
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {files.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {files.map((f, i) => {
                const key = `${f.name}-${f.size}-${f.lastModified}`;
                const preview = previews[key];
                return (
                  <div key={key} className="relative shrink-0">
                    {preview ? (
                      <img src={preview} alt={f.name} className="h-20 w-20 object-cover rounded-xl border border-white/10" />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 max-w-[220px]">
                        {f.type.startsWith("video/") ? (
                          <Play className="w-4 h-4 text-amber-300 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-amber-300 shrink-0" />
                        )}
                        <span className="text-xs text-slate-200 truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">{humanSize(f.size)}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center"
                      aria-label="Retirer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <span className="text-[10px] text-slate-500 shrink-0">
                {files.every(isImageFile) ? `${files.length}/${MAX_IMAGES_PER_MESSAGE} images` : "1 fichier max"}
              </span>
            </div>
          )}

          {uploadPct !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="truncate">Envoi du fichier…</span>
                <span className="font-semibold text-amber-300 tabular-nums">{uploadPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
          )}

          {mentionMatches.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {mentionMatches.map((d) => (
                <button
                  key={d.user_id}
                  onClick={() => applyMention(d)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10"
                >
                  <AtSign className="w-3 h-3 text-amber-300" />
                  {d.full_name || d.name || "Joueur"}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            {!voiceActive && (
              <>
                <label
                  className="w-10 h-10 shrink-0 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer transition"
                  title="Envoyer jusqu'à 5 images"
                >
                  <ImagePlus className="w-4 h-4 text-amber-300" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files || []));
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <label
                  className="w-10 h-10 shrink-0 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer transition"
                  title="Envoyer un fichier (vidéo, PDF, APK, archive…)"
                >
                  <Paperclip className="w-4 h-4 text-amber-300" />
                  <input
                    type="file"
                    accept="*/*"
                    className="hidden"
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files || []));
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {!peer && (
                  <button
                    onClick={() => user && openCallPanel()}
                    disabled={!user}
                    className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 flex items-center justify-center transition disabled:opacity-40 active:scale-95"
                    title="Appel vocal de groupe"
                    aria-label="Appel vocal"
                  >
                    <Phone className="w-4 h-4 text-emerald-300" />
                  </button>
                )}
              </>
            )}
            <VoiceRecorder onSend={sendVoice} disabled={!user} onActiveChange={setVoiceActive} />
            {!voiceActive && (
              <>
                <textarea
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  placeholder={
                    !user
                      ? "Connectez-vous pour discuter"
                      : peer
                        ? `Message privé à ${dirName(peer)}…`
                        : "Écrire un message... (@ pour mentionner)"
                  }
                  disabled={!user || sending}
                  className="flex-1 min-w-0 max-h-32 resize-none rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <button
                  onClick={send}
                  disabled={sending || !user || (!input.trim() && files.length === 0)}
                  className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-amber-600 to-emerald-600 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
                  aria-label="Envoyer"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conversations privées */}
      <Dialog open={threadsOpen} onOpenChange={setThreadsOpen}>
        <DialogContent className="max-w-sm bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-4 h-4" /> Messages privés
            </DialogTitle>
          </DialogHeader>
          <p className="text-[11px] text-slate-400 -mt-2">
            {isAdmin
              ? "Vous pouvez échanger en privé avec n'importe quel compte."
              : "Les messages privés sont réservés aux échanges avec l'administration."}
          </p>
          <div className="max-h-80 overflow-y-auto space-y-1">
            <button
              onClick={() => openThread(null)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl ${!peer ? "bg-amber-500/20" : "bg-white/5 hover:bg-white/10"}`}
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 grid place-items-center">
                <MessageCircle className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">Salon public J&amp;H</span>
            </button>
            {contactOptions.map((d) => {
              const unread = unreadByPeer[d.user_id] || 0;
              return (
                <button
                  key={d.user_id}
                  onClick={() => openThread(d.user_id)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl ${
                    peer === d.user_id ? "bg-amber-500/20" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 grid place-items-center">
                    {d.avatar_url ? (
                      <img src={d.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[11px] font-bold uppercase">{initials(d.full_name || d.name)}</span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-sm font-medium truncate">{d.full_name || d.name || "Joueur"}</span>
                    {admins.has(d.user_id) && (
                      <span className="text-[10px] text-emerald-300 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Administration
                      </span>
                    )}
                  </span>
                  {unread > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-[10px] font-bold grid place-items-center">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
            {contactOptions.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">Aucun correspondant disponible.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Viewers dialog */}
      <Dialog open={!!viewersFor} onOpenChange={(o) => !o && setViewersFor(null)}>
        <DialogContent className="max-w-sm bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-4 h-4" /> Vu par {viewers.filter((v) => v.user_id !== viewersFor?.user_id).length}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {viewers.filter((v) => v.user_id !== viewersFor?.user_id).length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">Aucun utilisateur n'a encore vu ce message.</p>
            )}
            {viewers
              .filter((v) => v.user_id !== viewersFor?.user_id)
              .sort((a, b) => a.read_at.localeCompare(b.read_at))
              .map((v) => {
                const p = profiles[v.user_id];
                return (
                  <div key={v.user_id} className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[11px] font-bold uppercase">{initials(displayName(p))}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{displayName(p)}</p>
                      <p className="text-[11px] text-slate-400">{new Date(v.read_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Message original (après modification) */}
      <Dialog open={!!originalFor} onOpenChange={(o) => !o && setOriginalFor(null)}>
        <DialogContent className="max-w-sm bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <History className="w-4 h-4" /> Message original
            </DialogTitle>
          </DialogHeader>
          {originalFor && (
            <div className="space-y-2 text-sm">
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 whitespace-pre-wrap">
                {parseMessage(originalFor.content).original}
              </div>
              <p className="text-[11px] text-slate-400">
                Modifié le{" "}
                {new Date(parseMessage(originalFor.content).editedAt || originalFor.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UserProfileDialog
        userId={profileFor}
        open={!!profileFor}
        onClose={() => setProfileFor(null)}
        viewerIsAdmin={isAdmin}
        admins={admins}
        premium={premium}
      />

      {user && (
        <CallHistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} userId={user.id} profiles={profiles} />
      )}

      <BottomNav />
      <style>{`
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
