/**
 * Dados de demonstração do painel: 90 dias de tráfego plausível, gravados no esquema `demo`
 * (nunca no `public`, onde ficam os dados reais). Servem para avaliar o painel e treinar a equipe
 * antes de existirem dados de verdade. Gerador com semente fixa: o mesmo resultado a cada geração.
 */
import type { Banco } from "@/lib/db";
import { hojeSP, somarDias } from "./filtros";

function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Anuncio = { id: string; nome: string; peso: number; ctr: number };
type Conjunto = { id: string; nome: string; regiao: "maringa" | "pg" | "pr"; anuncios: Anuncio[] };
type Campanha = {
  id: string;
  nome: string;
  rural: boolean;
  inicio: number; // começou há N dias
  verba: number; // R$/dia
  conversao: number;
  cpm: number;
  conjuntos: Conjunto[];
};

const CAMPANHAS: Campanha[] = [
  {
    id: "120210000001",
    nome: "Regularização | Venda travada",
    rural: false,
    inicio: 86,
    verba: 38,
    conversao: 0.058,
    cpm: 21,
    conjuntos: [
      {
        id: "120210000101",
        nome: "Maringá e região · 30-60",
        regiao: "maringa",
        anuncios: [
          { id: "120210000901", nome: "Vídeo · receptor no campo", peso: 1.3, ctr: 0.016 },
          { id: "120210000902", nome: "Carrossel · situações", peso: 1, ctr: 0.012 },
        ],
      },
      {
        id: "120210000102",
        nome: "Ponta Grossa e região · 30-60",
        regiao: "pg",
        anuncios: [
          { id: "120210000903", nome: "Vídeo · receptor no campo", peso: 1, ctr: 0.014 },
          { id: "120210000904", nome: "Estático · patrimônio protegido", peso: 0.7, ctr: 0.009 },
        ],
      },
    ],
  },
  {
    id: "120210000002",
    nome: "Regularização | Herança e inventário",
    rural: false,
    inicio: 71,
    verba: 26,
    conversao: 0.034,
    cpm: 19,
    conjuntos: [
      {
        id: "120210000201",
        nome: "Maringá e região · 40-65",
        regiao: "maringa",
        anuncios: [
          { id: "120210000911", nome: "Foto · documentos antigos", peso: 1, ctr: 0.011 },
          { id: "120210000912", nome: "Reels · Gabi explica a partilha", peso: 1.2, ctr: 0.017 },
        ],
      },
    ],
  },
  {
    id: "120210000003",
    nome: "Imóvel rural | Georreferenciamento",
    rural: true,
    inicio: 46,
    verba: 34,
    conversao: 0.071,
    cpm: 26,
    conjuntos: [
      {
        id: "120210000301",
        nome: "Produtores rurais · Paraná",
        regiao: "pr",
        anuncios: [
          { id: "120210000921", nome: "Vídeo · terra em ordem", peso: 1.2, ctr: 0.013 },
          { id: "120210000922", nome: "Imagem · matrícula × campo", peso: 0.9, ctr: 0.01 },
        ],
      },
    ],
  },
  {
    id: "120210000004",
    nome: "Remarketing | Visitantes 30 dias",
    rural: false,
    inicio: 32,
    verba: 9,
    conversao: 0.09,
    cpm: 31,
    conjuntos: [
      {
        id: "120210000401",
        nome: "Visitaram o site · 30 dias",
        regiao: "maringa",
        anuncios: [{ id: "120210000931", nome: "Depoimento · caso resolvido", peso: 1, ctr: 0.021 }],
      },
    ],
  },
];

const CIDADES = {
  maringa: [
    ["Maringá", 58],
    ["Sarandi", 12],
    ["Paiçandu", 7],
    ["Marialva", 7],
    ["Mandaguaçu", 5],
    ["Mandaguari", 5],
    ["Londrina", 4],
    ["Campo Mourão", 2],
  ],
  pg: [
    ["Ponta Grossa", 64],
    ["Castro", 11],
    ["Carambeí", 8],
    ["Palmeira", 7],
    ["Curitiba", 6],
    ["Tibagi", 4],
  ],
  pr: [
    ["Maringá", 18],
    ["Ponta Grossa", 14],
    ["Campo Mourão", 10],
    ["Castro", 9],
    ["Cianorte", 8],
    ["Umuarama", 8],
    ["Guarapuava", 7],
    ["Tibagi", 6],
    ["Palmeira", 6],
    ["Marialva", 6],
    ["Londrina", 5],
  ],
} as const;

// Peso de cada hora do dia nas visitas (pico no almoço e à noite).
const HORAS = [1, 0.6, 0.3, 0.2, 0.2, 0.4, 1, 2, 3, 3.6, 3.8, 4, 5, 4.6, 3.6, 3.4, 3.4, 3.8, 4.6, 6.2, 7, 6.6, 4.8, 2.6];

const PERGUNTAS_URBANA = [
  "Quanto tempo leva a regularização?",
  "O diagnóstico é gratuito mesmo?",
  "Contrato de compra e venda substitui a escritura?",
  "Se eu pago o IPTU, sou o proprietário?",
  "Dá para regularizar uma construção feita diferente do projeto?",
  "Vocês atendem a minha cidade?",
];
const PERGUNTAS_RURAL = [
  "Vocês fazem só georreferenciamento?",
  "O que é o georreferenciamento e quando ele é exigido?",
  "Quanto tempo leva?",
  "Os vizinhos precisam participar?",
  "O que eu preciso mandar para começar?",
  "Vocês atendem a minha região?",
];
const ITENS_URBANA: [string, number][] = [
  ["documentacao", 3],
  ["area", 4],
  ["limites", 2],
  ["construcao", 5],
];
const ITENS_RURAL: [string, number][] = [
  ["rural-venda", 4],
  ["rural-area", 3],
  ["rural-divisa", 2],
  ["rural-sem-registro", 2],
  ["rural-credito", 3],
];
const SECOES = ["servicos", "checklist", "comparador", "situacoes", "equipe", "como-funciona", "duvidas", "cta-final"];
const NOMES = ["Ana", "Carlos", "Mariana", "José", "Fernanda", "Paulo", "Juliana", "Roberto", "Patrícia", "Marcos", "Luciana", "Antônio", "Cláudia", "Ricardo", "Sônia", "Eduardo", "Rosana", "Sérgio", "Débora", "Valdir"];
const SOBRENOMES = ["Silva", "Oliveira", "Souza", "Pereira", "Lima", "Ferreira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Carvalho", "Gomes", "Martins", "Rocha"];
const SERVICOS_URBANA = ["Averbação de construção", "Escritura e registro", "Inventário e partilha", "Compra sem escritura"];
const SERVICOS_RURAL = ["Georreferenciamento e certificação", "Retificação de área", "Desmembramento", "Partilha de imóvel rural"];

type Evento = {
  event_id: string;
  nome: string;
  ts: string;
  visitante: string;
  sessao: string;
  pagina: string;
  origem: string | null;
  props: Record<string, unknown>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  ad_id: string | null;
  adset_id: string | null;
  referrer: string | null;
  dispositivo: string;
  navegador: string;
  sistema: string;
  cidade: string;
  estado: string;
  pais: string;
  novo: boolean;
  fonte: string;
};

type LeadDemo = {
  codigo: string;
  criado_em: string;
  ultimo_contato: string;
  atualizado_em: string;
  status: string;
  valor: number | null;
  servico: string | null;
  nome: string | null;
  notas: string | null;
  origem: string;
  pagina: string;
  fonte: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  ad_id: string | null;
  adset_id: string | null;
  dispositivo: string;
  cidade: string;
  estado: string;
};

type AnuncioDia = {
  dia: string;
  ad_id: string;
  ad_nome: string;
  adset_id: string;
  adset_nome: string;
  campanha_id: string;
  campanha_nome: string;
  gasto: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  cliques_link: number;
};

export function gerarDadosDemo(agora = Date.now()) {
  const r = aleatorio(20261120);
  const entre = (a: number, b: number) => a + (b - a) * r();
  const escolher = <T>(lista: readonly (readonly [T, number])[] | [T, number][]): T => {
    const total = lista.reduce((s, [, p]) => s + p, 0);
    let x = r() * total;
    for (const [v, p] of lista) {
      x -= p;
      if (x <= 0) return v;
    }
    return lista[lista.length - 1][0];
  };
  const poisson = (media: number) => {
    let n = 0;
    let p = Math.exp(-media);
    let s = p;
    const u = r();
    while (u > s && n < 500) {
      n += 1;
      p *= media / n;
      s += p;
    }
    return n;
  };
  const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const codigo = () => "JV-" + Array.from({ length: 4 }, () => ALFABETO[Math.floor(r() * ALFABETO.length)]).join("");
  let seq = 0;
  const uuid = () => `demo-${(seq++).toString(36)}-${Math.floor(r() * 1e9).toString(36)}`;

  const hoje = hojeSP(agora);
  const horaAgora = new Date(agora - 3 * 3_600_000).getUTCHours();
  const eventos: Evento[] = [];
  const leads: LeadDemo[] = [];
  const anuncios: AnuncioDia[] = [];
  const pool: { codigo: string; rural: boolean; dia: number }[] = [];
  const convertidos = new Set<string>();

  const DIAS = 90;
  for (let d = DIAS - 1; d >= 0; d--) {
    const dia = somarDias(hoje, -d);
    const dow = new Date(`${dia}T12:00:00Z`).getUTCDay();
    const fimDeSemana = dow === 0 || dow === 6 ? 0.78 : 1;
    const parcialHoje = d === 0 ? Math.max(0.05, (horaAgora + 1) / 24) : 1;

    type Chegada = { fonte: string; campanha?: Campanha; conjunto?: Conjunto; anuncio?: Anuncio; rural: boolean };
    const chegadas: Chegada[] = [];

    // Pago: gasto → impressões → cliques no link → visitas.
    for (const c of CAMPANHAS) {
      if (d > c.inicio) continue;
      const rampa = Math.min(1, 0.55 + (c.inicio - d) * 0.09);
      const verbaDia = c.verba * fimDeSemana * rampa * entre(0.86, 1.14) * parcialHoje;
      const pesos = c.conjuntos.flatMap((cj) => cj.anuncios.map((a) => ({ cj, a })));
      const somaPesos = pesos.reduce((s, x) => s + x.a.peso, 0);
      for (const { cj, a } of pesos) {
        const gasto = Math.round(((verbaDia * a.peso) / somaPesos) * 100) / 100;
        const impressoes = Math.round((gasto / (c.cpm * entre(0.85, 1.15))) * 1000);
        const cliquesLink = Math.round(impressoes * a.ctr * entre(0.8, 1.2));
        anuncios.push({
          dia,
          ad_id: a.id,
          ad_nome: a.nome,
          adset_id: cj.id,
          adset_nome: cj.nome,
          campanha_id: c.id,
          campanha_nome: c.nome,
          gasto,
          impressoes,
          alcance: Math.round(impressoes * entre(0.62, 0.78)),
          cliques: Math.round(cliquesLink * entre(1.4, 1.9)),
          cliques_link: cliquesLink,
        });
        const visitas = Math.round(cliquesLink * entre(0.7, 0.84));
        for (let i = 0; i < visitas; i++) chegadas.push({ fonte: "Meta Ads", campanha: c, conjunto: cj, anuncio: a, rural: c.rural });
      }
    }

    // Orgânico.
    const crescimento = 0.6 + ((DIAS - d) / DIAS) * 0.6;
    const organicos: [string, number][] = [
      ["Direto", 4.5],
      ["Instagram/Facebook orgânico", 5],
      ["Busca orgânica", 3.2],
      ["WhatsApp", 1.4],
    ];
    for (const [fonte, media] of organicos) {
      const n = poisson(media * crescimento * fimDeSemana * parcialHoje);
      for (let i = 0; i < n; i++) chegadas.push({ fonte, rural: r() < 0.28 });
    }

    for (const ch of chegadas) {
      // Visitante: 17% voltam (mesmo aparelho, visita anterior dos últimos 14 dias).
      const candidatos = pool.filter((p) => p.rural === ch.rural && p.dia - d <= 14 && p.dia > d);
      const volta = candidatos.length > 0 && r() < 0.17;
      const visitante = volta ? candidatos[Math.floor(r() * candidatos.length)].codigo : codigo();
      if (!volta) pool.push({ codigo: visitante, rural: ch.rural, dia: d });
      if (pool.length > 4000) pool.splice(0, 500);

      const pagina = ch.rural
        ? r() < 0.78
          ? "/georreferenciamento"
          : "/georreferenciamento/v2"
        : ch.campanha && ch.campanha.id === "120210000001"
          ? escolher([
              ["/", 70],
              ["/v2", 15],
              ["/v3", 15],
            ])
          : "/";

      const pago = ch.fonte === "Meta Ads";
      const dispositivo = pago
        ? escolher([
            ["celular", 82],
            ["computador", 14],
            ["tablet", 4],
          ])
        : escolher([
            ["celular", 64],
            ["computador", 33],
            ["tablet", 3],
          ]);
      const sistema =
        dispositivo === "computador"
          ? escolher([
              ["Windows", 78],
              ["macOS", 18],
              ["Linux", 4],
            ])
          : escolher([
              ["Android", 71],
              ["iOS", 29],
            ]);
      const navegador =
        pago && dispositivo !== "computador"
          ? escolher([
              ["Instagram (app)", 52],
              ["Facebook (app)", 27],
              [sistema === "iOS" ? "Safari" : "Chrome", 21],
            ])
          : dispositivo === "computador"
            ? escolher([
                ["Chrome", 72],
                ["Edge", 16],
                ["Safari", 7],
                ["Firefox", 5],
              ])
            : ch.fonte === "Instagram/Facebook orgânico"
              ? "Instagram (app)"
              : sistema === "iOS"
                ? "Safari"
                : escolher([
                    ["Chrome", 80],
                    ["Samsung Internet", 20],
                  ]);
      const regiao = ch.conjunto?.regiao ?? (ch.rural ? "pr" : r() < 0.7 ? "maringa" : "pg");
      const cidade = escolher(CIDADES[regiao]);

      const hora = escolher(HORAS.map((p, h) => [h, d === 0 && h > horaAgora ? 0 : p] as [number, number]));
      const t0 = Date.parse(`${dia}T00:00:00Z`) + 3 * 3_600_000 + hora * 3_600_000 + Math.floor(r() * 3_600_000);
      const sessao = uuid();
      const base = {
        visitante,
        sessao,
        pagina,
        utm_source: pago ? (navegador === "Facebook (app)" ? "facebook" : "instagram") : null,
        utm_medium: pago ? "paid" : null,
        utm_campaign: ch.campanha?.nome ?? null,
        utm_content: ch.anuncio?.nome ?? null,
        utm_term: ch.conjunto?.nome ?? null,
        utm_id: ch.campanha?.id ?? null,
        ad_id: ch.anuncio?.id ?? null,
        adset_id: ch.conjunto?.id ?? null,
        referrer:
          ch.fonte === "Busca orgânica"
            ? "www.google.com"
            : ch.fonte === "Instagram/Facebook orgânico"
              ? "l.instagram.com"
              : ch.fonte === "WhatsApp"
                ? "web.whatsapp.com"
                : null,
        dispositivo,
        navegador,
        sistema,
        cidade,
        estado: cidade === "Curitiba" ? "PR" : "PR",
        pais: "BR",
        novo: !volta,
        fonte: ch.fonte,
      };
      const emitir = (nome: string, segundos: number, props: Record<string, unknown> = {}, origem: string | null = null) => {
        eventos.push({ ...base, event_id: uuid(), nome, ts: new Date(t0 + segundos * 1000).toISOString(), origem, props });
      };

      // Quanto a pessoa leu: profundidade de 0 a 1 e duração em segundos, ligadas entre si.
      // Maioria das visitas é curta (anúncio no celular); poucas leem tudo.
      const interesse = Math.pow(r(), pago ? 1.5 : 1.15);
      const duracao = Math.round(4 + Math.pow(interesse, 1.4) * entre(50, 520));
      const profundidade = Math.min(1, interesse * entre(0.85, 1.3));
      emitir("page_view", 0);
      for (const marco of [15, 30, 60, 120, 300]) if (duracao >= marco) emitir("engajamento", marco, { segundos: marco });
      if (profundidade > 0.45) emitir("scroll_50", duracao * 0.45);
      if (profundidade > 0.86) emitir("scroll_90", duracao * 0.85);
      // A última seção aparece junto com o fim da página (rolagem de 90%).
      const alcancadas = profundidade > 0.86 ? SECOES.length : Math.floor((profundidade / 0.86) * (SECOES.length - 1));
      SECOES.slice(0, alcancadas).forEach((secao, i) => emitir("secao_vista", ((i + 1) / SECOES.length) * duracao, { secao }));
      const viuChecklist = alcancadas >= 2;
      if (viuChecklist) emitir("checklist_lido", duracao * 0.3);
      let marcou = 0;
      if (viuChecklist && r() < 0.32) {
        const itens = ch.rural ? ITENS_RURAL : ITENS_URBANA;
        const n = 1 + Math.floor(r() * 3);
        const escolhidos = new Set<string>();
        for (let i = 0; i < n; i++) escolhidos.add(escolher(itens));
        for (const item of escolhidos) emitir("checklist_marcado", duracao * 0.28, { item, marcado: true });
        marcou = escolhidos.size;
      }
      if (!ch.rural && alcancadas >= 3 && r() < 0.22) emitir("comparador_usado", duracao * 0.4, { meio: r() < 0.85 ? "arrasto" : "teclado" });
      if (alcancadas >= 7 && r() < 0.36) {
        const perguntas = ch.rural ? PERGUNTAS_RURAL : PERGUNTAS_URBANA;
        emitir("faq_aberta", duracao * 0.8, { pergunta: perguntas[Math.floor(Math.pow(r(), 1.6) * perguntas.length)] });
      }
      if (r() < 0.06) emitir("autodiagnostico_click", 4);
      if (r() < 0.035) emitir("navegacao_click", duracao * 0.2, { destino: ch.rural ? "#servicos" : r() < 0.5 ? "/georreferenciamento" : "#duvidas" });
      if (r() < 0.012) emitir("contato_click", duracao * 0.95, { canal: r() < 0.6 ? "telefone" : "instagram" });

      // Conversa no WhatsApp.
      let chance = ch.campanha?.conversao ?? (ch.fonte === "Busca orgânica" ? 0.075 : ch.fonte === "WhatsApp" ? 0.11 : 0.055);
      if (pagina.endsWith("/v2")) chance *= 1.22;
      if (pagina.endsWith("/v3")) chance *= 0.9;
      if (dispositivo === "computador") chance *= 0.8;
      if (volta) chance *= 1.6;
      if (marcou) chance *= 1.9;
      chance *= 0.45 + profundidade * 1.1;
      if (convertidos.has(visitante) || r() > chance) continue;
      convertidos.add(visitante);

      const prefixo = ch.rural ? "georref-" : "";
      const origemBase = ch.rural
        ? escolher<string>([
            ["topo", 30],
            ["barra-fixa", dispositivo === "celular" ? 20 : 0],
            ["checklist", marcou ? 30 : 8],
            ["venda", 9],
            ["heranca", 6],
            ["divergencia", 7],
            ["credito", 5],
            ["como-funciona", 4],
            ["faq", 3],
            ["cabecalho", dispositivo === "computador" ? 8 : 0],
            ["rodape", 4],
          ])
        : escolher<string>([
            ["topo", 28],
            ["barra-fixa", dispositivo === "celular" ? 19 : 0],
            ["checklist", marcou ? 32 : 9],
            ["venda", ch.campanha?.id === "120210000001" ? 12 : 5],
            ["financiamento", 5],
            ["heranca", ch.campanha?.id === "120210000002" ? 14 : 3],
            ["gaveta", 5],
            ["georreferenciamento", 2],
            ["como-funciona", 5],
            ["faq", 3],
            ["cabecalho", dispositivo === "computador" ? 9 : 0],
            ["rodape", 4],
          ]);
      const origem = `${prefixo}${origemBase}`;
      const segundosClique = Math.max(5, duracao * entre(0.2, 0.95));
      emitir("whatsapp_click", segundosClique, { origem }, origem);

      const criado = new Date(t0 + segundosClique * 1000);
      const idade = d;
      const status = escolher<string>(
        idade <= 2
          ? [
              ["nova", 55],
              ["atendimento", 45],
            ]
          : idade <= 7
            ? [
                ["nova", 18],
                ["atendimento", 34],
                ["proposta", 26],
                ["fechou", 5],
                ["perdeu", 13],
              ]
            : [
                ["nova", 6],
                ["atendimento", 10],
                ["proposta", 14],
                ["fechou", ch.rural ? 15 : 11],
                ["perdeu", 55],
              ],
      );
      const valor =
        status === "fechou"
          ? Math.round((ch.rural ? entre(4200, 11500) : entre(1600, 4800)) / 50) * 50
          : status === "proposta"
            ? Math.round((ch.rural ? entre(4000, 11000) : entre(1500, 4500)) / 50) * 50
            : null;
      const atualizado = new Date(Math.min(agora, criado.getTime() + entre(0.2, Math.max(0.3, idade)) * 86_400_000));
      leads.push({
        codigo: visitante,
        criado_em: criado.toISOString(),
        ultimo_contato: criado.toISOString(),
        atualizado_em: atualizado.toISOString(),
        status,
        valor,
        servico: status === "nova" ? null : (ch.rural ? SERVICOS_RURAL : SERVICOS_URBANA)[Math.floor(r() * 4)],
        nome: status === "nova" || r() < 0.25 ? null : `${NOMES[Math.floor(r() * NOMES.length)]} ${SOBRENOMES[Math.floor(r() * SOBRENOMES.length)]}`,
        notas: status === "perdeu" && r() < 0.5 ? (r() < 0.5 ? "Achou caro, vai pensar." : "Só queria tirar uma dúvida.") : null,
        origem,
        pagina,
        fonte: ch.fonte,
        utm_source: base.utm_source,
        utm_medium: base.utm_medium,
        utm_campaign: base.utm_campaign,
        utm_content: base.utm_content,
        utm_term: base.utm_term,
        utm_id: base.utm_id,
        ad_id: base.ad_id,
        adset_id: base.adset_id,
        dispositivo,
        cidade,
        estado: base.estado,
      });
    }
  }

  return { eventos, leads, anuncios };
}

async function inserirEmLotes(banco: Banco, sql: string, linhas: unknown[], tamanho: number) {
  for (let i = 0; i < linhas.length; i += tamanho) {
    await banco.query(sql, [JSON.stringify(linhas.slice(i, i + tamanho))]);
  }
}

/** Apaga e recria os dados do esquema demo. */
export async function gravarDadosDemo(banco: Banco) {
  const { eventos, leads, anuncios } = gerarDadosDemo();
  await apagarDadosDemo(banco);
  await inserirEmLotes(
    banco,
    `insert into demo.eventos (event_id, nome, ts, visitante, sessao, pagina, origem, props, utm_source, utm_medium, utm_campaign,
       utm_content, utm_term, utm_id, ad_id, adset_id, referrer, dispositivo, navegador, sistema, cidade, estado, pais, novo, fonte)
     select event_id, nome, ts, visitante, sessao, pagina, origem, props, utm_source, utm_medium, utm_campaign,
       utm_content, utm_term, utm_id, ad_id, adset_id, referrer, dispositivo, navegador, sistema, cidade, estado, pais, novo, fonte
     from jsonb_to_recordset($1::jsonb) as t(event_id text, nome text, ts timestamptz, visitante text, sessao text, pagina text,
       origem text, props jsonb, utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text, utm_id text,
       ad_id text, adset_id text, referrer text, dispositivo text, navegador text, sistema text, cidade text, estado text, pais text,
       novo boolean, fonte text)`,
    eventos,
    3000,
  );
  await inserirEmLotes(
    banco,
    `insert into demo.leads (codigo, criado_em, ultimo_contato, atualizado_em, status, valor, servico, nome, notas, origem, pagina, fonte,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, ad_id, adset_id, dispositivo, cidade, estado)
     select codigo, criado_em, ultimo_contato, atualizado_em, status, valor, servico, nome, notas, origem, pagina, fonte,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, ad_id, adset_id, dispositivo, cidade, estado
     from jsonb_to_recordset($1::jsonb) as t(codigo text, criado_em timestamptz, ultimo_contato timestamptz, atualizado_em timestamptz,
       status text, valor numeric, servico text, nome text, notas text, origem text, pagina text, fonte text, utm_source text,
       utm_medium text, utm_campaign text, utm_content text, utm_term text, utm_id text, ad_id text, adset_id text, dispositivo text,
       cidade text, estado text)
     on conflict (codigo) do nothing`,
    leads,
    1000,
  );
  await inserirEmLotes(
    banco,
    `insert into demo.anuncios_diario (dia, ad_id, ad_nome, adset_id, adset_nome, campanha_id, campanha_nome, gasto, impressoes, alcance, cliques, cliques_link)
     select dia, ad_id, ad_nome, adset_id, adset_nome, campanha_id, campanha_nome, gasto, impressoes, alcance, cliques, cliques_link
     from jsonb_to_recordset($1::jsonb) as t(dia date, ad_id text, ad_nome text, adset_id text, adset_nome text, campanha_id text,
       campanha_nome text, gasto numeric, impressoes int, alcance int, cliques int, cliques_link int)`,
    anuncios,
    2000,
  );
  await banco.query(
    `insert into demo.sincronizacao (fonte, executado_em, ok, mensagem, linhas) values ('meta', now(), true, 'Dados de demonstração', $1)
     on conflict (fonte) do update set executado_em = excluded.executado_em, ok = true, mensagem = excluded.mensagem, linhas = excluded.linhas`,
    [anuncios.length],
  );
  return { eventos: eventos.length, leads: leads.length, anuncios: anuncios.length };
}

export async function apagarDadosDemo(banco: Banco) {
  for (const tabela of ["eventos", "leads", "anuncios_diario", "sincronizacao"]) {
    await banco.query(`delete from demo.${tabela}`);
  }
}
