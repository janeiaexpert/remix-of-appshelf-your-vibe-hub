import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  Pencil,
  Star,
  Trash2,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate, statusClasses, statusLabel, type App } from "@/lib/appshelf";

type Props = {
  app: App;
  view: "grid" | "list";
  onToggleFavorite: (app: App) => void;
  onToggleArchive: (app: App) => void;
  onEdit: (app: App) => void;
  onDelete: (app: App) => void;
};

export function AppCard({ app, view, onToggleFavorite, onToggleArchive, onEdit, onDelete }: Props) {
  return (
    <article
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        view === "list" && "sm:flex sm:items-center sm:gap-6",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-lg font-semibold">
            <Link
              to="/apps/$id"
              params={{ id: app.id }}
              className="rounded outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring"
            >
              {app.name}
            </Link>
          </h3>
          <div className="relative z-10 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={app.is_favorite ? "Remover dos favoritos" : "Marcar como favorito"}
              aria-pressed={app.is_favorite}
              onClick={() => onToggleFavorite(app)}
            >
              <Star
                className={cn("size-4", app.is_favorite && "fill-accent text-accent")}
                aria-hidden="true"
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Ações para ${app.name}`}>
                  <MoreVertical className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(app)}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleArchive(app)}>
                  {app.is_archived ? (
                    <>
                      <ArchiveRestore className="size-4" aria-hidden="true" /> Restaurar
                    </>
                  ) : (
                    <>
                      <Archive className="size-4" aria-hidden="true" /> Arquivar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(app)}
                >

                  <Trash2 className="size-4" aria-hidden="true" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {app.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
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
          {app.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground",
          view === "list" && "sm:mt-0 sm:flex-col sm:items-end",
        )}
      >
        <span>Criado em {formatDate(app.created_at)}</span>
        {app.app_url && (
          <a
            href={app.app_url}
            target="_blank"
            rel="noreferrer noopener"
            className="relative z-10 inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Abrir <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
