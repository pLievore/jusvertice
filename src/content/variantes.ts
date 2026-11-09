/**
 * Versões alternativas do hero, para testar no tráfego qual frase converte mais.
 *
 * Só o hero muda; o resto da página é o mesmo. Cada versão tem rota própria (/v2, /v3,
 * /georreferenciamento/v2, /georreferenciamento/v3), então os eventos do funil já chegam
 * separados pela URL. As rotas ficam fora do Google (noindex, canonical na original).
 */
import { paginaGeorreferenciamento } from "./georreferenciamento";
import { paginaRegularizacao } from "./site";
import type { ConteudoHero, Pagina } from "./tipos";

function comHero(base: Pagina, hero: Partial<ConteudoHero>): Pagina {
  return { ...base, hero: { ...base.hero, ...hero } };
}

export const variantesRegularizacao = {
  v2: comHero(paginaRegularizacao, {
    titulo: "Antes de vender, confira a matrícula.",
    subtitulo:
      "Ampliação sem averbar, área que não confere, compra só no contrato: o problema aparece na hora de vender, financiar ou passar para os filhos. Nós resolvemos a parte técnica e a documental, até o registro.",
  }),
  v3: comHero(paginaRegularizacao, {
    titulo: "O seu imóvel é seu no papel?",
    subtitulo:
      "Para a lei, dono é quem está na matrícula. Se a casa cresceu, se a compra foi só no contrato ou se há herança pendente, nós regularizamos, com engenharia e consultoria jurídica até o registro.",
  }),
};

export const variantesRural = {
  v2: comHero(paginaGeorreferenciamento, {
    titulo: "A terra é sua. A matrícula confirma?",
    subtitulo:
      "Quando a área ou as divisas não batem com o cartório, a venda, a partilha e o crédito rural param. Nós medimos no campo, acertamos a documentação e registramos.",
  }),
  v3: comHero(paginaGeorreferenciamento, {
    titulo: "Deixe a terra pronta para a próxima geração.",
    subtitulo:
      "Partilha, desmembramento ou venda: tudo anda mais rápido quando a matrícula descreve a terra como ela é. Engenharia, agrimensura e consultoria jurídica trabalhando juntas até o registro.",
  }),
};

/** Metadados comuns às versões: fora do índice e com canonical apontando para a página original. */
export function metadadosVariante(canonical: string) {
  return { alternates: { canonical }, robots: { index: false, follow: true } };
}
