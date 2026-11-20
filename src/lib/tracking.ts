"use client";

/**
 * Camada de eventos do funil (plano › "Medição e painel").
 *
 * 1. Chegada à página, com origem  → page_view (+ UTMs/fbclid guardados)
 * 2. Leu a página                   → checklist_lido, scroll_50/90, secao_vista, engajamento
 * 3. Iniciou conversa               → whatsapp_click { origem }, com o código do visitante
 * 4. Virou atendimento / fechou     → marcado no painel (/admin/leads), pelo código
 *
 * Cada evento vai para: window.dataLayer, /api/events (que grava para o painel) e, só os do
 * EVENTO_META, para o Pixel da Meta e a API de Conversões, com o mesmo event_id para deduplicar.
 *
 * Aparelho interno (marcado no painel, Configuração): nada é enviado, para as visitas da equipe
 * não entrarem na conta.
 */

import { EVENTO_META, type EventName, PARAMETROS_CAMPANHA } from "./eventos";

export type { EventName } from "./eventos";

const ATTR_KEY = "jv_attr";
const CODE_KEY = "jv_codigo";
const SESSAO_KEY = "jv_sessao";
const PRIMEIRA_KEY = "jv_primeira_visita";
export const INTERNO_KEY = "jv_interno";
const ATTR_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSAO_OCIOSA_MS = 30 * 60 * 1000;

export type Attribution = Partial<Record<(typeof PARAMETROS_CAMPANHA)[number], string>> & {
  landing?: string;
  referrer?: string;
  ts?: number;
};

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: Fbq;
    __jvFbq?: unknown[][];
  }
}

function safeStorage(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Guarda a origem da visita. Uma visita com parâmetros de campanha sobrescreve a anterior (último clique). */
export function captureAttribution(): Attribution {
  const store = safeStorage("local");
  const url = new URL(window.location.href);
  const fromUrl: Attribution = {};
  for (const key of PARAMETROS_CAMPANHA) {
    const value = url.searchParams.get(key);
    if (value) fromUrl[key] = value.slice(0, 200);
  }

  const hasCampaign = Object.keys(fromUrl).length > 0;
  if (hasCampaign) {
    const attr: Attribution = {
      ...fromUrl,
      landing: url.pathname + url.search,
      referrer: document.referrer || undefined,
      ts: Date.now(),
    };
    store?.setItem(ATTR_KEY, JSON.stringify(attr));
    return attr;
  }
  return getAttribution();
}

export function getAttribution(): Attribution {
  const raw = safeStorage("local")?.getItem(ATTR_KEY);
  if (!raw) return {};
  try {
    const attr = JSON.parse(raw) as Attribution;
    if (attr.ts && Date.now() - attr.ts > ATTR_TTL_MS) return {};
    return attr;
  } catch {
    return {};
  }
}

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
let memoryCode: string | null = null;

/** Código curto por visitante (ex.: JV-7K2Q). Vai na mensagem do WhatsApp e nos eventos. */
export function getCodigo(): string {
  const store = safeStorage("local");
  const saved = store?.getItem(CODE_KEY) ?? memoryCode;
  if (saved) return saved;
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const code = "JV-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  memoryCode = code;
  store?.setItem(CODE_KEY, code);
  return code;
}

function novoId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type Sessao = { id: string; ultimo: number; novo: boolean };
let memorySessao: Sessao | null = null;

/** Sessão = visita. 30 minutos sem atividade abre outra. `novo`: primeira visita deste aparelho. */
function getSessao(): Sessao {
  const store = safeStorage("session");
  const local = safeStorage("local");
  let sessao: Sessao | null = memorySessao;
  try {
    const raw = store?.getItem(SESSAO_KEY);
    if (raw) sessao = JSON.parse(raw) as Sessao;
  } catch {
    sessao = null;
  }
  const agora = Date.now();
  if (!sessao || agora - sessao.ultimo > SESSAO_OCIOSA_MS) {
    const primeira = local?.getItem(PRIMEIRA_KEY);
    if (!primeira) local?.setItem(PRIMEIRA_KEY, String(agora));
    sessao = { id: novoId(), ultimo: agora, novo: !primeira };
  }
  sessao.ultimo = agora;
  memorySessao = sessao;
  store?.setItem(SESSAO_KEY, JSON.stringify(sessao));
  return sessao;
}

export function aparelhoInterno(): boolean {
  return safeStorage("local")?.getItem(INTERNO_KEY) === "1";
}

/** Referência externa da página atual (busca, Instagram, WhatsApp…); vazia para navegação interna. */
function referenciaExterna(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    const ref = new URL(document.referrer);
    return ref.host === window.location.host ? undefined : ref.host.slice(0, 200);
  } catch {
    return undefined;
  }
}

export function track(event: EventName, props: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined" || aparelhoInterno()) return;
  const eventId = novoId();
  const attribution = getAttribution();
  const sessao = getSessao();
  const payload = {
    event,
    eventId,
    props,
    attribution,
    codigo: getCodigo(),
    sessao: sessao.id,
    novo: sessao.novo,
    ref: event === "page_view" ? referenciaExterna() : undefined,
    url: window.location.href,
    ts: Date.now(),
  };

  (window.dataLayer ??= []).push({ event, event_id: eventId, ...props, ...attribution });

  // Só os eventos combinados vão para a Meta. Se o Pixel ainda não carregou, a chamada fica na
  // fila e ele a reproduz ao iniciar (ver MetaPixel).
  const meta = EVENTO_META[event];
  if (meta) {
    const args = meta.padrao ? ["track", meta.nome, props, { eventID: eventId }] : ["trackCustom", meta.nome, props, { eventID: eventId }];
    if (typeof window.fbq === "function") window.fbq(...args);
    else (window.__jvFbq ??= []).push(args);
  }

  try {
    const body = JSON.stringify(payload);
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
    }
  } catch {
    // Rastreamento nunca pode quebrar a página.
  }
}
