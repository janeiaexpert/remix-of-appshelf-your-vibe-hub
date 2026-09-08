import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Archive, LayoutGrid, List, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";

import { AppCard } from "@/components/AppCard";
import { AppForm } from "@/components/AppForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  STATUSES,
  appsQuery,
  createApp,
  deleteApp,
  setFlags,
  updateApp,
  type App,
  type AppInput,
} from "@/lib/appshelf";

type Props = { archived: boolean };

export function AppsExplorer({ archived }: Props) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery(appsQuery(archived));

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [category, setCategory] = useState("todas");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState("recentes");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<App | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<App | undefined>(undefined);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["apps"] });
    queryClient.invalidateQueries({ queryKey: ["app"] });
  }

  const saveMutation = useMutation({
    mutationFn: (input: AppInput) => (editing ? updateApp(editing.id, input) : createApp(input)),
    onSuccess: () => {
      toast.success(editing ? "Aplicativo atualizado." : "Aplicativo adicionado.");
      setFormOpen(false);
      setEditing(undefined);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { is_favorite?: boolean; is_archived?: boolean } }) =>
      setFlags(id, patch),
    onSuccess: () => invalidate(),
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApp(id),
    onSuccess: () => {
      toast.success("Aplicativo excluído.");
      setPendingDelete(undefined);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (data ?? []).filter((app) => {
      if (onlyFavorites && !app.is_favorite) return false;
      if (status !== "todos" && app.status !== status) return false;
      if (category !== "todas" && app.category !== category) return false;
      if (!term) return true;
      return (
        app.name.toLowerCase().includes(term) ||
        app.description.toLowerCase().includes(term) ||
        app.tags.some((t) => t.toLowerCase().includes(term))
      );
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case "antigos":
          return a.created_at.localeCompare(b.created_at);
        case "nome":
          return a.name.localeCompare(b.name, "pt-BR");
        case "atualizados":
          return b.updated_at.localeCompare(a.updated_at);
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
  }, [data, search, status, category, onlyFavorites, sort]);

  const hasFilters =
    search.trim() !== "" || status !== "todos" || category !== "todas" || onlyFavorites;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {archived ? "Arquivados" : "Meus apps"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {archived
              ? "Projetos guardados. Restaure quando quiser retomar."
              : "Tudo o que você já construiu, num só lugar."}
          </p>
        </div>
        {!archived && (
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo app
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Label htmlFor="busca" className="sr-only">
              Pesquisar aplicativos
            </Label>
            <Input
              id="busca"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, descrição ou etiqueta"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[11rem]" aria-label="Filtrar por situação">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as situações</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[11rem]" aria-label="Filtrar por categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[11rem]" aria-label="Ordenar">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="antigos">Mais antigos</SelectItem>
                <SelectItem value="atualizados">Atualizados por último</SelectItem>
                <SelectItem value="nome">Nome (A–Z)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={onlyFavorites ? "default" : "outline"}
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites((v) => !v)}
            >
              <Star className={cn("size-4", onlyFavorites && "fill-current")} aria-hidden="true" />
              Favoritos
            </Button>

            <div className="flex rounded-lg border border-border p-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ver em grade"
                aria-pressed={view === "grid"}
                className={cn(view === "grid" && "bg-secondary")}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ver em lista"
                aria-pressed={view === "list"}
                className={cn(view === "list" && "bg-secondary")}
                onClick={() => setView("list")}
              >
                <List className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center"
        >
          <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Não conseguimos carregar seus apps."}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary">
            {archived ? (
              <Archive className="size-5" aria-hidden="true" />
            ) : (
              <Plus className="size-5" aria-hidden="true" />
            )}
          </span>
          <h2 className="font-display text-lg font-semibold">
            {hasFilters
              ? "Nada encontrado"
              : archived
                ? "Nenhum app arquivado"
                : "Sua estante está vazia"}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasFilters
              ? "Tente mudar a pesquisa ou os filtros."
              : archived
                ? "Apps que você arquivar aparecem aqui."
                : "Cadastre seu primeiro aplicativo para começar a organizar."}
          </p>
          {hasFilters ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatus("todos");
                setCategory("todas");
                setOnlyFavorites(false);
              }}
            >
              Limpar filtros
            </Button>
          ) : (
            !archived && (
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Adicionar app
              </Button>
            )
          )}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "aplicativo" : "aplicativos"}
          </p>
          <div
            className={cn(
              view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3",
            )}
          >
            {filtered.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                view={view}
                onToggleFavorite={(a) =>
                  flagMutation.mutate({ id: a.id, patch: { is_favorite: !a.is_favorite } })
                }
                onToggleArchive={(a) => {
                  flagMutation.mutate({ id: a.id, patch: { is_archived: !a.is_archived } });
                  toast.success(a.is_archived ? "Aplicativo restaurado." : "Aplicativo arquivado.");
                }}
                onEdit={(a) => {
                  setEditing(a);
                  setFormOpen(true);
                }}
                onDelete={(a) => setPendingDelete(a)}
              />
            ))}
          </div>
        </>
      )}

      <AppForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        app={editing}
        saving={saveMutation.isPending}
        onSubmit={(input) => saveMutation.mutate(input)}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As observações deste app também serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
