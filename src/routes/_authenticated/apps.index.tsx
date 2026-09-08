import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { AppsExplorer } from "@/components/AppsExplorer";

export const Route = createFileRoute("/_authenticated/apps/")({
  head: () => ({
    meta: [
      { title: "Meus apps — AppShelf" },
      {
        name: "description",
        content: "Pesquise, filtre e organize todos os aplicativos que você cadastrou no AppShelf.",
      },
      { property: "og:title", content: "Meus apps — AppShelf" },
      { property: "og:description", content: "Pesquise, filtre e organize seus aplicativos." },
    ],
  }),
  component: () => (
    <AppShell>
      <AppsExplorer archived={false} />
    </AppShell>
  ),
});
