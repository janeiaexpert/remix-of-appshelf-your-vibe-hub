import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type App = Database["public"]["Tables"]["apps"]["Row"];
export type AppNote = Database["public"]["Tables"]["app_notes"]["Row"];

export const CATEGORIES = [
  "Produtividade",
  "Finanças",
  "Educação",
  "Saúde",
  "E-commerce",
  "Social",
  "Ferramenta interna",
  "Portfólio",
  "Experimento",
  "Outro",
] as const;

export const PLATFORMS = ["Web", "Mobile", "Desktop", "API", "Extensão"] as const;

export const STATUSES = [
  { value: "ideia", label: "Ideia" },
  { value: "em_desenvolvimento", label: "Em desenvolvimento" },
  { value: "publicado", label: "Publicado" },
  { value: "pausado", label: "Pausado" },
] as const;

export type StatusValue = (typeof STATUSES)[number]["value"];

export function statusLabel(value: string): string {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function statusClasses(value: string): string {
  switch (value) {
    case "publicado":
      return "bg-primary/15 text-primary border-primary/30";
    case "em_desenvolvimento":
      return "bg-accent/40 text-accent-foreground border-accent";
    case "pausado":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export type AppInput = {
  name: string;
  description: string;
  app_url: string;
  repo_url: string;
  category: string;
  platform: string;
  status: string;
  tags: string[];
};

export const emptyAppInput: AppInput = {
  name: "",
  description: "",
  app_url: "",
  repo_url: "",
  category: "Outro",
  platform: "Web",
  status: "ideia",
  tags: [],
};

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

export async function fetchApps(archived: boolean): Promise<App[]> {
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("is_archived", archived)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchApp(id: string): Promise<App> {
  const { data, error } = await supabase.from("apps").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Aplicativo não encontrado.");
  return data;
}

export async function fetchNotes(appId: string): Promise<AppNote[]> {
  const { data, error } = await supabase
    .from("app_notes")
    .select("*")
    .eq("app_id", appId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const appsQuery = (archived: boolean) =>
  queryOptions({ queryKey: ["apps", { archived }], queryFn: () => fetchApps(archived) });

export const appQuery = (id: string) =>
  queryOptions({ queryKey: ["app", id], queryFn: () => fetchApp(id) });

export const notesQuery = (appId: string) =>
  queryOptions({ queryKey: ["notes", appId], queryFn: () => fetchNotes(appId) });

export async function createApp(input: AppInput): Promise<App> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("apps")
    .insert({ ...input, user_id })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateApp(id: string, patch: Partial<AppInput>): Promise<App> {
  const { data, error } = await supabase
    .from("apps")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setFlags(
  id: string,
  patch: { is_favorite?: boolean; is_archived?: boolean },
): Promise<App> {
  const { data, error } = await supabase
    .from("apps")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteApp(id: string): Promise<void> {
  const { error } = await supabase.from("apps").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addNote(appId: string, content: string): Promise<AppNote> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("app_notes")
    .insert({ app_id: appId, user_id, content })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateNote(id: string, content: string): Promise<AppNote> {
  const { data, error } = await supabase
    .from("app_notes")
    .update({ content })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("app_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    new URL(normalizeUrl(value));
    return true;
  } catch {
    return false;
  }
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
