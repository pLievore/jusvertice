import type { StaticImageData } from "next/image";
import type { Origem } from "./origens";

/**
 * Forma do conteúdo de uma landing. As seções recebem uma `Pagina` e não sabem de qual
 * página são: a de regularização (/) e a de georreferenciamento (/georreferenciamento)
 * usam os mesmos componentes com textos, imagens e origens de WhatsApp diferentes.
 */

/** Origem de cada botão de WhatsApp da página: é o que o painel usa para saber de onde veio o lead. */
export interface OrigensPagina {
  topo: Origem;
  checklist: Origem;
  comoFunciona: Origem;
  faq: Origem;
  rodape: Origem;
  barraFixa: Origem;
  cabecalho: Origem;
}

export interface ConteudoHero {
  eyebrow: string;
  titulo: string;
  subtitulo: string;
  cta: string;
  ctaSecundario: string;
  /** Texto do botão da barra fixa do celular (curto). */
  ctaBarra: string;
  posterAlt: string;
}

export interface ConteudoChecklist {
  eyebrow: string;
  titulo: string;
  intro: string;
  itens: { id: string; texto: string }[];
  fecho: string;
  cta: string;
}

export interface Apontamento {
  titulo: string;
  detalhe: string;
  ponto: { x: number; y: number };
  rotulo: { x: number; y: number };
}

export interface ConteudoComparador {
  eyebrow: string;
  titulo: string;
  intro: string;
  imagem: StaticImageData;
  planta: StaticImageData;
  alt: string;
  altPlanta: string;
  antes: { rotulo: string };
  depois: { rotulo: string };
  problemas: Apontamento[];
}

export interface ConteudoCusto {
  /** Usados como título da seção quando a página não tem comparador. */
  eyebrow?: string;
  titulo?: string;
  colunas: readonly [string, string];
  linhas: readonly (readonly [string, string])[];
  frase: string;
}

export interface ConteudoDiferencial {
  eyebrow: string;
  titulo: string;
  paragrafos: string[];
  pessoas: { nome: string; papel: string }[];
  fotoAlt: string;
}

export interface ConteudoSituacoes {
  eyebrow: string;
  titulo: string;
  itens: { origem: Origem; titulo: string; texto: string; imagem: StaticImageData; alt: string }[];
  cta: string;
}

export interface ConteudoComoFunciona {
  eyebrow: string;
  titulo: string;
  passos: { titulo: string; texto: string }[];
  cta: string;
}

export interface ConteudoCapacidades {
  eyebrow: string;
  titulo: string;
  citacao: string;
  itens: { titulo: string; texto: string; imagem: StaticImageData; alt: string }[];
}

export interface ItemFaq {
  pergunta: string;
  resposta: string;
}

export interface ConteudoFaq {
  eyebrow: string;
  titulo: string;
  itens: ItemFaq[];
  cta: string;
}

export interface ConteudoCtaFinal {
  eyebrow: string;
  titulo: string;
  cta: string;
  alt: string;
  /** Fundo da seção; sem ele, usa a imagem padrão (casa à noite). */
  imagem?: StaticImageData;
}

export interface Pagina {
  origens: OrigensPagina;
  hero: ConteudoHero;
  checklist: ConteudoChecklist;
  /** Opcional: sem ele, a seção mostra só o "o que muda" (tabela e frase). */
  comparador?: ConteudoComparador;
  custo: ConteudoCusto;
  diferencial: ConteudoDiferencial;
  situacoes: ConteudoSituacoes;
  comoFunciona: ConteudoComoFunciona;
  capacidades: ConteudoCapacidades;
  faq: ConteudoFaq;
  ctaFinal: ConteudoCtaFinal;
}
