/**
 * Banco do painel.
 *
 * - DATABASE_URL (ou POSTGRES_URL) definida: Neon Postgres, pelo driver HTTP (serverless).
 * - Sem URL, rodando na Vercel: sem banco. O coletor só valida e o painel mostra a tela de configuração.
 * - Sem URL, na máquina local: Postgres em WASM (PGlite) gravado em .data/pglite, para desenvolver e
 *   testar com o mesmo SQL. Fica fora do pacote da Vercel (import ignorado pelo bundler).
 *
 * Dois esquemas com as mesmas tabelas: `public` (dados reais) e `demo` (dados de demonstração gerados
 * pelo painel). As consultas recebem o esquema; dado real e de demonstração nunca se misturam.
 */

type Linha = Record<string, unknown>;

export type Banco = {
  tipo: "neon" | "local";
  query<T = Linha>(texto: string, params?: unknown[]): Promise<T[]>;
};

export type Esquema = "public" | "demo";

// Uma conexão por processo, no escopo global: rotas de API e páginas podem carregar este módulo em
// camadas diferentes, e o PGlite não pode abrir a mesma pasta duas vezes.
const global_ = globalThis as typeof globalThis & { __jvBanco?: Promise<Banco | null> };

export function obterBanco(): Promise<Banco | null> {
  global_.__jvBanco ??= conectar().catch((erro) => {
    global_.__jvBanco = undefined; // tenta de novo na próxima requisição
    throw erro;
  });
  return global_.__jvBanco;
}

async function conectar(): Promise<Banco | null> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  let banco: Banco;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    banco = { tipo: "neon", query: async (texto, params = []) => (await sql.query(texto, params)) as never };
  } else if (process.env.VERCEL) {
    return null;
  } else {
    const modulo = "@electric-sql/pglite";
    const { PGlite } = (await import(/* webpackIgnore: true */ modulo)) as typeof import("@electric-sql/pglite");
    const { mkdirSync } = await import("node:fs");
    const pasta = `${process.cwd()}/.data/pglite`;
    mkdirSync(pasta, { recursive: true });
    const db = new PGlite(pasta);
    banco = { tipo: "local", query: async (texto, params = []) => (await db.query(texto, params)).rows as never };
  }
  for (const esquema of ["public", "demo"] as const) {
    for (const comando of esquemaSql(esquema)) await banco.query(comando);
  }
  return banco;
}

/** Tabelas do painel. `if not exists` em tudo: roda a cada partida a frio sem custo. */
function esquemaSql(e: Esquema) {
  return [
    `create schema if not exists ${e}`,
    `create table if not exists ${e}.eventos (
      id bigserial primary key,
      event_id text unique,
      nome text not null,
      ts timestamptz not null,
      visitante text,
      sessao text,
      pagina text,
      origem text,
      props jsonb not null default '{}',
      utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text, utm_id text,
      ad_id text, adset_id text, fbclid text, gclid text,
      referrer text, landing text,
      dispositivo text, navegador text, sistema text,
      cidade text, estado text, pais text,
      novo boolean,
      fonte text
    )`,
    `create index if not exists eventos_ts on ${e}.eventos (ts)`,
    `create index if not exists eventos_nome_ts on ${e}.eventos (nome, ts)`,
    `create index if not exists eventos_visitante on ${e}.eventos (visitante)`,
    `create table if not exists ${e}.leads (
      codigo text primary key,
      criado_em timestamptz not null default now(),
      atualizado_em timestamptz not null default now(),
      ultimo_contato timestamptz,
      status text not null default 'nova',
      valor numeric(12,2),
      servico text,
      nome text,
      notas text,
      manual boolean not null default false,
      origem text, pagina text, fonte text,
      utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text, utm_id text,
      ad_id text, adset_id text,
      dispositivo text, cidade text, estado text
    )`,
    `create index if not exists leads_criado on ${e}.leads (criado_em)`,
    `create table if not exists ${e}.anuncios_diario (
      dia date not null,
      ad_id text not null,
      ad_nome text, adset_id text, adset_nome text, campanha_id text, campanha_nome text,
      gasto numeric(12,2) not null default 0,
      impressoes integer not null default 0,
      alcance integer not null default 0,
      cliques integer not null default 0,
      cliques_link integer not null default 0,
      primary key (dia, ad_id)
    )`,
    `create table if not exists ${e}.sincronizacao (
      fonte text primary key,
      executado_em timestamptz,
      ok boolean,
      mensagem text,
      linhas integer
    )`,
  ];
}
