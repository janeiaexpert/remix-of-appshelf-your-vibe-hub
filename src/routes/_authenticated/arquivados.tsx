import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { AppsExplorer } from "@/components/AppsExplorer";

export const Route = createFileRoute("/_authenticated/arquivados")({
  head: () => ({
    meta: [
      { title: "Arquivados — AppShelf" },
      {
        name: "description",
        content: "Veja e restaure os aplicativos que você arquivou no AppShelf.",
      },
      { property: "og:title", content: "Arquivados — AppShelf" },
      { property: "og:description", content: "Veja e restaure os aplicativos arquivados." },
    ],
  }),
  component: () => (
    <AppShell>
      <AppsExplorer archived />
    </AppShell>
  ),
});
