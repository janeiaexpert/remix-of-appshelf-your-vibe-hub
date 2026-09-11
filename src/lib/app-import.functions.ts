import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppInput } from "@/lib/appshelf";

const inputSchema = z.object({ url: z.string().trim().min(1).max(2048) });

const CATEGORY_RULES: Array<{ category: string; terms: string[] }> = [
  { category: "Finanças", terms: ["finance", "finança", "budget", "invoice", "payment", "bank"] },
  { category: "Educação", terms: ["education", "educação", "learn", "course", "study", "escola"] },
  { category: "Saúde", terms: ["health", "saúde", "fitness", "wellness", "medic", "habit"] },
  { category: "E-commerce", terms: ["shop", "store", "commerce", "loja", "produto", "checkout"] },
  { category: "Social", terms: ["social", "community", "comunidade", "chat", "network"] },
  { category: "Portfólio", terms: ["portfolio", "portfólio", "showcase", "currículo", "resume"] },
  {
    category: "Produtividade",
    terms: ["productivity", "produtividade", "task", "agenda", "note", "organize"],
  },
];

function decodeEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => entities[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, key: string): string {
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const attrs: Record<string, string> = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/gi)) {
      const name = match[1];
      const value = match[2];
      if (name && value !== undefined) attrs[name.toLowerCase()] = value;
    }
    const identifier = (attrs["property"] ?? attrs["name"] ?? "").toLowerCase();
    if (identifier === key.toLowerCase()) return decodeEntities(attrs["content"] ?? "");
  }
  return "";
}

function pageTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities(match?.[1] ?? "");
}

function normalizeAndValidateUrl(value: string): URL {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Informe um link válido.");
  }
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("O link precisa usar HTTP ou HTTPS.");

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blocked =
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^fc/i.test(hostname) ||
    /^fd/i.test(hostname) ||
    /^fe8|^fe9|^fea|^feb/i.test(hostname);
  if (blocked) throw new Error("Esse endereço não pode ser importado.");
  url.hash = "";
  return url;
}

async function fetchPublicPage(initialUrl: URL): Promise<{ html: string; finalUrl: URL }> {
  let current = initialUrl;
  for (let redirect = 0; redirect <= 4; redirect += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AppShelf/1.0 (metadata importer)",
        },
      });
    } catch {
      throw new Error("Não conseguimos acessar esse link.");
    } finally {
      clearTimeout(timeout);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("O site respondeu com um redirecionamento inválido.");
      current = normalizeAndValidateUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error("O site não permitiu a leitura automática.");
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("Esse link não aponta para uma página que possamos organizar.");
    }
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > 1_500_000)
      throw new Error("A página é grande demais para a leitura automática.");
    const html = (await response.text()).slice(0, 1_500_000);
    return { html, finalUrl: current };
  }
  throw new Error("O link fez redirecionamentos demais.");
}

function inferCategory(text: string): string {
  const normalized = text.toLocaleLowerCase("pt-BR");
  return (
    CATEGORY_RULES.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.category ??
    "Outro"
  );
}

function inferPlatform(url: URL, text: string): string {
  const value = `${url.hostname} ${url.pathname} ${text}`.toLowerCase();
  if (value.includes("chrome.google.com/webstore") || value.includes("extension"))
    return "Extensão";
  if (value.includes("api") || value.includes("developer")) return "API";
  if (value.includes("mobile") || value.includes("android") || value.includes("iphone"))
    return "Mobile";
  return "Web";
}

function inferredTags(url: URL, keywords: string, text: string): string[] {
  const raw = keywords.split(",").map((tag) => tag.trim().toLocaleLowerCase("pt-BR"));
  const known = ["ia", "ai", "saas", "react", "lovable", "no-code", "produtividade", "finanças"];
  const lower = text.toLocaleLowerCase("pt-BR");
  for (const tag of known) if (lower.includes(tag)) raw.push(tag === "ai" ? "ia" : tag);
  if (url.hostname.includes("lovable.app")) raw.push("lovable");
  return Array.from(new Set(raw.filter((tag) => tag.length >= 2 && tag.length <= 28))).slice(0, 8);
}

export const importAppFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AppInput> => {
    const requestedUrl = normalizeAndValidateUrl(data.url);
    const { html, finalUrl } = await fetchPublicPage(requestedUrl);
    const rawTitle =
      metaContent(html, "og:title") || metaContent(html, "twitter:title") || pageTitle(html);
    const hostnameName = finalUrl.hostname.replace(/^www\./, "").split(".")[0] ?? "Aplicativo";
    const name = (rawTitle.split(/\s+[|—–-]\s+/)[0] || hostnameName).trim().slice(0, 80);
    const description = (
      metaContent(html, "og:description") ||
      metaContent(html, "twitter:description") ||
      metaContent(html, "description")
    ).slice(0, 600);
    const keywords = metaContent(html, "keywords");
    const context = `${name} ${description} ${keywords}`;
    const isGithub =
      finalUrl.hostname === "github.com" || finalUrl.hostname.endsWith(".github.com");

    return {
      name: name || "Aplicativo",
      description,
      app_url: isGithub ? "" : finalUrl.toString(),
      repo_url: isGithub ? finalUrl.toString() : "",
      category: inferCategory(context),
      platform: inferPlatform(finalUrl, context),
      status: isGithub ? "em_desenvolvimento" : "publicado",
      tags: inferredTags(finalUrl, keywords, context),
    };
  });
