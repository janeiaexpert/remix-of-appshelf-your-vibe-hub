import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AppShelf — organize seus apps Vibe Coding" },
      {
        name: "description",
        content:
          "AppShelf é seu portal pessoal para cadastrar, organizar, favoritar e acompanhar todos os aplicativos que você cria.",
      },
      { property: "og:title", content: "AppShelf — organize seus apps Vibe Coding" },
      {
        property: "og:description",
        content: "Cadastre, organize e acompanhe todos os aplicativos que você cria.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/dashboard" : "/auth", replace: true });
    });
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Carregando" />
    </div>
  );
}
