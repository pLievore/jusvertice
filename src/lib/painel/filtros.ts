/**
 * Filtros do painel, guardados na URL (?periodo=30d&pagina=rural…): qualquer visão vira um link.
 * Datas no dia de São Paulo (UTC−3, sem horário de verão desde 2019).
 */

export const PERIODOS = [
  { id: "7d", nome: "7 dias", dias: 7 },
  { id: "30d", nome: "30 dias", dias: 30 },
  { id: "90d", nome: "90 dias", dias: 90 },
  { id: "mes", nome: "Este mês", dias: 0 },
] as const;

export type PeriodoId = (typeof PERIODOS)[number]["id"] | "personalizado";

export const PAGINAS = [
  { id: "todas", nome: "Todas as páginas" },
  { id: "urbana", nome: "Regularização (urbana)" },
  { id: "rural", nome: "Imóvel rural" },
] as const;

export type PaginaId = (typeof PAGINAS)[number]["id"];

export type Filtros = {
  periodo: PeriodoId;
  de: string;
  ate: string;
  dias: number;
  anteriorDe: string;
  anteriorAte: string;
  pagina: PaginaId;
  fonte: string | null;
  campanha: string | null;
  dispositivo: string | null;
  origem: string | null;
};

/** Chaves que um clique num gráfico pode filtrar (filtro cruzado). */
export type ChaveFiltro = "fonte" | "campanha" | "dispositivo" | "origem" | "pagina";

const DIA_MS = 86_400_000;
const FUSO_MS = 3 * 60 * 60 * 1000;

export function hojeSP(agora = Date.now()) {
  return new Date(agora - FUSO_MS).toISOString().slice(0, 10);
}

export function somarDias(dia: string, n: number) {
  return new Date(Date.parse(`${dia}T00:00:00Z`) + n * DIA_MS).toISOString().slice(0, 10);
}

export function diasEntre(de: string, ate: string) {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / DIA_MS) + 1;
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const curto = (v: string | undefined, max = 120) => (v && v.trim() ? v.trim().slice(0, max) : null);

export function lerFiltros(sp: Record<string, string | string[] | undefined>, agora = Date.now()): Filtros {
  const hoje = hojeSP(agora);
  const pedido = um(sp.periodo);
  let periodo: PeriodoId = PERIODOS.some((p) => p.id === pedido) || pedido === "personalizado" ? (pedido as PeriodoId) : "30d";
  let de: string;
  let ate = hoje;

  if (periodo === "personalizado") {
    const d = um(sp.de);
    const a = um(sp.ate);
    if (d && a && DATA.test(d) && DATA.test(a) && d <= a && diasEntre(d, a) <= 400) {
      de = d;
      ate = a > hoje ? hoje : a;
    } else {
      periodo = "30d";
      de = somarDias(hoje, -29);
    }
  } else if (periodo === "mes") {
    de = `${hoje.slice(0, 8)}01`;
  } else {
    const dias = PERIODOS.find((p) => p.id === periodo)!.dias;
    de = somarDias(hoje, -(dias - 1));
  }

  const dias = diasEntre(de, ate);
  const pagina = PAGINAS.some((p) => p.id === um(sp.pagina)) ? (um(sp.pagina) as PaginaId) : "todas";

  return {
    periodo,
    de,
    ate,
    dias,
    anteriorDe: somarDias(de, -dias),
    anteriorAte: somarDias(de, -1),
    pagina,
    fonte: curto(um(sp.fonte), 60),
    campanha: curto(um(sp.campanha)),
    dispositivo: curto(um(sp.dispositivo), 20),
    origem: curto(um(sp.origem), 60),
  };
}

/** Monta a query string a partir dos filtros atuais com alterações (null remove a chave). */
export function comFiltros(atual: URLSearchParams | string, mudancas: Record<string, string | null>) {
  const q = new URLSearchParams(typeof atual === "string" ? atual : atual.toString());
  for (const [k, v] of Object.entries(mudancas)) {
    if (v === null || v === "") q.delete(k);
    else q.set(k, v);
  }
  if (q.get("periodo") !== "personalizado") {
    q.delete("de");
    q.delete("ate");
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Quantos filtros de dimensão estão ativos (o período não conta). */
export function filtrosAtivos(f: Filtros) {
  return [f.pagina !== "todas", f.fonte, f.campanha, f.dispositivo, f.origem].filter(Boolean).length;
}
