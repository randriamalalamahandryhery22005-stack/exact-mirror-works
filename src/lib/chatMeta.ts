// Métadonnées des messages du chat global.
// Le contenu embarque, dans un bloc invisible, le message d'origine, l'horodatage
// de modification et les pièces jointes supplémentaires (album de 5 images max),
// afin de rester compatible avec le schéma existant de `global_chat_messages`.

const MARK = "\u2063#JHEDIT:";

export type ParsedMessage = {
  text: string;
  original: string | null;
  editedAt: string | null;
  /** Pièces jointes supplémentaires (chemins storage), hors `image_url`. */
  attachments: string[];
};

const encode = (value: unknown) => {
  const json = JSON.stringify(value);
  try {
    return btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  } catch {
    return encodeURIComponent(json);
  }
};

const decode = (raw: string): { o?: string; t?: string; a?: string[] } | null => {
  try {
    const bin = atob(raw);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }
};

type MetaInput = {
  original?: string | null;
  editedAt?: string | null;
  attachments?: string[];
};

/** Construit le contenu à enregistrer avec ses métadonnées. */
export function buildContent(text: string, meta: MetaInput = {}) {
  const payload: { o?: string; t?: string; a?: string[] } = {};
  if (meta.original != null) payload.o = meta.original;
  if (meta.editedAt) payload.t = meta.editedAt;
  if (meta.attachments && meta.attachments.length > 0) payload.a = meta.attachments;
  if (Object.keys(payload).length === 0) return text;
  return `${text}${MARK}${encode(payload)}`;
}

/** Construit le contenu à enregistrer pour un message modifié. */
export function buildEditedContent(
  newText: string,
  original: string,
  editedAt = new Date().toISOString(),
  attachments: string[] = [],
) {
  return buildContent(newText, { original, editedAt, attachments });
}

/** Sépare le texte affichable des métadonnées. */
export function parseMessage(content: string | null | undefined): ParsedMessage {
  const raw = content ?? "";
  const idx = raw.indexOf(MARK);
  if (idx === -1) return { text: raw, original: null, editedAt: null, attachments: [] };
  const text = raw.slice(0, idx);
  const meta = decode(raw.slice(idx + MARK.length));
  return {
    text,
    original: meta?.o ?? null,
    editedAt: meta?.t ?? null,
    attachments: Array.isArray(meta?.a) ? (meta?.a as string[]) : [],
  };
}

/** Texte brut affichable (sans métadonnées). */
export const plainText = (content: string | null | undefined) => parseMessage(content).text;
