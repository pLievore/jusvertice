// Mensagens do WhatsApp por origem do botão. Módulo sem imagens: os testes importam daqui.

/**
 * Origem de cada botão → mensagem pré-preenchida no WhatsApp.
 * As cinco primeiras vêm da tabela do plano.
 */
export const origens = {
  topo: "Olá! Quero saber a situação do meu imóvel.",
  checklist: "Olá! Identifiquei alguns sinais no meu imóvel e quero entender.",
  venda: "Olá! Estou vendendo um imóvel e apareceu uma pendência.",
  heranca: "Olá! Tenho um imóvel de herança sem documentação.",
  rodape: "Olá! Quero falar com a equipe.",
  financiamento: "Olá! Meu financiamento foi negado por causa da documentação do imóvel.",
  gaveta: "Olá! Comprei um imóvel só com contrato e nunca registrei.",
  "como-funciona": "Olá! Quero começar o diagnóstico do meu imóvel.",
  faq: "Olá! Tenho uma dúvida sobre a regularização do meu imóvel.",
  "barra-fixa": "Olá! Quero saber a situação do meu imóvel.",
  cabecalho: "Olá! Quero saber a situação do meu imóvel.",
} as const;

export type Origem = keyof typeof origens;
