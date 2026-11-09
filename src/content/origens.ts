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
  georreferenciamento: "Olá! Tenho um imóvel rural e preciso do georreferenciamento.",
  // Página /georreferenciamento: origens próprias para o painel separar os leads rurais.
  "georref-topo": "Olá! Quero saber a situação da minha propriedade rural.",
  "georref-checklist": "Olá! Fiz o autodiagnóstico da minha propriedade rural e quero entender.",
  "georref-venda": "Olá! Vou vender ou transferir uma propriedade rural.",
  "georref-heranca": "Olá! Tenho uma propriedade rural de herança para partilhar ou desmembrar.",
  "georref-divergencia": "Olá! A área ou as divisas da minha propriedade rural não batem com a matrícula.",
  "georref-credito": "Olá! O banco pediu a documentação da minha propriedade rural para crédito.",
  "georref-como-funciona": "Olá! Quero começar o diagnóstico da minha propriedade rural.",
  "georref-faq": "Olá! Tenho uma dúvida sobre a minha propriedade rural.",
  "georref-rodape": "Olá! Quero falar com a equipe sobre uma propriedade rural.",
  "georref-barra-fixa": "Olá! Quero saber a situação da minha propriedade rural.",
  "georref-cabecalho": "Olá! Quero saber a situação da minha propriedade rural.",
  "como-funciona": "Olá! Quero começar o diagnóstico do meu imóvel.",
  faq: "Olá! Tenho uma dúvida sobre a regularização do meu imóvel.",
  "barra-fixa": "Olá! Quero saber a situação do meu imóvel.",
  cabecalho: "Olá! Quero saber a situação do meu imóvel.",
} as const;

export type Origem = keyof typeof origens;
