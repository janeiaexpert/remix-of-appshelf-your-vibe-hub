import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  PLATFORMS,
  STATUSES,
  emptyAppInput,
  isValidUrl,
  normalizeUrl,
  type App,
  type AppInput,
} from "@/lib/appshelf";
import { importAppFromUrl } from "@/lib/app-import.functions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app?: App | undefined;
  saving: boolean;
  onSubmit: (input: AppInput) => void;
};

export function AppForm({ open, onOpenChange, app, saving, onSubmit }: Props) {
  const [values, setValues] = useState<AppInput>(emptyAppInput);
  const [tagText, setTagText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [lastImportedUrl, setLastImportedUrl] = useState("");
  const importFromUrl = useServerFn(importAppFromUrl);

  useEffect(() => {
    if (!open) return;
    if (app) {
      setValues({
        name: app.name,
        description: app.description,
        app_url: app.app_url,
        repo_url: app.repo_url,
        category: app.category,
        platform: app.platform,
        status: app.status,
        tags: app.tags,
      });
      setTagText(app.tags.join(", "));
      setDetailsOpen(true);
      setLastImportedUrl(app.app_url || app.repo_url);
    } else {
      setValues(emptyAppInput);
      setTagText("");
      setDetailsOpen(false);
      setLastImportedUrl("");
    }
    setErrors({});
  }, [open, app]);

  function set<K extends keyof AppInput>(key: K, value: AppInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function organizeLink(showSuccess = true): Promise<AppInput | undefined> {
    const link = values.app_url.trim();
    if (!isValidUrl(link) || !link) {
      setErrors((previous) => ({ ...previous, app_url: "Informe um link válido." }));
      return undefined;
    }
    setImporting(true);
    setErrors((previous) => ({ ...previous, app_url: "" }));
    try {
      const imported = await importFromUrl({ data: { url: link } });
      setValues(imported);
      setTagText(imported.tags.join(", "));
      setLastImportedUrl(link);
      setDetailsOpen(true);
      if (showSuccess) toast.success("Dados encontrados e organizados.");
      return imported;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não conseguimos organizar esse link.";
      setErrors((previous) => ({ ...previous, app_url: message }));
      return undefined;
    } finally {
      setImporting(false);
    }
  }

  function submitValues(input: AppInput) {
    const tags = Array.from(
      new Set(
        tagText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12),
      ),
    );
    onSubmit({
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      app_url: normalizeUrl(input.app_url),
      repo_url: normalizeUrl(input.repo_url),
      tags,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!app && values.app_url.trim() !== lastImportedUrl) {
      const imported = await organizeLink(false);
      if (imported) onSubmit(imported);
      return;
    }
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next["name"] = "Informe um nome com pelo menos 2 letras.";
    if (values.name.trim().length > 80) next["name"] = "O nome deve ter no máximo 80 caracteres.";
    if (values.description.length > 600)
      next["description"] = "A descrição deve ter no máximo 600 caracteres.";
    if (!isValidUrl(values.app_url)) next["app_url"] = "Endereço inválido.";
    if (!isValidUrl(values.repo_url)) next["repo_url"] = "Endereço inválido.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    submitValues(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {app ? "Editar aplicativo" : "Novo aplicativo"}
          </DialogTitle>
          <DialogDescription>
            {app ? "Atualize os dados deste projeto." : "Cole o link. O AppShelf cuida do restante."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="app_url">Link do aplicativo</Label>
            <div className="flex gap-2">
              <Input
                id="app_url"
                value={values.app_url}
                onChange={(e) => {
                  set("app_url", e.target.value);
                  setLastImportedUrl("");
                }}
                aria-invalid={Boolean(errors["app_url"])}
                aria-describedby={errors["app_url"] ? "app-url-error" : undefined}
                placeholder="meuapp.lovable.app"
                autoFocus={!app}
              />
              {!app && (
                <Button type="button" variant="outline" onClick={() => void organizeLink()} disabled={importing || saving} aria-label="Organizar link automaticamente">
                  {importing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                </Button>
              )}
            </div>
            {errors["app_url"] && (
              <p id="app-url-error" role="alert" className="text-sm text-destructive">
                {errors["app_url"]}
              </p>
            )}
            {!app && !errors["app_url"] && (
              <p className="text-xs text-muted-foreground">Nome, descrição, categoria, plataforma, situação e etiquetas serão preenchidos automaticamente.</p>
            )}
          </div>

          <Collapsible open={app || detailsOpen} onOpenChange={setDetailsOpen}>
            {!app && (
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between px-0">
                  Revisar ou ajustar detalhes
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={Boolean(errors["name"])} aria-describedby={errors["name"] ? "name-error" : undefined} placeholder="Ex.: Diário de hábitos" />
                {errors["name"] && <p id="name-error" role="alert" className="text-sm text-destructive">{errors["name"]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} placeholder="O que este app faz?" />
                {errors["description"] && <p role="alert" className="text-sm text-destructive">{errors["description"]}</p>}
              </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="final_app_url">Link público</Label>
              <Input id="final_app_url" value={values.app_url} onChange={(e) => set("app_url", e.target.value)} placeholder="meuapp.lovable.app" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo_url">Link do código</Label>
              <Input
                id="repo_url"
                value={values.repo_url}
                onChange={(e) => set("repo_url", e.target.value)}
                aria-invalid={Boolean(errors["repo_url"])}
                placeholder="github.com/voce/projeto"
              />
              {errors["repo_url"] && (
                <p role="alert" className="text-sm text-destructive">
                  {errors["repo_url"]}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={values.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select value={values.platform} onValueChange={(v) => set("platform", v)}>
                <SelectTrigger id="platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Situação</Label>
              <Select value={values.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <Input
              id="tags"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="react, ia, protótipo"
            />
            <p className="text-xs text-muted-foreground">Separe por vírgulas.</p>
          </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || importing}>
              {(saving || importing) && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {app ? "Salvar alterações" : "Organizar e adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
