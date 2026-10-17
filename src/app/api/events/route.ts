import { after } from "next/server";

/**
 * Coletor de eventos da landing.
 * - Sem variáveis de ambiente: valida e descarta (em dev, loga no terminal).
 * - Com META_PIXEL_ID + META_CAPI_TOKEN: repassa à API de Conversões da Meta, com o mesmo
 *   event_id do Pixel para deduplicação.
 *
 * O painel do funil (fase 2) vai ler destes mesmos eventos — o ponto de gravação entra aqui.
 */

const ALLOWED = new Set(["page_view", "scroll_50", "scroll_90", "checklist_lido", "whatsapp_click", "faq_aberta"]);

const META_EVENT: Record<string, string> = {
  page_view: "PageView",
  whatsapp_click: "Contact",
  scroll_50: "Rolagem50",
  scroll_90: "Rolagem90",
  checklist_lido: "LeuChecklist",
  faq_aberta: "AbriuPergunta",
};

type Incoming = {
  event?: unknown;
  eventId?: unknown;
  props?: unknown;
  attribution?: unknown;
  codigo?: unknown;
  url?: unknown;
  ts?: unknown;
};

function str(value: unknown, max = 300): string | undefined {
  return typeof value === "string" && value.length > 0 ? value.slice(0, max) : undefined;
}

function flatRecord(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(value).slice(0, 20)) {
    if (typeof v === "string") out[k.slice(0, 40)] = v.slice(0, 300);
    else if (typeof v === "number" || typeof v === "boolean") out[k.slice(0, 40)] = v;
  }
  return out;
}

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 8_000) return new Response(null, { status: 413 });

  let body: Incoming;
  try {
    body = (await request.json()) as Incoming;
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = str(body.event, 40);
  const eventId = str(body.eventId, 80);
  if (!event || !ALLOWED.has(event) || !eventId) return new Response(null, { status: 400 });

  const record = {
    event,
    eventId,
    props: flatRecord(body.props),
    attribution: flatRecord(body.attribution),
    codigo: str(body.codigo, 16),
    url: str(body.url, 500),
    ts: typeof body.ts === "number" ? body.ts : Date.now(),
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: str(request.headers.get("user-agent"), 400),
    fbp: readCookie(request.headers.get("cookie"), "_fbp"),
    fbc: readCookie(request.headers.get("cookie"), "_fbc"),
  };

  if (process.env.NODE_ENV === "development") {
    console.info("[evento]", record.event, record.props, record.codigo);
  }

  const pixelId = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (pixelId && token) {
    after(() => sendToMeta(pixelId, token, record));
  }

  return new Response(null, { status: 204 });
}

async function sendToMeta(
  pixelId: string,
  token: string,
  record: {
    event: string;
    eventId: string;
    props: Record<string, string | number | boolean>;
    attribution: Record<string, string | number | boolean>;
    codigo?: string;
    url?: string;
    ts: number;
    ip?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
  },
) {
  const version = process.env.META_GRAPH_VERSION ?? "v24.0";
  const fbclid = typeof record.attribution.fbclid === "string" ? record.attribution.fbclid : undefined;
  const fbc = record.fbc ?? (fbclid ? `fb.1.${record.ts}.${fbclid}` : undefined);

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: META_EVENT[record.event] ?? record.event,
        event_time: Math.floor(record.ts / 1000),
        event_id: record.eventId,
        action_source: "website",
        event_source_url: record.url,
        user_data: {
          client_ip_address: record.ip,
          client_user_agent: record.userAgent,
          fbp: record.fbp,
          fbc,
        },
        custom_data: { ...record.props, codigo: record.codigo },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error("[capi] falhou", res.status, await res.text());
  } catch (error) {
    console.error("[capi] erro", error);
  }
}
