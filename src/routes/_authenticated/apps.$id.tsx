import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { AppForm } from "@/components/AppForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  addNote,
  appQuery,
  deleteApp,
  deleteNote,
  formatDate,
  notesQuery,
  setFlags,
  statusClasses,
  statusLabel,
  updateApp,
  updateNote,
  type AppInput,
} from "@/lib/appshelf";

export const Route = createFileRoute("/_authenticated/apps/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do app — AppShelf" },
      {
        name: "description",
        content: "Veja links, situação, etiquetas e observações de um aplicativo cadastrado.",
      },
      { property: "og:title", content: "Detalhes do app — AppShelf" },
      {
        property: "og:description",
        content: "Links, situação, etiquetas e observações do seu aplicativo.",
      },
    ],
  }),
  component: AppDetailPage,
});

function AppDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const appResult = useQuery(appQuery(id));
  const notesResult = useQuery(notesQuery(id));

  const [formOpen, setFormOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function refreshApp() {
    queryClient.invalidateQueries({ queryKey: ["app", id] });
    queryClient.invalidateQueries({ queryKey: ["apps"] });
  }

  const saveMutation = useMutation({
    mutationFn: (input: AppInput) => updateApp(id, input),
    onSuccess: () => {
      toast.success("Aplicativo atualizado.");
      setFormOpen(false);
      refreshApp();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const flagMutation = useMutation({
    mutationFn: (patch: { is_favorite?: boolean; is_archived?: boolean }) => setFlags(id, patch),
    onSuccess: () => refreshApp(),
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteApp(id),
    onSuccess: () => {
      toast.success("Aplicativo excluído.");
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      navigate({ to: "/apps", replace: true });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => addNote(id, content),
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      updateNote(noteId, content),
    onSuccess: () => {
      setEditingNoteId(null);
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", id] }),
    onError: (err: Error) => toast.error(err.message),
  });

  if (appResult.isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (appResult.isError || !appResult.data) {
    return (
      <AppShell>
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center"
        >
          <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
          <h1 className="font-display text-lg font-semibold">Aplicativo indisponível</h1>
          <p className="text-sm text-muted-foreground">
            {appResult.error instanceof Error
              ? appResult.error.message
              : "Não encontramos este aplicativo."}
          </p>
          <Button asChild variant="outline">
            <Link to="/apps">Voltar para meus apps</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const app = appResult.data;
  const notes = notesResult.data ?? [];

  return (
    <AppShell>
      <div className="space-y-8">
        <Link
          to="/apps"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Meus apps
        </Link>

        <header className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{app.name}</h1>
              {app.description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{app.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    statusClasses(app.status),
                  )}
                >
                  {statusLabel(app.status)}
                </span>
                <Badge variant="secondary">{app.category}</Badge>
                <Badge variant="outline">{app.platform}</Badge>
                {app.is_archived && <Badge variant="outline">Arquivado</Badge>}
                {app.tags.map((tag) => (
                  <span key={tag} className="text-xs text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                aria-pressed={app.is_favorite}
                onClick={() => flagMutation.mutate({ is_favorite: !app.is_favorite })}
              >
                <Star
                  className={cn("size-4", app.is_favorite && "fill-accent text-accent")}
                  aria-hidden="true"
                />
                {app.is_favorite ? "Favorito" : "Favoritar"}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                <Pencil className="size-4" aria-hidden="true" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  flagMutation.mutate({ is_archived: !app.is_archived });
                  toast.success(app.is_archived ? "Restaurado." : "Arquivado.");
                }}
              >
                {app.is_archived ? (
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                ) : (
                  <Archive className="size-4" aria-hidden="true" />
                )}
                {app.is_archived ? "Restaurar" : "Arquivar"}
              </Button>
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                Excluir
              </Button>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Criado em</dt>
              <dd className="text-sm">{formatDate(app.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Atualizado em</dt>
              <dd className="text-sm">{formatDate(app.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Link do app</dt>
              <dd className="truncate text-sm">
                {app.app_url ? (
                  <a
                    href={app.app_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Abrir <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Código</dt>
              <dd className="truncate text-sm">
                {app.repo_url ? (
                  <a
                    href={app.repo_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Repositório <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          </dl>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Observações</h2>

          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const content = noteText.trim();
              if (!content) return;
              addNoteMutation.mutate(content);
            }}
          >
            <Label htmlFor="nova-observacao" className="sr-only">
              Nova observação
            </Label>
            <Textarea
              id="nova-observacao"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Anote ideias, próximos passos, bugs…"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!noteText.trim() || addNoteMutation.isPending}>
                {addNoteMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Adicionar observação
              </Button>
            </div>
          </form>

          <div className="mt-6">
            {notesResult.isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : notesResult.isError ? (
              <p role="alert" className="text-sm text-destructive">
                Não conseguimos carregar as observações.
              </p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma observação ainda. Comece escrevendo acima.
              </p>
            ) : (
              <ul className="space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="rounded-xl border border-border bg-background p-4">
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <Label htmlFor={`edit-${note.id}`} className="sr-only">
                          Editar observação
                        </Label>
                        <Textarea
                          id={`edit-${note.id}`}
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingNoteId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            disabled={!editingText.trim()}
                            onClick={() =>
                              updateNoteMutation.mutate({
                                noteId: note.id,
                                content: editingText.trim(),
                              })
                            }
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(note.created_at)}</span>
                          <button
                            type="button"
                            className="hover:text-foreground"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingText(note.content);
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="hover:text-destructive"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <AppForm
        open={formOpen}
        onOpenChange={setFormOpen}
        app={app}
        saving={saveMutation.isPending}
        onSubmit={(input) => saveMutation.mutate(input)}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{app.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As observações também serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeMutation.mutate()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
