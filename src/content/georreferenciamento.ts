/**
 * Conteúdo da página /georreferenciamento (propriedade rural).
 *
 * Mesma estrutura da página de regularização, com texto, imagens e origens próprias.
 * O georreferenciamento é só um dos serviços: o texto fala da regularização rural inteira
 * (medição, retificação, desmembramento, parte documental e registro) e cita o georreferenciamento
 * onde ele é o assunto (FAQ e "Como fazemos").
 * PENDENTE: revisão técnica do Paulo Henrique e da Gabi antes de publicar, principalmente
 * no FAQ (exigências do cartório/INCRA e documentos pedidos).
 *
 * Imagens provisórias, reaproveitadas da página principal; prompts das definitivas em
 * docs/midia-prompts.md, seção "Página de georreferenciamento".
 */
import imgCampo from "@/assets/midia/georref-campo.jpg";
import imgCampoPenumbra from "@/assets/midia/georref-campo-penumbra.jpg";
import imgCapGeo from "@/assets/midia/capacidade-georreferenciamento.jpg";
import imgCapProjetos from "@/assets/midia/capacidade-projetos.jpg";
import imgCapTopo from "@/assets/midia/capacidade-topografia.jpg";
import imgSitFinanciamento from "@/assets/midia/situacao-financiamento.jpg";
import imgSitGaveta from "@/assets/midia/situacao-gaveta.jpg";
import imgSitHeranca from "@/assets/midia/situacao-heranca.jpg";
import { diferencial as diferencialBase } from "./site";
import type { ItemFaq, Pagina } from "./tipos";

export const metaGeorreferenciamento = {
  titulo: "Regularização de imóvel rural em Maringá e Ponta Grossa | JusVértice",
  descricao:
    "Vai vender, dividir ou passar a terra para herdeiros? Medição, georreferenciamento, retificação de área, desmembramento e registro na matrícula, com engenharia e consultoria jurídica juntas. Diagnóstico pelo WhatsApp.",
};

export const faqGeorreferenciamento: ItemFaq[] = [
  {
    pergunta: "Vocês fazem só georreferenciamento?",
    resposta:
      "Não. Fazemos a medição e a topografia da propriedade, a retificação de área, o desmembramento e toda a parte documental até o registro: transferência, partilha entre herdeiros e regularização de compra sem escritura. Engenharia e consultoria jurídica trabalham juntas no mesmo caso.",
  },
  {
    pergunta: "O que é o georreferenciamento e quando ele é exigido?",
    resposta:
      "É a medição dos limites da propriedade com coordenadas precisas, certificada pelo INCRA no SIGEF e averbada na matrícula. O cartório passou a exigir para vender, transferir, desmembrar ou partilhar, e a obrigação foi sendo ampliada por etapas, conforme o tamanho da área. No diagnóstico confirmamos se a sua propriedade já está obrigada.",
  },
  {
    pergunta: "Quanto tempo leva?",
    // PENDENTE: prazos típicos (campo, certificação e cartório)
    resposta:
      "Depende do tamanho da área, do relevo e de como está a documentação. No diagnóstico você recebe o prazo estimado do seu caso antes de decidir.",
  },
  {
    pergunta: "Os vizinhos precisam participar?",
    resposta:
      "Em geral, sim: os confrontantes assinam a declaração de que reconhecem as divisas. Quando há divergência de limites, a consultoria jurídica conduz a solução junto com a parte técnica, para o processo não travar no cartório.",
  },
  {
    pergunta: "O que eu preciso mandar para começar?",
    // PENDENTE: confirmar lista de documentos com o Paulo Henrique
    resposta:
      "A matrícula atualizada e, se tiver, o CCIR e o CAR. A localização da propriedade pode ser enviada pelo próprio WhatsApp.",
  },
  {
    pergunta: "Vocês atendem a minha região?",
    resposta:
      "Atendemos Maringá e região e Ponta Grossa e região. Se a sua cidade não está na lista, chame no WhatsApp e confirme.",
  },
];

export const paginaGeorreferenciamento: Pagina = {
  origens: {
    topo: "georref-topo",
    checklist: "georref-checklist",
    comoFunciona: "georref-como-funciona",
    faq: "georref-faq",
    rodape: "georref-rodape",
    barraFixa: "georref-barra-fixa",
    cabecalho: "georref-cabecalho",
  },
  hero: {
    eyebrow: "Propriedade rural · Maringá e Ponta Grossa",
    titulo: "Sua terra está em ordem no cartório?",
    subtitulo:
      "Venda, herança e crédito rural travam quando a matrícula não bate com a terra. Nós medimos, acertamos a documentação e levamos até o registro.",
    cta: "Verificar minha propriedade",
    ctaSecundario: "Fazer o autodiagnóstico",
    ctaBarra: "Verificar minha propriedade",
    posterAlt: "Receptor GNSS sobre um marco, à beira de um campo de soja, ao nascer do sol.",
  },
  checklist: {
    eyebrow: "Autodiagnóstico",
    titulo: "Algum destes pontos acontece com a sua propriedade?",
    intro: "Marque o que se aplica. Se não tiver certeza, marque também: o diagnóstico serve justamente para isso.",
    itens: [
      { id: "rural-venda", texto: "Vou vender, dividir ou passar a terra para herdeiros" },
      { id: "rural-area", texto: "A área medida ou do CAR é diferente da matrícula" },
      { id: "rural-divisa", texto: "Existe dúvida sobre as divisas com algum vizinho" },
      { id: "rural-sem-registro", texto: "Comprei uma parte e nunca registrei no meu nome" },
      { id: "rural-credito", texto: "O banco pediu a documentação da propriedade para crédito rural" },
    ],
    fecho: "Não basta ter os documentos guardados. É preciso verificar se eles correspondem ao que existe no campo.",
    cta: "Quero entender o meu caso",
  },
  custo: {
    eyebrow: "O que muda",
    titulo: "Com a documentação em ordem, a terra fica pronta para o que vier.",
    colunas: ["Documentação irregular", "Documentação em ordem"],
    linhas: [
      ["Venda e transferência travam no cartório", "Venda e transferência registradas"],
      ["Partilha e desmembramento parados", "Cada herdeiro com a sua parte no nome"],
      ["Área e divisas incertas", "Área e divisas corretas na matrícula"],
      ["Crédito rural mais difícil", "Documentação pronta para o banco"],
      ["Risco de conflito com vizinhos", "Limites reconhecidos pelos confrontantes"],
    ],
    frase: "Regularizar não é gasto. É investimento no que é seu.",
  },
  diferencial: {
    ...diferencialBase,
    titulo: "Engenharia, agrimensura e consultoria jurídica na mesma casa.",
    paragrafos: [
      "Regularizar uma propriedade rural tem uma parte técnica e uma parte documental. Medir a área, achar as divisas reais e certificar o levantamento é trabalho de engenharia e agrimensura. Matrícula, partilha, confrontantes e registro são a parte documental.",
      "Quando só uma delas é resolvida, a terra continua travada. Aqui as duas andam juntas, do campo até o cartório.",
    ],
  },
  situacoes: {
    eyebrow: "Situações que atendemos",
    titulo: "Em qual dessas você está?",
    itens: [
      {
        origem: "georref-venda",
        titulo: "Venda ou transferência",
        texto:
          "O comprador apareceu, mas a matrícula não está pronta para a transferência. Quanto antes começar, menor o risco de perder o negócio.",
        imagem: imgCampo,
        alt: "Receptor GNSS sobre tripé à beira de um campo de soja, com estacas marcando a divisa.",
      },
      {
        origem: "georref-heranca",
        titulo: "Herança, partilha e desmembramento",
        texto:
          "A terra precisa ser dividida entre herdeiros ou ter uma parte vendida. A medição e o inventário precisam andar juntos.",
        imagem: imgSitHeranca,
        alt: "Mãos de uma pessoa idosa sobre uma pasta de documentos antigos e um molho de chaves.",
      },
      {
        origem: "georref-divergencia",
        titulo: "Área ou divisa divergente",
        texto:
          "A área medida não bate com a matrícula, ou há dúvida sobre os limites com algum vizinho. Medimos, conciliamos com os confrontantes e retificamos a matrícula.",
        imagem: imgCapTopo,
        alt: "Topógrafo operando uma estação total num terreno de terra vermelha, com estacas marcando a divisa.",
      },
      {
        origem: "georref-credito",
        titulo: "Crédito rural",
        texto:
          "O banco pediu a documentação da propriedade para liberar o financiamento. Com a matrícula em ordem, a análise do crédito anda.",
        imagem: imgSitFinanciamento,
        alt: "Mãos conferindo um contrato sobre a mesa, ao lado das chaves e de um par de óculos.",
      },
    ],
    cta: "Falar sobre isso",
  },
  comoFunciona: {
    eyebrow: "Como funciona",
    titulo: "Três passos, e você decide com tudo na mesa.",
    passos: [
      { titulo: "Você manda a matrícula", texto: "E o CCIR, se tiver. A localização da propriedade pode ir pelo próprio WhatsApp." },
      { titulo: "Os especialistas analisam", texto: "Engenharia, agrimensura e consultoria jurídica." },
      { titulo: "Você recebe o caminho", texto: "Com prazo e custo, antes de decidir qualquer coisa." },
    ],
    cta: "Começar meu diagnóstico",
  },
  capacidades: {
    eyebrow: "Como fazemos",
    titulo: "Do campo ao registro.",
    // PENDENTE: trocar por uma frase da própria Gabi/Paulo Henrique, se houver
    citacao: "Regularizar a terra é fazer a matrícula dizer exatamente o que existe no campo.",
    itens: [
      {
        titulo: "Medição e topografia",
        texto: "Levantamento da área e das divisas reais com receptores GNSS e estação total, vértice por vértice.",
        imagem: imgCapGeo,
        alt: "Receptor GNSS sobre tripé à beira de uma plantação, ao nascer do sol.",
      },
      {
        titulo: "Georreferenciamento e retificação",
        texto: "Certificação do levantamento no SIGEF/INCRA e correção da área na matrícula quando ela não confere com o campo.",
        imagem: imgCapProjetos,
        alt: "Plantas, régua e laptop sobre a mesa de trabalho.",
      },
      {
        titulo: "Documentação e registro",
        texto: "Desmembramento, partilha, declaração dos confrontantes e registro no cartório, conduzidos pela consultoria jurídica.",
        imagem: imgSitGaveta,
        alt: "Gaveta de madeira entreaberta com um contrato dobrado e as chaves.",
      },
    ],
  },
  faq: {
    eyebrow: "Perguntas frequentes",
    titulo: "Antes de começar.",
    itens: faqGeorreferenciamento,
    cta: "Tirar uma dúvida no WhatsApp",
  },
  ctaFinal: {
    eyebrow: "Da irregularidade à tranquilidade",
    titulo: "Fale com a JusVértice e descubra a situação da sua terra.",
    cta: "Falar no WhatsApp",
    alt: "",
    imagem: imgCampoPenumbra,
  },
};
