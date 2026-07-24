import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Image as ImageIcon, Music, Video, FileArchive, FileText, Smartphone, FolderOpen, Loader2, Megaphone, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { id: "image", label: "Image", icon: ImageIcon, accept: "image/*", needsFile: true },
  { id: "music", label: "Musique", icon: Music, accept: "audio/*", needsFile: true },
  { id: "video", label: "Vidéo", icon: Video, accept: "video/*", needsFile: true },
  { id: "apk", label: "APK", icon: Smartphone, accept: ".apk", needsFile: true },
  { id: "zip", label: "ZIP", icon: FileArchive, accept: ".zip,.rar,.7z,.tar,.gz", needsFile: true },
  { id: "folder", label: "Dossier", icon: FolderOpen, accept: "*/*", needsFile: true },
  { id: "annonce", label: "Annonce", icon: Megaphone, accept: "*/*", needsFile: false },
  { id: "link", label: "Lien", icon: LinkIcon, accept: "*/*", needsFile: false },
  { id: "other", label: "Autre", icon: FileText, accept: "*/*", needsFile: true },
];

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  file_name: string;
  file_size: number;
  file_url: string | null;
  file_path: string;
  download_count: number;
  created_at: string;
}

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const AdminGenStorePanel = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("image");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("gen_store_items")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async () => {
    if (!user) return;
    const cat = CATEGORIES.find((c) => c.id === category)!;
    if (!title.trim()) return toast.error("Titre obligatoire");
    if (!description.trim()) return toast.error("Description obligatoire");
    if (cat.needsFile && !file) return toast.error("Sélectionnez un fichier");
    if (category === "link" && !linkUrl.trim()) return toast.error("URL obligatoire");

    setUploading(true);
    try {
      let path = "";
      let fileUrl: string | null = null;
      let fileName = "";
      let fileSize = 0;
      let mime = "";
      if (cat.needsFile && file) {
        const ext = file.name.split(".").pop() || "bin";
        path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gen-store")
          .upload(path, file, { contentType: file.type, cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from("gen-store")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        fileUrl = signed?.signedUrl || null;
        fileName = file.name;
        fileSize = file.size;
        mime = file.type;
      }

      const { error: insErr } = await supabase.from("gen_store_items").insert({
        title: title.trim(),
        description: description.trim(),
        category,
        post_type: category === "annonce" ? "annonce" : category === "link" ? "link" : "file",
        body: !cat.needsFile ? description.trim() : null,
        link_url: category === "link" ? linkUrl.trim() : null,
        file_path: path,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mime,
        created_by: user.id,
        is_published: true,
      });
      if (insErr) throw insErr;

      toast.success("Publié dans J&H Store");
      setTitle("");
      setDescription("");
      setFile(null);
      setLinkUrl("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la publication");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Supprimer "${item.title}" ?`)) return;
    if (item.file_path) {
      await supabase.storage.from("gen-store").remove([item.file_path]);
    }
    await supabase.from("gen_store_items").delete().eq("id", item.id);
    toast.success("Supprimé");
    load();
  };

  const selectedCat = CATEGORIES.find((c) => c.id === category)!;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-card border border-border/40 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" /> Publier un contenu
        </h3>

        <div>
          <Label className="text-xs text-muted-foreground">Catégorie</Label>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-semibold transition-all ${
                  category === c.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/30"
                }`}
              >
                <c.icon className="w-4 h-4" />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Titre</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du contenu"
            className="h-10 mt-1"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Description (obligatoire)</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le contenu, son utilité, etc."
            rows={3}
            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {selectedCat.needsFile && (
          <div>
            <Label className="text-xs text-muted-foreground">Fichier</Label>
            <input
              type="file"
              accept={selectedCat.accept}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full mt-1 text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>
        )}
        {category === "link" && (
          <div>
            <Label className="text-xs text-muted-foreground">URL du lien</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="h-10 mt-1" />
          </div>
        )}

        <Button variant="premium" className="w-full" onClick={handleUpload} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {uploading ? "Publication..." : "Publier"}
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
          Publications ({items.length})
        </h3>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune publication.</p>
        )}
        <ul className="space-y-2">
          {items.map((it) => {
            const cat = CATEGORIES.find((c) => c.id === it.category) || CATEGORIES[6];
            const Icon = cat.icon;
            return (
              <li
                key={it.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/40"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{it.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {formatBytes(Number(it.file_size))} · {it.download_count} téléch.
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(it)}
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AdminGenStorePanel;
