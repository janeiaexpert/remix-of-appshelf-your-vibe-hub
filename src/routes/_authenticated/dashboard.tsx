import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Archive, Boxes, Rocket, Star } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appsQuery, formatDate, statusClasses, statusLabel, STATUSES } from "@/lib/appshelf";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — AppShelf" },
      {
        name: "description",
        content:
          "Acompanhe quantos aplicativos você tem, quais estão publicados, favoritos e arquivados no AppShelf.",
      },
      { property: "og:title", content: "Painel — AppShelf" },
      {
        property: "og:description",
        content: "Acompanhe seus aplicativos: publicados, favoritos e arquivados.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const active = useQuery(appsQuery(false));
  const archived = useQuery(appsQuery(true));

  const isLoading = active.isLoading || archived.isLoading;
  const isError = active.isError || archived.isError;

  const apps = active.data ?? [];
  const stats = [
    { label: "Apps ativos", value: apps.length, icon: Boxes },
    {
      label: "Publicados",
      value: apps.filter((a) => a.status === "publicado").length,
      icon: Rocket,
    },
    { label: "Favoritos", value: apps.filter((a) => a.is_favorite).length, icon: Star },
    { label: "Arquivados", value: (archived.data ?? []).length, icon: Archive },
  ];

  const recent = [...apps]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);
  const favorites = apps.filter((a) => a.is_favorite).slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Painel</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Um panorama rápido da sua estante de apps.
            </p>
          </div>
          <Button asChild>
            <Link to="/apps">Ver todos os apps</Link>
          </Button>
        </div>

        {isError && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
          >
            <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Não conseguimos carregar seus dados agora.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => {
                active.refetch();
                archived.refetch();
              }}
            >
              Tentar de novo
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) =>
            isLoading ? (
              <Skeleton key={label} className="h-28 rounded-2xl" />
            ) : (
              <div key={label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
              </div>
            ),
          )}
        </div>

        {!isLoading && apps.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Por situação</h2>
            <div className="mt-4 space-y-3">
              {STATUSES.map((s) => {
                const count = apps.filter((a) => a.status === s.value).length;
                const pct = apps.length ? Math.round((count / apps.length) * 100) : 0;
                return (
                  <div key={s.value} className="flex items-center gap-4">
                    <span className="w-40 shrink-0 text-sm">{s.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <PanelList title="Atividade recente" items={recent} loading={isLoading} />
          <PanelList
            title="Favoritos"
            items={favorites}
            loading={isLoading}
            emptyText="Marque apps com a estrela para vê-los aqui."
          />
        </div>

        {!isLoading && apps.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
            <h2 className="font-display text-lg font-semibold">Comece sua estante</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Cadastre o primeiro aplicativo para ver estatísticas e acompanhar sua evolução.
            </p>
            <Button asChild>
              <Link to="/apps">Adicionar meu primeiro app</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

type PanelItem = {
  id: string;
  name: string;
  status: string;
  updated_at: string;
};

function PanelList({
  title,
  items,
  loading,
  emptyText = "Nada por aqui ainda.",
}: {
  title: string;
  items: PanelItem[];
  loading: boolean;
  emptyText?: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((app) => (
            <li key={app.id}>
              <Link
                to="/apps/$id"
                params={{ id: app.id }}
                className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{app.name}</span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    statusClasses(app.status),
                  )}
                >
                  {statusLabel(app.status)}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {formatDate(app.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
