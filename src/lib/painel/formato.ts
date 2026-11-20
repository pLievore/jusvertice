/**
 * Formatação em português e rótulos legíveis para as chaves gravadas nos eventos.
 * Usado no servidor e no navegador.
 */

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const reaisInteiros = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const SEM_DADO = "—";

const ok = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

export function num(v: number | null | undefined) {
  return ok(v) ? inteiro.format(v) : SEM_DADO;
}

/** 1.284 / 12,9 mil / 1,2 mi: para números grandes em destaque. */
export function numCompacto(v: number | null | undefined) {
  if (!ok(v)) return SEM_DADO;
  return Math.abs(v) < 10_000 ? inteiro.format(v) : compacto.format(v);
}

export function moeda(v: number | null | undefined, centavos = true) {
  if (!ok(v)) return SEM_DADO;
  if (!centavos || Math.abs(v) >= 10_000) return reaisInteiros.format(v);
  return reais.format(v);
}

export function pct(v: number | null | undefined, casas = 1) {
  if (!ok(v)) return SEM_DADO;
  return `${(v * 100).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

export function multiplo(v: number | null | undefined) {
  return ok(v) ? `${decimal.format(v)}×` : SEM_DADO;
}

export function dividir(a: number | null | undefined, b: number | null | undefined) {
  return ok(a) && ok(b) && b !== 0 ? a / b : null;
}

/** Variação relativa entre o período atual e o anterior (null quando não dá para comparar). */
export function variacao(atual: number | null | undefined, anterior: number | null | undefined) {
  if (!ok(atual) || !ok(anterior) || anterior === 0) return null;
  return (atual - anterior) / anterior;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const DIAS_SEMANA_LONGOS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** "2026-11-20" → "20 nov". */
export function diaCurto(dia: string) {
  const [, m, d] = dia.split("-");
  return `${Number(d)} ${MESES[Number(m) - 1]}`;
}

export function diaComSemana(dia: string) {
  const data = new Date(`${dia}T12:00:00Z`);
  return `${DIAS_SEMANA[data.getUTCDay()]}, ${diaCurto(dia)}`;
}

export function periodoTexto(de: string, ate: string) {
  return de === ate ? diaCurto(de) : `${diaCurto(de)} – ${diaCurto(ate)}`;
}

/** Data e hora de São Paulo, a partir de um ISO. */
export function dataHora(iso: string | null | undefined) {
  if (!iso) return SEM_DADO;
  const d = new Date(Date.parse(iso) - 3 * 3_600_000);
  const dia = d.toISOString().slice(0, 10);
  return `${diaCurto(dia)}, ${d.toISOString().slice(11, 16)}`;
}

/** Botões de WhatsApp (origens) → nome legível. */
const ORIGENS: Record<string, string> = {
  topo: "Botão do topo",
  checklist: "Autodiagnóstico",
  venda: "Situação: venda travada",
  financiamento: "Situação: financiamento negado",
  heranca: "Situação: herança",
  gaveta: "Situação: compra sem escritura",
  georreferenciamento: "Situação: imóvel rural",
  "como-funciona": "Como funciona",
  faq: "Dúvidas",
  "barra-fixa": "Barra fixa (celular)",
  cabecalho: "Cabeçalho",
  rodape: "Chamada final e rodapé",
  "georref-topo": "Rural · botão do topo",
  "georref-checklist": "Rural · autodiagnóstico",
  "georref-venda": "Rural · venda ou transferência",
  "georref-heranca": "Rural · herança e partilha",
  "georref-divergencia": "Rural · área ou divisa",
  "georref-credito": "Rural · crédito rural",
  "georref-como-funciona": "Rural · como funciona",
  "georref-faq": "Rural · dúvidas",
  "georref-barra-fixa": "Rural · barra fixa",
  "georref-cabecalho": "Rural · cabeçalho",
  "georref-rodape": "Rural · chamada final",
  manual: "Cadastro manual",
};

export function nomeOrigem(origem: string | null | undefined) {
  if (!origem) return "Sem botão";
  return ORIGENS[origem] ?? origem;
}

export function nomePagina(pagina: string | null | undefined) {
  if (!pagina) return SEM_DADO;
  const nomes: Record<string, string> = {
    "/": "Regularização (original)",
    "/v2": "Regularização · versão 2",
    "/v3": "Regularização · versão 3",
    "/georreferenciamento": "Imóvel rural (original)",
    "/georreferenciamento/v2": "Imóvel rural · versão 2",
    "/georreferenciamento/v3": "Imóvel rural · versão 3",
  };
  return nomes[pagina] ?? pagina;
}

export const STATUS_LEAD = [
  { id: "nova", nome: "Nova conversa" },
  { id: "atendimento", nome: "Em atendimento" },
  { id: "proposta", nome: "Proposta enviada" },
  { id: "fechou", nome: "Fechou" },
  { id: "perdeu", nome: "Não fechou" },
] as const;

export type StatusLead = (typeof STATUS_LEAD)[number]["id"];

export function nomeStatus(status: string) {
  return STATUS_LEAD.find((s) => s.id === status)?.nome ?? status;
}

export const NOMES_DISPOSITIVO: Record<string, string> = { celular: "Celular", computador: "Computador", tablet: "Tablet" };
