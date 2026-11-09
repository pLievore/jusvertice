/**
 * Todo o texto e os dados da página ficam aqui.
 * Aprovação de copy pela cliente = mudanças só neste arquivo.
 *
 * Itens marcados com PENDENTE bloqueiam a publicação (ver jusvertice-plano-site.md › "O que falta da cliente").
 */

import heroMidia from "./hero-midia.json";
import imgAntesDepois from "@/assets/midia/antes-depois.jpg";
import imgAntesDepoisPlanta from "@/assets/midia/antes-depois-planta.jpg";
import imgCapGeo from "@/assets/midia/capacidade-georreferenciamento.jpg";
import imgCapProjetos from "@/assets/midia/capacidade-projetos.jpg";
import imgCapTopo from "@/assets/midia/capacidade-topografia.jpg";
import imgCtaFinal from "@/assets/midia/cta-final.jpg";
import imgHeroPoster from "@/assets/midia/hero-poster.jpg";
import imgHeroPosterFinal from "@/assets/midia/hero-poster-final.jpg";
import imgSitFinanciamento from "@/assets/midia/situacao-financiamento.jpg";
import imgSitGaveta from "@/assets/midia/situacao-gaveta.jpg";
import imgSitHeranca from "@/assets/midia/situacao-heranca.jpg";
import imgSitVenda from "@/assets/midia/situacao-venda.jpg";

export type DiagnosticoModo = "gratuito" | "neutro" | "cobrado";

export const empresa = {
  nome: "JusVértice",
  razaoSocial: "JusVértice Engenharia", // PENDENTE: confirmar razão social
  url: "https://jusvertice.com.br", // PENDENTE: domínio
  whatsapp: "5544900000000", // PENDENTE: número real (hoje a bio usa w.app/contato_jusvertice)
  instagram: "https://www.instagram.com/jusvertice/",
  instagramHandle: "@jusvertice",
  cidade: "Maringá",
  uf: "PR",
  regiao: "Maringá, Ponta Grossa e região",
  // Regiões atendidas (Gabi, 28/10): Maringá e região e Ponta Grossa e região.
  cidades: ["Maringá", "Ponta Grossa"],
  // CNPJ e OAB fora do site por enquanto (pedido da Gabi).
  crea: "CREA-PR 196465/D",
  rn: "RN 10337367914",
  // PENDENTE: o bloco de contato do rodapé só aparece quando estes campos forem preenchidos.
  email: "",
  telefones: [] as string[], // ex.: "(44) 99999-9999"
  geo: { lat: -23.4205, lng: -51.9333 },
} as const;

export const diagnostico = {
  // PENDENTE (decisão com a Gabriella): "gratuito" | "neutro" | "cobrado"
  modo: "gratuito" as DiagnosticoModo,
  precoCobrado: "R$ 150",
};

/** Linha curta que acompanha os botões de WhatsApp. */
export function microcopyDiagnostico(modo: DiagnosticoModo = diagnostico.modo) {
  switch (modo) {
    case "gratuito":
      return "Diagnóstico gratuito pelo WhatsApp, sem compromisso.";
    case "cobrado":
      return `Diagnóstico de ${diagnostico.precoCobrado}, descontado do serviço se você seguir com a gente.`;
    default:
      return "Atendimento pelo WhatsApp, sem compromisso.";
  }
}

export { origens, type Origem } from "./origens";
import type { Origem } from "./origens";
import type { Pagina } from "./tipos";

/** Acrescenta um código curto à mensagem para ligar a conversa à campanha (estágio 3 → 4 do funil). */
export const incluirCodigoNaMensagem = true;

/**
 * Mídia da página. Imagens por import estático (URL com hash: trocar a imagem nunca esbarra em cache).
 * Originais em midia-fonte/ → node scripts/otimizar-midia.mjs. Vídeo → node scripts/montar-hero.mjs.
 */
const v = `?v=${heroMidia.versao ?? "0"}`; // quadros e mp4 ficam em /public: a versão quebra o cache
export const midia = {
  heroPoster: imgHeroPoster,
  // Último quadro do vídeo (casa acesa): o que o movimento reduzido mostra.
  heroPosterFinal: imgHeroPosterFinal,
  heroVideoMobile: `/midia/hero/hero-mobile.mp4${v}`,
  heroQuadros: (i: number) => `/midia/hero/quadros/jv-${String(i + 1).padStart(3, "0")}.webp${v}`,
  antesDepois: imgAntesDepois,
  antesDepoisPlanta: imgAntesDepoisPlanta,
  ctaFinal: imgCtaFinal,
};

export const hero = {
  eyebrow: "Engenharia e consultoria jurídica · Maringá e Ponta Grossa",
  titulo: "Seu imóvel pode estar irregular sem você saber.",
  subtitulo:
    "Isso costuma aparecer na hora de vender, financiar ou transferir. Nós resolvemos toda a parte técnica e a burocracia: do georreferenciamento ao registro.",
  cta: "Descobrir a situação do meu imóvel",
  ctaSecundario: "Fazer o autodiagnóstico",
  ctaBarra: "Descobrir a situação do imóvel",
  posterAlt: "Receptor de georreferenciamento sobre um marco, à beira de um campo de soja, ao nascer do sol.",
};

export const checklist = {
  eyebrow: "Autodiagnóstico",
  titulo: "Algum destes pontos acontece com o seu imóvel?",
  intro: "Marque o que se aplica. Se não tiver certeza, marque também: o diagnóstico serve justamente para isso.",
  itens: [
    { id: "documentacao", texto: "A documentação está desatualizada" },
    { id: "area", texto: "A área construída é diferente da registrada" },
    { id: "limites", texto: "Os limites do terreno não batem com os documentos" },
    { id: "construcao", texto: "Tem construção ou ampliação que não foi regularizada" },
  ],
  fecho: "Não basta ter os documentos guardados. É preciso verificar se eles correspondem à realidade do imóvel.",
  cta: "Quero entender o meu caso",
};

/**
 * Comparador: à esquerda, o "projeto" da casa (planta gerada da própria foto) com os problemas
 * apontados; à direita, a foto do imóvel regularizado.
 * `ponto` = onde a seta encosta na casa; `rotulo` = onde fica a etiqueta (desktop). Em % da imagem.
 */
export const antesDepois = {
  eyebrow: "Arraste para comparar",
  titulo: "O que o diagnóstico encontra num imóvel como o seu.",
  intro: "De um lado, o que deveria constar no papel. Do outro, o imóvel depois de regularizado.",
  imagem: imgAntesDepois,
  planta: imgAntesDepoisPlanta,
  alt: "Fachada de uma casa moderna de dois pavimentos, com garagem anexa.",
  altPlanta: "A mesma fachada desenhada como projeto técnico, com os problemas apontados.",
  antes: { rotulo: "No projeto" },
  depois: { rotulo: "Regularizado" },
  problemas: [
    {
      titulo: "Área construída maior que a registrada",
      detalhe: "O pavimento superior não consta na matrícula.",
      ponto: { x: 40, y: 34 },
      rotulo: { x: 3, y: 26 },
    },
    {
      titulo: "Ampliação sem averbação",
      detalhe: "Garagem e terraço construídos depois, sem alvará nem habite-se.",
      ponto: { x: 73, y: 56 },
      rotulo: { x: 64, y: 10 },
    },
    {
      titulo: "Divisa diferente dos documentos",
      detalhe: "O muro lateral não bate com as medidas da matrícula.",
      ponto: { x: 11, y: 70 },
      rotulo: { x: 3, y: 54 },
    },
    {
      titulo: "Frente do lote divergente",
      detalhe: "A testada medida em campo é diferente da registrada.",
      ponto: { x: 46, y: 91 },
      rotulo: { x: 22, y: 84 },
    },
  ],
};

export const custo = {
  colunas: ["Imóvel irregular", "Imóvel regularizado"] as const,
  linhas: [
    ["Desvalorização", "Ganha valor de mercado"],
    ["Dificuldade na venda", "Passa mais segurança"],
    ["Restrição para financiamento", "Facilita o financiamento"],
    ["Riscos jurídicos", "Evita problemas futuros"],
    ["Conflitos familiares", "Protege o patrimônio"],
  ] as const,
  frase: "Regularizar não é gasto. É investimento no que é seu.",
};

export const diferencial = {
  eyebrow: "Quem cuida do seu caso",
  titulo: "Engenharia e consultoria jurídica na mesma casa.",
  paragrafos: [
    "Quase todo caso tem uma parte técnica e uma parte documental. Uma construção diferente do projeto aprovado é assunto de engenharia. Uma escritura que nunca foi feita é assunto jurídico.",
    "Quando só uma das partes é resolvida, o imóvel continua travado. Aqui as duas andam juntas, do levantamento no terreno até o registro na matrícula.",
  ],
  pessoas: [
    { nome: "Gabriella Stacheski", papel: "Advogada especialista em direito imobiliário" },
    { nome: "Paulo Henrique Bobato", papel: "Engenheiro civil e técnico agrimensor" },
  ],
  fotoAlt: "Gabriella Stacheski e Paulo Henrique Bobato, da JusVértice, sorrindo em frente a uma casa iluminada à noite.",
};

export const situacoes = {
  eyebrow: "Situações que atendemos",
  titulo: "Em qual dessas você está?",
  itens: [
    {
      origem: "venda" as Origem,
      titulo: "Venda travada",
      texto: "O comprador ou o banco pediu um documento que não existe. Quanto antes começar, menor o risco de perder o negócio.",
      imagem: imgSitVenda,
      alt: "Casa moderna com uma placa em branco fincada no gramado da frente.",
    },
    {
      origem: "financiamento" as Origem,
      titulo: "Financiamento negado",
      texto: "O banco recusou porque a matrícula não confere com o que foi construído. Dá para medir, regularizar e averbar.",
      imagem: imgSitFinanciamento,
      alt: "Mãos conferindo um contrato sobre a mesa, ao lado das chaves de casa e de um par de óculos.",
    },
    {
      origem: "heranca" as Origem,
      titulo: "Imóvel de herança",
      texto: "A documentação não está em dia e há herdeiros envolvidos. A parte técnica e o inventário precisam andar juntos.",
      imagem: imgSitHeranca,
      alt: "Mãos de uma pessoa idosa sobre uma pasta de documentos antigos e um molho de chaves.",
    },
    {
      origem: "gaveta" as Origem,
      titulo: "Compra sem escritura",
      texto: "Você pagou, recebeu as chaves e nunca registrou. É mais comum do que parece, e o contrato sozinho não garante a propriedade.",
      imagem: imgSitGaveta,
      alt: "Gaveta de madeira entreaberta com um contrato dobrado e as chaves da casa.",
    },
    {
      origem: "georreferenciamento" as Origem,
      titulo: "Georreferenciamento rural",
      texto: "Para vender, desmembrar ou transferir um imóvel rural, o cartório exige o georreferenciamento. Fazemos o levantamento e a certificação até o registro.",
      // PROVISÓRIO: mesma foto da seção de capacidade técnica; prompt da definitiva em docs/midia-prompts.md
      imagem: imgCapGeo,
      alt: "Receptor GNSS sobre tripé à beira de uma plantação, ao nascer do sol.",
    },
  ],
  cta: "Falar sobre isso",
};

export const comoFunciona = {
  eyebrow: "Como funciona",
  titulo: "Três passos, e você decide com tudo na mesa.",
  passos: [
    { titulo: "Você manda a matrícula", texto: "E conta o que está acontecendo. Tudo pelo WhatsApp." },
    { titulo: "Os especialistas analisam", texto: "Engenharia, agrimensura e consultoria jurídica." },
    { titulo: "Você recebe o caminho", texto: "Com prazo e custo, antes de decidir qualquer coisa." },
  ],
  cta: "Começar meu diagnóstico",
};

export const capacidades = {
  eyebrow: "Capacidade técnica",
  titulo: "O que permite resolver de ponta a ponta.",
  citacao: "Um terreno inclinado não é um problema. O problema é construir sem entender as características dele.",
  itens: [
    {
      titulo: "Topografia",
      texto: "Medidas, desníveis e limites reais do terreno, antes de comprar, construir ou corrigir a matrícula.",
      imagem: imgCapTopo,
      alt: "Topógrafo operando uma estação total em um terreno de terra vermelha, com estacas marcando a divisa.",
    },
    {
      titulo: "Georreferenciamento",
      texto: "Exigência legal para registrar, desmembrar ou vender imóvel rural.",
      imagem: imgCapGeo,
      alt: "Receptor GNSS sobre tripé à beira de uma plantação, ao nascer do sol.",
    },
    {
      titulo: "Projetos técnicos",
      texto: "Projetos para aprovar na prefeitura e construir do jeito que vai ficar registrado.",
      imagem: imgCapProjetos,
      alt: "Plantas baixas, régua e laptop sobre a mesa de trabalho.",
    },
  ],
};

export const faq = {
  eyebrow: "Perguntas frequentes",
  titulo: "Antes de começar.",
  itens: [
    {
      pergunta: "Quanto tempo leva a regularização?",
      // PENDENTE: prazos típicos por tipo de caso
      resposta:
        "Depende do caso. Averbar uma ampliação é bem mais rápido do que um inventário com vários herdeiros. Por isso o primeiro passo é o diagnóstico: você recebe o prazo estimado do seu caso antes de decidir qualquer coisa.",
    },
    {
      pergunta: "Contrato de compra e venda substitui a escritura?",
      resposta:
        "Não. O contrato prova que houve um negócio entre as partes, mas não transfere a propriedade. Para a lei, o dono é quem está na matrícula do imóvel, no Cartório de Registro de Imóveis. Sem escritura e registro fica difícil financiar, vender com segurança ou transferir para herdeiros.",
    },
    {
      pergunta: "Se eu pago o IPTU, sou o proprietário?",
      resposta:
        "Não necessariamente. O IPTU mostra quem a prefeitura cadastrou como responsável pelo imposto. A propriedade é comprovada pelo registro na matrícula, no cartório. São cadastros diferentes, e é comum que não coincidam.",
    },
    {
      pergunta: "Dá para regularizar uma construção feita diferente do projeto?",
      resposta:
        "Na maioria dos casos, sim. A engenharia mede o que foi construído e prepara a documentação técnica. Depois a construção é aprovada na prefeitura e averbada na matrícula. O que muda de um caso para outro são as regras do município.",
    },
    {
      pergunta: "Vocês atendem a minha cidade?",
      resposta: "Atendemos Maringá e região e Ponta Grossa e região. Se a sua cidade não está na lista, chame no WhatsApp e confirme.",
    },
  ],
  cta: "Tirar uma dúvida no WhatsApp",
};

export function perguntaDiagnostico(modo: DiagnosticoModo = diagnostico.modo) {
  if (modo === "gratuito") {
    return {
      pergunta: "O diagnóstico é gratuito mesmo?",
      resposta:
        "Sim. Você manda a documentação, a gente analisa e diz o que precisa ser feito, quanto tempo leva e quanto custa. Você só segue se fizer sentido.",
    };
  }
  if (modo === "cobrado") {
    return {
      pergunta: "Por que o diagnóstico é cobrado?",
      resposta: `Porque é uma análise feita por engenharia e consultoria jurídica juntas. O valor de ${diagnostico.precoCobrado} é descontado do serviço se você seguir com a gente.`,
    };
  }
  return null;
}

export const ctaFinal = {
  eyebrow: "Da irregularidade à tranquilidade",
  titulo: "Fale com a JusVértice e descubra a situação do seu imóvel.",
  cta: "Falar no WhatsApp",
  alt: "Casa iluminada à noite, vista do jardim.",
};

/** Página de regularização imobiliária (/). */
export const paginaRegularizacao: Pagina = {
  origens: {
    topo: "topo",
    checklist: "checklist",
    comoFunciona: "como-funciona",
    faq: "faq",
    rodape: "rodape",
    barraFixa: "barra-fixa",
    cabecalho: "cabecalho",
  },
  hero,
  checklist,
  comparador: antesDepois,
  custo,
  diferencial,
  situacoes,
  comoFunciona,
  capacidades,
  faq,
  ctaFinal,
};
