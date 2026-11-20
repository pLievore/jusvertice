/**
 * Catálogo dos eventos que o site registra. Compartilhado pelo navegador (tracking.ts),
 * pelo coletor (/api/events) e pelo painel (rótulos).
 *
 * Funil do plano: chegada (page_view) → leitura (checklist_lido, scroll_*, secao_vista)
 * → conversa (whatsapp_click) → atendimento/fechamento (marcados no painel, tabela leads).
 */

export const EVENTOS = [
  "page_view",
  "scroll_50",
  "scroll_90",
  "checklist_lido",
  "whatsapp_click",
  "faq_aberta",
  "secao_vista",
  "checklist_marcado",
  "comparador_usado",
  "autodiagnostico_click",
  "navegacao_click",
  "contato_click",
  "engajamento",
] as const;

export type EventName = (typeof EVENTOS)[number];

/** Só estes vão para a Meta (Pixel e API de Conversões); o resto fica no painel. */
export const EVENTO_META: Partial<Record<EventName, { nome: string; padrao: boolean }>> = {
  page_view: { nome: "PageView", padrao: true },
  whatsapp_click: { nome: "Contact", padrao: true },
  checklist_lido: { nome: "LeuChecklist", padrao: false },
  scroll_50: { nome: "Rolagem50", padrao: false },
  scroll_90: { nome: "Rolagem90", padrao: false },
  faq_aberta: { nome: "AbriuPergunta", padrao: false },
};

/** Marcos de tempo de atenção (segundos com a página visível). */
export const MARCOS_ENGAJAMENTO = [15, 30, 60, 120, 300] as const;

/** Seções que registram "secao_vista", na ordem da página. */
export const SECOES = [
  { id: "servicos", nome: "Serviços" },
  { id: "checklist", nome: "Autodiagnóstico" },
  { id: "comparador", nome: "Comparador e o que muda" },
  { id: "situacoes", nome: "Situações" },
  { id: "equipe", nome: "Equipe" },
  { id: "como-funciona", nome: "Como funciona" },
  { id: "duvidas", nome: "Dúvidas" },
  { id: "cta-final", nome: "Chamada final" },
] as const;

/** Parâmetros de campanha guardados por 30 dias (último clique com parâmetro). */
export const PARAMETROS_CAMPANHA = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "jv_ad",
  "jv_adset",
  "fbclid",
  "gclid",
] as const;
