import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no AppShelf — sua estante de apps" },
      {
        name: "description",
        content:
          "Acesse o AppShelf para cadastrar, organizar e acompanhar seus aplicativos Vibe Coding em um só lugar.",
      },
      { property: "og:title", content: "Entrar no AppShelf" },
      {
        property: "og:description",
        content: "Acesse sua estante pessoal de aplicativos Vibe Coding.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (mode === "criar" && password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "entrar") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success("Conta criada! Confirme o e-mail que enviamos para entrar.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Boxes className="size-6" aria-hidden="true" />
          <span className="font-display text-xl font-semibold">AppShelf</span>
        </div>
        <div className="max-w-sm">
          <h2 className="font-display text-4xl leading-tight font-semibold">
            Sua estante pessoal de apps Vibe Coding.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Cadastre projetos, marque favoritos, acompanhe a situação de cada um e guarde
            observações — tudo organizado e só seu.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">Feito para quem cria muito.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Boxes className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-semibold">AppShelf</span>
          </div>

          <h1 className="font-display text-2xl font-semibold">Bem-vindo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre para acessar seus aplicativos.
          </p>

          <Tabs value={mode} onValueChange={setMode} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value={mode} className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "entrar" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {mode === "entrar" ? "Entrar" : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            Continuar com Google
          </Button>
        </div>
      </section>
    </div>
  );
}
