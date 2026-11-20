import { after } from "next/server";
import { aparelho, fonte, local, ROBO } from "@/lib/coleta";
import { obterBanco } from "@/lib/db";
import { EVENTO_META, EVENTOS } from "@/lib/eventos";

/**
 * Coletor de eventos da landing.
 * - Grava cada evento no banco do painel (tabela public.eventos) e, no primeiro clique no WhatsApp
 *   de um visitante, cria o lead (public.leads) com a atribuição daquele momento.
 * - Com META_PIXEL_ID + META_CAPI_TOKEN: repassa os eventos combinados (EVENTO_META) à API de
 *   Conversões da Meta, com o mesmo event_id do Pixel para deduplicação.
 * - Robôs, envios de outro domínio e aparelhos internos não entram.
 * A gravação roda depois da resposta (after): o beacon do navegador nunca espera o banco.
 */

const PERMITIDOS = new Set<string>(EVENTOS);

type Incoming = {
  event?: unknown;
  eventId?: unknown;
  props?: unknown;
  attribution?: unknown;
  codigo?: unknown;
  sessao?: unknown;
  novo?: unknown;
  ref?: unknown;
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

  // Só aceita envios do próprio site (o beacon manda Origin; ferramentas sem Origin passam).
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) return new Response(null, { status: 403 });
    } catch {
      return new Response(null, { status: 403 });
    }
  }

  let body: Incoming;
  try {
    body = (await request.json()) as Incoming;
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = str(body.event, 40);
  const eventId = str(body.eventId, 80);
  if (!event || !PERMITIDOS.has(event) || !eventId) return new Response(null, { status: 400 });

  const userAgent = str(request.headers.get("user-agent"), 400) ?? "";
  if (ROBO.test(userAgent)) return new Response(null, { status: 204 });

  const tsCliente = typeof body.ts === "number" ? body.ts : Date.now();
  // Relógio do celular pode estar errado: aceita até 1 dia de diferença, senão usa a hora do servidor.
  const ts = Math.abs(tsCliente - Date.now()) < 86_400_000 ? tsCliente : Date.now();

  const record = {
    event,
    eventId,
    props: flatRecord(body.props),
    attribution: flatRecord(body.attribution),
    codigo: str(body.codigo, 16),
    sessao: str(body.sessao, 80),
    novo: typeof body.novo === "boolean" ? body.novo : undefined,
    ref: str(body.ref, 200),
    url: str(body.url, 500),
    ts,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent,
    fbp: readCookie(request.headers.get("cookie"), "_fbp"),
    fbc: readCookie(request.headers.get("cookie"), "_fbc"),
    ...aparelho(userAgent),
    ...local(request.headers),
  };

  if (process.env.NODE_ENV === "development") {
    console.info("[evento]", record.event, record.props, record.codigo);
  }

  after(() => gravar(record));

  const pixelId = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (pixelId && token && EVENTO_META[record.event as keyof typeof EVENTO_META]) {
    after(() => sendToMeta(pixelId, token, record));
  }

  return new Response(null, { status: 204 });
}

type Registro = {
  event: string;
  eventId: string;
  props: Record<string, string | number | boolean>;
  attribution: Record<string, string | number | boolean>;
  codigo?: string;
  sessao?: string;
  novo?: boolean;
  ref?: string;
  url?: string;
  ts: number;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  dispositivo: string;
  navegador: string;
  sistema: string;
  cidade?: string;
  estado?: string;
  pais?: string;
};

const texto = (v: unknown, max = 200) => (typeof v === "string" && v ? v.slice(0, max) : null);

async function gravar(r: Registro) {
  let banco;
  try {
    banco = await obterBanco();
  } catch (erro) {
    console.error("[coletor] banco indisponível", erro);
    return;
  }
  if (!banco) return;

  const a = r.attribution;
  let pagina: string | null = null;
  try {
    pagina = r.url ? new URL(r.url).pathname.slice(0, 120) : null;
  } catch {
    pagina = null;
  }
  // A referência da sessão vale para a fonte; a da campanha guardada (30 dias) também.
  const referencia = r.ref ?? texto(a.referrer) ?? undefined;
  const fonteTrafego = fonte(
    { utm_source: texto(a.utm_source) ?? undefined, fbclid: texto(a.fbclid) ?? undefined, gclid: texto(a.gclid) ?? undefined },
    referencia,
  );
  const origem = typeof r.props.origem === "string" ? r.props.origem.slice(0, 60) : null;

  try {
    await banco.query(
      `insert into public.eventos (event_id, nome, ts, visitante, sessao, pagina, origem, props,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, ad_id, adset_id, fbclid, gclid,
        referrer, landing, dispositivo, navegador, sistema, cidade, estado, pais, novo, fonte)
       values ($1, $2, to_timestamp($3 / 1000.0), $4, $5, $6, $7, $8::jsonb,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
       on conflict (event_id) do nothing`,
      [
        r.eventId,
        r.event,
        r.ts,
        r.codigo ?? null,
        r.sessao ?? null,
        pagina,
        origem,
        JSON.stringify(r.props),
        texto(a.utm_source),
        texto(a.utm_medium),
        texto(a.utm_campaign),
        texto(a.utm_content),
        texto(a.utm_term),
        texto(a.utm_id),
        texto(a.jv_ad),
        texto(a.jv_adset),
        texto(a.fbclid, 300),
        texto(a.gclid, 300),
        referencia ?? null,
        texto(a.landing, 300),
        r.dispositivo,
        r.navegador,
        r.sistema,
        r.cidade ?? null,
        r.estado ?? null,
        r.pais ?? null,
        r.novo ?? null,
        fonteTrafego,
      ],
    );

    // Primeiro clique no WhatsApp = lead novo, com a atribuição daquele momento. Os seguintes só
    // atualizam o último contato.
    if (r.event === "whatsapp_click" && r.codigo) {
      await banco.query(
        `insert into public.leads (codigo, criado_em, ultimo_contato, origem, pagina, fonte,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, ad_id, adset_id,
          dispositivo, cidade, estado)
         values ($1, to_timestamp($2 / 1000.0), to_timestamp($2 / 1000.0), $3, $4, $5,
          $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         on conflict (codigo) do update set ultimo_contato = excluded.ultimo_contato`,
        [
          r.codigo,
          r.ts,
          origem,
          pagina,
          fonteTrafego,
          texto(a.utm_source),
          texto(a.utm_medium),
          texto(a.utm_campaign),
          texto(a.utm_content),
          texto(a.utm_term),
          texto(a.utm_id),
          texto(a.jv_ad),
          texto(a.jv_adset),
          r.dispositivo,
          r.cidade ?? null,
          r.estado ?? null,
        ],
      );
    }
  } catch (erro) {
    console.error("[coletor] falha ao gravar", erro);
  }
}

async function sendToMeta(pixelId: string, token: string, record: Registro) {
  const version = process.env.META_GRAPH_VERSION ?? "v24.0";
  const fbclid = typeof record.attribution.fbclid === "string" ? record.attribution.fbclid : undefined;
  const fbc = record.fbc ?? (fbclid ? `fb.1.${record.ts}.${fbclid}` : undefined);
  const meta = EVENTO_META[record.event as keyof typeof EVENTO_META];

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: meta?.nome ?? record.event,
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
