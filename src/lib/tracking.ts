"use client";

/**
 * Camada de eventos do funil (plano › "Medição e painel").
 *
 * 1. Chegada à página, com origem  → page_view (+ UTMs/fbclid guardados)
 * 2. Leu a página                   → checklist_lido, scroll_50, scroll_90
 * 3. Iniciou conversa               → whatsapp_click { origem, codigo }
 * 4. Virou atendimento              → marcação manual da Gabriella, pelo código
 *
 * Cada evento vai para: window.dataLayer, Meta Pixel (se carregado) e /api/events
 * (que repassa à API de Conversões quando as variáveis de ambiente existirem).
 * O mesmo event_id é usado no Pixel e na CAPI para deduplicar.
 */

export type EventName = "page_view" | "scroll_50" | "scroll_90" | "checklist_lido" | "whatsapp_click" | "faq_aberta";

const ATTR_KEY = "jv_attr";
const CODE_KEY = "jv_codigo";
const ATTR_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number], string>> & {
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
  for (const key of PARAMS) {
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

function newEventId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const META_STANDARD: Partial<Record<EventName, string>> = {
  page_view: "PageView",
  whatsapp_click: "Contact",
};

export function track(event: EventName, props: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined") return;
  const eventId = newEventId();
  const attribution = getAttribution();
  const payload = {
    event,
    eventId,
    props,
    attribution,
    codigo: getCodigo(),
    url: window.location.href,
    ts: Date.now(),
  };

  (window.dataLayer ??= []).push({ event, event_id: eventId, ...props, ...attribution });

  // Se o Pixel ainda não carregou, a chamada fica na fila e ele a reproduz ao iniciar (ver MetaPixel).
  const standard = META_STANDARD[event];
  const args = standard ? ["track", standard, props, { eventID: eventId }] : ["trackCustom", event, props, { eventID: eventId }];
  if (typeof window.fbq === "function") window.fbq(...args);
  else (window.__jvFbq ??= []).push(args);

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
