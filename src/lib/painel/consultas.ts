/**
 * Consultas do painel. Tudo sai de três tabelas: eventos (o que acontece no site), leads (conversas
 * e o andamento marcado no painel) e anuncios_diario (gasto e entrega, sincronizados da Meta).
 *
 * Definições (as mesmas em todas as telas):
 * - Visitas = sessões; Pessoas = visitantes únicos (código JV de cada aparelho).
 * - Conversas = leads criados no período (primeiro clique no WhatsApp de cada pessoa).
 * - Atendimento = lead com qualquer andamento além de "nova conversa"; Cliente = lead que fechou.
 * - Custo por conversa = investimento ÷ conversas vindas da Meta (as únicas que o gasto pagou).
 * - ROAS = receita fechada das conversas da Meta ÷ investimento.
 *
 * Filtro cruzado: cada gráfico ignora o próprio filtro, para continuar mostrando as outras barras
 * com a escolhida em destaque (como no Power BI).
 */
import { paginaGeorreferenciamento } from "@/content/georreferenciamento";
import { paginaRegularizacao } from "@/content/site";
import type { Banco, Esquema } from "@/lib/db";
import { SECOES } from "@/lib/eventos";
import { type ChaveFiltro, type Filtros, somarDias } from "./filtros";

class Params {
  lista: unknown[] = [];
  add(v: unknown) {
    this.lista.push(v);
    return `$${this.lista.length}`;
  }
}

const diaSP = (col: string) => `(((${col}) at time zone 'UTC') - interval '3 hours')::date`;
const horaSP = (col: string) => `extract(hour from ((${col}) at time zone 'UTC') - interval '3 hours')::int`;
const dowSP = (col: string) => `extract(dow from ((${col}) at time zone 'UTC') - interval '3 hours')::int`;

function noPeriodo(col: string, de: string, ate: string, p: Params) {
  return `${col} >= ((${p.add(de)}::date + interval '3 hours') at time zone 'UTC')
    and ${col} < ((${p.add(ate)}::date + interval '1 day 3 hours') at time zone 'UTC')`;
}

const PAGINA_SQL: Record<"urbana" | "rural", (a: string) => string> = {
  urbana: (a) => `${a}.pagina in ('/', '/v2', '/v3')`,
  rural: (a) => `${a}.pagina like '/georreferenciamento%'`,
};

function condComum(f: Filtros, p: Params, a: string, ignorar: ChaveFiltro[]) {
  const c = ["true"];
  if (f.pagina !== "todas" && !ignorar.includes("pagina")) c.push(PAGINA_SQL[f.pagina](a));
  if (f.fonte && !ignorar.includes("fonte")) c.push(`coalesce(${a}.fonte, 'Direto') = ${p.add(f.fonte)}`);
  if (f.campanha && !ignorar.includes("campanha")) c.push(`coalesce(${a}.utm_campaign, ${a}.utm_id) = ${p.add(f.campanha)}`);
  if (f.dispositivo && !ignorar.includes("dispositivo")) c.push(`${a}.dispositivo = ${p.add(f.dispositivo)}`);
  return c;
}

/** O botão de origem só filtra o que é conversa (não faz sentido para visitas). */
function condEventos(f: Filtros, p: Params, a = "e", ignorar: ChaveFiltro[] = []) {
  return condComum(f, p, a, ignorar).join(" and ");
}

function condLeads(f: Filtros, p: Params, a = "l", ignorar: ChaveFiltro[] = []) {
  const c = condComum(f, p, a, ignorar);
  if (f.origem && !ignorar.includes("origem")) c.push(`coalesce(${a}.origem, '') = ${p.add(f.origem)}`);
  return c.join(" and ");
}

/** O gasto só se divide por campanha (e, por ela, por página). Aparelho e botão não se aplicam. */
function condGasto(f: Filtros, p: Params, a = "a", ignorar: ChaveFiltro[] = []) {
  const c = ["true"];
  if (f.fonte && f.fonte !== "Meta Ads" && !ignorar.includes("fonte")) c.push("false");
  if (f.campanha && !ignorar.includes("campanha")) {
    const v = p.add(f.campanha);
    c.push(`(${a}.campanha_nome = ${v} or ${a}.campanha_id = ${v})`);
  }
  if (f.pagina !== "todas" && !ignorar.includes("pagina")) {
    const pg = PAGINA_SQL[f.pagina]("e2");
    c.push(`(${a}.campanha_nome in (select e2.utm_campaign from {s}.eventos e2 where e2.nome = 'page_view' and e2.utm_campaign is not null and ${pg})
      or ${a}.campanha_id in (select e2.utm_id from {s}.eventos e2 where e2.nome = 'page_view' and e2.utm_id is not null and ${pg}))`);
  }
  return c.join(" and ");
}

export type Kpis = {
  visitas: number;
  visitantes: number;
  leram: number;
  cliquesWhats: number;
  conversas: number;
  conversasMeta: number;
  atendidas: number;
  clientes: number;
  clientesMeta: number;
  receita: number;
  receitaMeta: number;
  investimento: number;
  impressoes: number;
  cliquesLink: number;
};

export type PontoDia = { dia: string; visitas: number; visitantes: number; conversas: number; conversasMeta: number; investimento: number };
export type Fatia = { chave: string; visitantes: number; conversas: number };
export type Celula = { dow: number; hora: number; conversas: number };

export function criarConsultas(banco: Banco, esquema: Esquema) {
  const q = <T>(sql: string, p: Params) => banco.query<T>(sql.replaceAll("{s}", esquema), p.lista);

  async function kpis(f: Filtros, de: string, ate: string): Promise<Kpis> {
    const pe = new Params();
    const pl = new Params();
    const pg = new Params();
    const [ev, ld, gs] = await Promise.all([
      q<{ visitas: number; visitantes: number; leram: number; cliques_whats: number }>(
        `select count(distinct e.sessao) filter (where e.nome = 'page_view')::int as visitas,
                count(distinct e.visitante) filter (where e.nome = 'page_view')::int as visitantes,
                count(distinct e.visitante) filter (where e.nome = 'checklist_lido')::int as leram,
                count(*) filter (where e.nome = 'whatsapp_click')::int as cliques_whats
         from {s}.eventos e
         where ${noPeriodo("e.ts", de, ate, pe)} and ${condEventos(f, pe)}`,
        pe,
      ),
      q<{ conversas: number; conversas_meta: number; atendidas: number; clientes: number; clientes_meta: number; receita: number; receita_meta: number }>(
        `select count(*)::int as conversas,
                count(*) filter (where l.fonte = 'Meta Ads')::int as conversas_meta,
                count(*) filter (where l.status <> 'nova')::int as atendidas,
                count(*) filter (where l.status = 'fechou')::int as clientes,
                count(*) filter (where l.status = 'fechou' and l.fonte = 'Meta Ads')::int as clientes_meta,
                coalesce(sum(l.valor) filter (where l.status = 'fechou'), 0)::float8 as receita,
                coalesce(sum(l.valor) filter (where l.status = 'fechou' and l.fonte = 'Meta Ads'), 0)::float8 as receita_meta
         from {s}.leads l
         where ${noPeriodo("l.criado_em", de, ate, pl)} and ${condLeads(f, pl)}`,
        pl,
      ),
      q<{ investimento: number; impressoes: number; cliques_link: number }>(
        `select coalesce(sum(a.gasto), 0)::float8 as investimento,
                coalesce(sum(a.impressoes), 0)::int as impressoes,
                coalesce(sum(a.cliques_link), 0)::int as cliques_link
         from {s}.anuncios_diario a
         where a.dia between ${pg.add(de)}::date and ${pg.add(ate)}::date and ${condGasto(f, pg)}`,
        pg,
      ),
    ]);
    const e = ev[0];
    const l = ld[0];
    const g = gs[0];
    return {
      visitas: e.visitas,
      visitantes: e.visitantes,
      leram: e.leram,
      cliquesWhats: e.cliques_whats,
      conversas: l.conversas,
      conversasMeta: l.conversas_meta,
      atendidas: l.atendidas,
      clientes: l.clientes,
      clientesMeta: l.clientes_meta,
      receita: l.receita,
      receitaMeta: l.receita_meta,
      investimento: g.investimento,
      impressoes: g.impressoes,
      cliquesLink: g.cliques_link,
    };
  }

  async function serieDiaria(f: Filtros): Promise<PontoDia[]> {
    const p = new Params();
    const de = p.add(f.de);
    const ate = p.add(f.ate);
    // Os mesmos limites do período, reaproveitando os parâmetros já criados.
    const faixa = (col: string) =>
      `${col} >= ((${de}::date + interval '3 hours') at time zone 'UTC') and ${col} < ((${ate}::date + interval '1 day 3 hours') at time zone 'UTC')`;
    const rows = await q<{ dia: string; visitas: number; visitantes: number; conversas: number; conversas_meta: number; investimento: number }>(
      `with dias as (select generate_series(${de}::date, ${ate}::date, interval '1 day')::date as dia)
       select to_char(d.dia, 'YYYY-MM-DD') as dia,
              coalesce(v.visitas, 0)::int as visitas, coalesce(v.visitantes, 0)::int as visitantes,
              coalesce(c.conversas, 0)::int as conversas, coalesce(c.conversas_meta, 0)::int as conversas_meta,
              coalesce(g.investimento, 0)::float8 as investimento
       from dias d
       left join (
         select ${diaSP("e.ts")} as dia, count(distinct e.sessao) as visitas, count(distinct e.visitante) as visitantes
         from {s}.eventos e where e.nome = 'page_view' and ${faixa("e.ts")} and ${condEventos(f, p)}
         group by 1
       ) v on v.dia = d.dia
       left join (
         select ${diaSP("l.criado_em")} as dia, count(*) as conversas, count(*) filter (where l.fonte = 'Meta Ads') as conversas_meta
         from {s}.leads l where ${faixa("l.criado_em")} and ${condLeads(f, p)}
         group by 1
       ) c on c.dia = d.dia
       left join (
         select a.dia, sum(a.gasto) as investimento
         from {s}.anuncios_diario a where a.dia between ${de}::date and ${ate}::date and ${condGasto(f, p)}
         group by 1
       ) g on g.dia = d.dia
       order by d.dia`,
      p,
    );
    return rows.map((r) => ({
      dia: r.dia,
      visitas: r.visitas,
      visitantes: r.visitantes,
      conversas: r.conversas,
      conversasMeta: r.conversas_meta,
      investimento: r.investimento,
    }));
  }

  /** Visitantes (eventos) e conversas (leads) por uma dimensão, com o filtro dela ignorado. */
  async function porDimensao(
    f: Filtros,
    colunaEvento: string,
    colunaLead: string | null,
    chave: ChaveFiltro | null,
    limite = 50,
  ): Promise<Fatia[]> {
    const ignorar = chave ? [chave] : [];
    const pe = new Params();
    const pl = new Params();
    const [ev, ld] = await Promise.all([
      q<{ chave: string; visitantes: number }>(
        `select coalesce(${colunaEvento}, '') as chave, count(distinct e.visitante)::int as visitantes
         from {s}.eventos e where e.nome = 'page_view' and ${noPeriodo("e.ts", f.de, f.ate, pe)} and ${condEventos(f, pe, "e", ignorar)}
         group by 1`,
        pe,
      ),
      colunaLead
        ? q<{ chave: string; conversas: number }>(
            `select coalesce(${colunaLead}, '') as chave, count(*)::int as conversas
             from {s}.leads l where ${noPeriodo("l.criado_em", f.de, f.ate, pl)} and ${condLeads(f, pl, "l", ignorar)}
             group by 1`,
            pl,
          )
        : Promise.resolve([] as { chave: string; conversas: number }[]),
    ]);
    const mapa = new Map<string, Fatia>();
    for (const r of ev) mapa.set(r.chave, { chave: r.chave, visitantes: r.visitantes, conversas: 0 });
    for (const r of ld) {
      const atual = mapa.get(r.chave) ?? { chave: r.chave, visitantes: 0, conversas: 0 };
      atual.conversas = r.conversas;
      mapa.set(r.chave, atual);
    }
    return [...mapa.values()].sort((a, b) => b.visitantes - a.visitantes || b.conversas - a.conversas).slice(0, limite);
  }

  async function porOrigem(f: Filtros) {
    const p = new Params();
    return q<{ origem: string; conversas: number; clientes: number }>(
      `select coalesce(l.origem, '') as origem, count(*)::int as conversas, count(*) filter (where l.status = 'fechou')::int as clientes
       from {s}.leads l where ${noPeriodo("l.criado_em", f.de, f.ate, p)} and ${condLeads(f, p, "l", ["origem"])}
       group by 1 order by 2 desc`,
      p,
    );
  }

  async function mapaDeCalor(f: Filtros): Promise<Celula[]> {
    const p = new Params();
    return q<Celula>(
      `select ${dowSP("l.criado_em")} as dow, ${horaSP("l.criado_em")} as hora, count(*)::int as conversas
       from {s}.leads l where ${noPeriodo("l.criado_em", f.de, f.ate, p)} and ${condLeads(f, p)}
       group by 1, 2`,
      p,
    );
  }

  async function visaoGeral(f: Filtros) {
    const [atual, anterior, serie, serieAnterior, origens, fontes, dispositivos, cidades, calor] = await Promise.all([
      kpis(f, f.de, f.ate),
      kpis(f, f.anteriorDe, f.anteriorAte),
      serieDiaria(f),
      serieDiaria({ ...f, de: f.anteriorDe, ate: f.anteriorAte }),
      porOrigem(f),
      porDimensao(f, "e.fonte", "l.fonte", "fonte"),
      porDimensao(f, "e.dispositivo", "l.dispositivo", "dispositivo"),
      porDimensao(f, "e.cidade", "l.cidade", null, 8),
      mapaDeCalor(f),
    ]);
    return { atual, anterior, serie, serieAnterior, origens, fontes, dispositivos, cidades, calor };
  }

  // ── Campanhas ──────────────────────────────────────────────────────────────

  type LinhaMeta = {
    campanha_id: string;
    campanha_nome: string;
    adset_id: string;
    adset_nome: string;
    ad_id: string;
    ad_nome: string;
    gasto: number;
    impressoes: number;
    alcance: number;
    cliques: number;
    cliques_link: number;
  };
  type LinhaSite = {
    campanha: string;
    conjunto: string;
    anuncio: string;
    utm_id: string | null;
    ad_id: string | null;
    adset_id: string | null;
    visitantes: number;
    leram: number;
    conversas: number;
    atendidas: number;
    clientes: number;
    receita: number;
  };

  async function campanhas(f: Filtros) {
    const pm = new Params();
    const pe = new Params();
    const pl = new Params();
    const pd = new Params();
    const [meta, ev, ld, gastoDia, conversasDia, atual, anterior] = await Promise.all([
      q<LinhaMeta>(
        `select a.campanha_id, max(a.campanha_nome) as campanha_nome, a.adset_id, max(a.adset_nome) as adset_nome,
                a.ad_id, max(a.ad_nome) as ad_nome,
                sum(a.gasto)::float8 as gasto, sum(a.impressoes)::int as impressoes, sum(a.alcance)::int as alcance,
                sum(a.cliques)::int as cliques, sum(a.cliques_link)::int as cliques_link
         from {s}.anuncios_diario a
         where a.dia between ${pm.add(f.de)}::date and ${pm.add(f.ate)}::date and ${condGasto(f, pm, "a", ["campanha"])}
         group by a.campanha_id, a.adset_id, a.ad_id`,
        pm,
      ),
      q<{ campanha: string; conjunto: string; anuncio: string; utm_id: string | null; ad_id: string | null; adset_id: string | null; visitantes: number; leram: number }>(
        `select coalesce(e.utm_campaign, e.utm_id) as campanha, coalesce(e.utm_term, e.adset_id, '') as conjunto,
                coalesce(e.utm_content, e.ad_id, '') as anuncio,
                max(e.utm_id) as utm_id, max(e.ad_id) as ad_id, max(e.adset_id) as adset_id,
                count(distinct e.visitante) filter (where e.nome = 'page_view')::int as visitantes,
                count(distinct e.visitante) filter (where e.nome = 'checklist_lido')::int as leram
         from {s}.eventos e
         where coalesce(e.utm_campaign, e.utm_id) is not null and ${noPeriodo("e.ts", f.de, f.ate, pe)} and ${condEventos(f, pe, "e", ["campanha"])}
         group by 1, 2, 3`,
        pe,
      ),
      q<{ campanha: string; conjunto: string; anuncio: string; utm_id: string | null; ad_id: string | null; adset_id: string | null; conversas: number; atendidas: number; clientes: number; receita: number }>(
        `select coalesce(l.utm_campaign, l.utm_id) as campanha, coalesce(l.utm_term, l.adset_id, '') as conjunto,
                coalesce(l.utm_content, l.ad_id, '') as anuncio,
                max(l.utm_id) as utm_id, max(l.ad_id) as ad_id, max(l.adset_id) as adset_id,
                count(*)::int as conversas, count(*) filter (where l.status <> 'nova')::int as atendidas,
                count(*) filter (where l.status = 'fechou')::int as clientes,
                coalesce(sum(l.valor) filter (where l.status = 'fechou'), 0)::float8 as receita
         from {s}.leads l
         where coalesce(l.utm_campaign, l.utm_id) is not null and ${noPeriodo("l.criado_em", f.de, f.ate, pl)} and ${condLeads(f, pl, "l", ["campanha"])}
         group by 1, 2, 3`,
        pl,
      ),
      q<{ dia: string; campanha: string; gasto: number }>(
        `select to_char(a.dia, 'YYYY-MM-DD') as dia, max(a.campanha_nome) as campanha, sum(a.gasto)::float8 as gasto
         from {s}.anuncios_diario a
         where a.dia between ${pd.add(f.de)}::date and ${pd.add(f.ate)}::date and ${condGasto(f, pd, "a", ["campanha"])}
         group by a.dia, a.campanha_id`,
        pd,
      ),
      (async () => {
        const p = new Params();
        return q<{ dia: string; campanha: string; conversas: number }>(
          `select to_char(${diaSP("l.criado_em")}, 'YYYY-MM-DD') as dia, coalesce(l.utm_campaign, l.utm_id) as campanha, count(*)::int as conversas
           from {s}.leads l
           where coalesce(l.utm_campaign, l.utm_id) is not null and ${noPeriodo("l.criado_em", f.de, f.ate, p)} and ${condLeads(f, p, "l", ["campanha"])}
           group by 1, 2`,
          p,
        );
      })(),
      kpis(f, f.de, f.ate),
      kpis(f, f.anteriorDe, f.anteriorAte),
    ]);

    const site: LinhaSite[] = [];
    const chaveSite = (r: { campanha: string; conjunto: string; anuncio: string }) => `${r.campanha}\u0000${r.conjunto}\u0000${r.anuncio}`;
    const indice = new Map<string, LinhaSite>();
    for (const r of ev) {
      const linha: LinhaSite = { ...r, conversas: 0, atendidas: 0, clientes: 0, receita: 0 };
      indice.set(chaveSite(r), linha);
      site.push(linha);
    }
    for (const r of ld) {
      const atualLinha = indice.get(chaveSite(r));
      if (atualLinha) {
        Object.assign(atualLinha, { conversas: r.conversas, atendidas: r.atendidas, clientes: r.clientes, receita: r.receita });
        atualLinha.utm_id ??= r.utm_id;
        atualLinha.ad_id ??= r.ad_id;
      } else {
        const linha: LinhaSite = { ...r, visitantes: 0, leram: 0 };
        indice.set(chaveSite(r), linha);
        site.push(linha);
      }
    }

    return { arvore: montarArvore(meta, site), gastoDia, conversasDia, atual, anterior };
  }

  // ── Comportamento na página ─────────────────────────────────────────────────

  async function comportamento(f: Filtros) {
    const contar = async <T>(sql: (p: Params) => string) => {
      const p = new Params();
      return q<T>(sql(p), p);
    };
    const filtroEv = (p: Params, a = "e") => `${noPeriodo(`${a}.ts`, f.de, f.ate, p)} and ${condEventos(f, p, a)}`;

    const [base, secoes, itens, faq, engajamento, interacoes, contatos, variantesEv, variantesLd, navegadores, novos] = await Promise.all([
      contar<{ visitas: number; visitantes: number }>(
        (p) => `select count(distinct e.sessao)::int as visitas, count(distinct e.visitante)::int as visitantes
                from {s}.eventos e where e.nome = 'page_view' and ${filtroEv(p)}`,
      ),
      contar<{ secao: string; sessoes: number }>(
        (p) => `select e.props->>'secao' as secao, count(distinct e.sessao)::int as sessoes
                from {s}.eventos e where e.nome = 'secao_vista' and ${filtroEv(p)} group by 1`,
      ),
      contar<{ item: string; sessoes: number }>(
        (p) => `select e.props->>'item' as item, count(distinct e.sessao)::int as sessoes
                from {s}.eventos e where e.nome = 'checklist_marcado' and (e.props->>'marcado') = 'true' and ${filtroEv(p)}
                group by 1 order by 2 desc`,
      ),
      contar<{ pergunta: string; aberturas: number }>(
        (p) => `select e.props->>'pergunta' as pergunta, count(*)::int as aberturas
                from {s}.eventos e where e.nome = 'faq_aberta' and ${filtroEv(p)} group by 1 order by 2 desc limit 12`,
      ),
      contar<{ faixa: string; sessoes: number }>(
        (p) => `with s as (
                  select e.sessao from {s}.eventos e where e.nome = 'page_view' and ${filtroEv(p)} group by e.sessao
                ), eng as (
                  select e.sessao, max((e.props->>'segundos')::int) as seg
                  from {s}.eventos e where e.nome = 'engajamento' and e.sessao in (select sessao from s) group by e.sessao
                )
                select case when eng.seg is null then '0' when eng.seg < 30 then '15' when eng.seg < 60 then '30'
                            when eng.seg < 120 then '60' when eng.seg < 300 then '120' else '300' end as faixa,
                       count(*)::int as sessoes
                from s left join eng on eng.sessao = s.sessao group by 1`,
      ),
      contar<{ nome: string; sessoes: number }>(
        (p) => `select e.nome, count(distinct e.sessao)::int as sessoes
                from {s}.eventos e
                where e.nome in ('scroll_50', 'scroll_90', 'checklist_lido', 'comparador_usado', 'autodiagnostico_click', 'navegacao_click', 'whatsapp_click')
                  and ${filtroEv(p)}
                group by 1`,
      ),
      contar<{ canal: string; cliques: number }>(
        (p) => `select coalesce(e.props->>'canal', '') as canal, count(*)::int as cliques
                from {s}.eventos e where e.nome = 'contato_click' and ${filtroEv(p)} group by 1`,
      ),
      contar<{ pagina: string; visitantes: number }>(
        (p) => `select e.pagina, count(distinct e.visitante)::int as visitantes
                from {s}.eventos e where e.nome = 'page_view' and ${noPeriodo("e.ts", f.de, f.ate, p)} and ${condEventos(f, p, "e", ["pagina"])}
                group by 1`,
      ),
      contar<{ pagina: string; conversas: number }>(
        (p) => `select l.pagina, count(*)::int as conversas
                from {s}.leads l where ${noPeriodo("l.criado_em", f.de, f.ate, p)} and ${condLeads(f, p, "l", ["pagina"])}
                group by 1`,
      ),
      contar<{ navegador: string; visitantes: number; conversas: number }>(
        (p) => `select coalesce(e.navegador, 'outro') as navegador,
                       count(distinct e.visitante) filter (where e.nome = 'page_view')::int as visitantes,
                       count(distinct e.visitante) filter (where e.nome = 'whatsapp_click')::int as conversas
                from {s}.eventos e where ${filtroEv(p)} group by 1 order by 2 desc`,
      ),
      contar<{ novo: boolean | null; sessoes: number; conversas: number }>(
        (p) => `select e.novo, count(distinct e.sessao) filter (where e.nome = 'page_view')::int as sessoes,
                       count(distinct e.sessao) filter (where e.nome = 'whatsapp_click')::int as conversas
                from {s}.eventos e where ${filtroEv(p)} group by 1`,
      ),
    ]);

    const textos = new Map<string, string>();
    for (const pagina of [paginaRegularizacao, paginaGeorreferenciamento]) {
      for (const item of pagina.checklist.itens) textos.set(item.id, item.texto);
    }

    const visitas = base[0]?.visitas ?? 0;
    const secaoMap = new Map(secoes.map((s) => [s.secao, s.sessoes]));
    const interacaoMap = new Map(interacoes.map((i) => [i.nome, i.sessoes]));

    const conversasPorPagina = new Map(variantesLd.map((v) => [v.pagina, v.conversas]));
    const variantes = variantesEv
      .filter((v) => v.pagina)
      .map((v) => ({ pagina: v.pagina, visitantes: v.visitantes, conversas: conversasPorPagina.get(v.pagina) ?? 0 }))
      .sort((a, b) => a.pagina.localeCompare(b.pagina));

    return {
      visitas,
      visitantes: base[0]?.visitantes ?? 0,
      secoes: SECOES.map((s) => ({ id: s.id, nome: s.nome, sessoes: secaoMap.get(s.id) ?? 0 })),
      itens: itens.map((i) => ({ id: i.item, texto: textos.get(i.item) ?? i.item, sessoes: i.sessoes })),
      faq,
      engajamento: ["0", "15", "30", "60", "120", "300"].map((faixa) => ({
        faixa,
        sessoes: engajamento.find((e) => e.faixa === faixa)?.sessoes ?? 0,
      })),
      interacoes: {
        rolou50: interacaoMap.get("scroll_50") ?? 0,
        rolou90: interacaoMap.get("scroll_90") ?? 0,
        leuChecklist: interacaoMap.get("checklist_lido") ?? 0,
        usouComparador: interacaoMap.get("comparador_usado") ?? 0,
        autodiagnostico: interacaoMap.get("autodiagnostico_click") ?? 0,
        navegou: interacaoMap.get("navegacao_click") ?? 0,
        whatsapp: interacaoMap.get("whatsapp_click") ?? 0,
      },
      contatos,
      variantes,
      navegadores,
      novos: {
        novos: novos.find((n) => n.novo === true) ?? { sessoes: 0, conversas: 0 },
        recorrentes: novos.find((n) => n.novo === false) ?? { sessoes: 0, conversas: 0 },
      },
    };
  }

  // ── Leads ──────────────────────────────────────────────────────────────────

  async function leads(f: Filtros, busca: string | null) {
    const p = new Params();
    const onde = busca
      ? `(l.codigo ilike ${p.add(`%${busca}%`)} or coalesce(l.nome, '') ilike $1 or coalesce(l.notas, '') ilike $1)`
      : `${noPeriodo("l.criado_em", f.de, f.ate, p)} and ${condLeads(f, p)}`;
    const linhas = await q<LinhaLead>(
      `select l.codigo, l.criado_em::text as criado_em, l.ultimo_contato::text as ultimo_contato, l.atualizado_em::text as atualizado_em,
              l.status, l.valor::float8 as valor, l.servico, l.nome, l.notas, l.manual, l.origem, l.pagina, l.fonte,
              l.utm_campaign, l.utm_term, l.utm_content, l.dispositivo, l.cidade
       from {s}.leads l where ${onde}
       order by l.criado_em desc limit 400`,
      p,
    );
    return linhas.map(normalizarLead);
  }

  /** Contagem e valor por andamento (período e filtros), sem o limite da lista. */
  async function resumoLeads(f: Filtros) {
    const p = new Params();
    return q<{ status: string; n: number; valor: number }>(
      `select l.status, count(*)::int as n, coalesce(sum(l.valor), 0)::float8 as valor
       from {s}.leads l where ${noPeriodo("l.criado_em", f.de, f.ate, p)} and ${condLeads(f, p)}
       group by 1`,
      p,
    );
  }

  async function lead(codigo: string) {
    const p = new Params();
    const [linha] = await q<LinhaLead>(
      `select l.codigo, l.criado_em::text as criado_em, l.ultimo_contato::text as ultimo_contato, l.atualizado_em::text as atualizado_em,
              l.status, l.valor::float8 as valor, l.servico, l.nome, l.notas, l.manual, l.origem, l.pagina, l.fonte,
              l.utm_campaign, l.utm_term, l.utm_content, l.dispositivo, l.cidade
       from {s}.leads l where l.codigo = ${p.add(codigo)}`,
      p,
    );
    if (!linha) return null;
    const pe = new Params();
    const eventos = await q<{ nome: string; ts: string; pagina: string | null; origem: string | null; props: Record<string, unknown>; fonte: string | null; utm_campaign: string | null; utm_content: string | null; dispositivo: string | null; navegador: string | null; cidade: string | null; sessao: string | null }>(
      `select e.nome, e.ts::text as ts, e.pagina, e.origem, e.props, e.fonte, e.utm_campaign, e.utm_content,
              e.dispositivo, e.navegador, e.cidade, e.sessao
       from {s}.eventos e where e.visitante = ${pe.add(codigo)}
       order by e.ts asc limit 600`,
      pe,
    );
    return { lead: normalizarLead(linha), eventos: eventos.map((e) => ({ ...e, ts: isoDe(e.ts) })) };
  }

  async function opcoes(f: Filtros) {
    const pe = new Params();
    const pm = new Params();
    const [fontes, campanhasSite, campanhasMeta] = await Promise.all([
      q<{ v: string }>(
        `select distinct coalesce(e.fonte, 'Direto') as v from {s}.eventos e
         where e.nome = 'page_view' and ${noPeriodo("e.ts", somarDias(f.de, -60), f.ate, pe)} order by 1`,
        pe,
      ),
      (async () => {
        const p = new Params();
        return q<{ v: string }>(
          `select distinct coalesce(e.utm_campaign, e.utm_id) as v from {s}.eventos e
           where coalesce(e.utm_campaign, e.utm_id) is not null and ${noPeriodo("e.ts", somarDias(f.de, -60), f.ate, p)} order by 1`,
          p,
        );
      })(),
      q<{ v: string }>(
        `select distinct a.campanha_nome as v from {s}.anuncios_diario a
         where a.campanha_nome is not null and a.dia between ${pm.add(somarDias(f.de, -60))}::date and ${pm.add(f.ate)}::date order by 1`,
        pm,
      ),
    ]);
    const campanhasLista = [...new Set([...campanhasMeta.map((c) => c.v), ...campanhasSite.map((c) => c.v)])].sort((a, b) => a.localeCompare(b));
    return { fontes: fontes.map((x) => x.v), campanhas: campanhasLista };
  }

  async function estado() {
    const p = new Params();
    const [ev, ld, ad, sync] = await Promise.all([
      q<{ total: number; ultimo: string | null }>(`select count(*)::int as total, max(ts)::text as ultimo from {s}.eventos`, p),
      q<{ total: number }>(`select count(*)::int as total from {s}.leads`, p),
      q<{ total: number; ultimo: string | null }>(`select count(*)::int as total, max(dia)::text as ultimo from {s}.anuncios_diario`, p),
      q<{ fonte: string; executado_em: string | null; ok: boolean | null; mensagem: string | null; linhas: number | null }>(
        `select fonte, executado_em::text as executado_em, ok, mensagem, linhas from {s}.sincronizacao`,
        p,
      ),
    ]);
    return {
      eventos: ev[0]?.total ?? 0,
      ultimoEvento: isoDe(ev[0]?.ultimo ?? null),
      leads: ld[0]?.total ?? 0,
      linhasAnuncios: ad[0]?.total ?? 0,
      ultimoDiaAnuncios: ad[0]?.ultimo ?? null,
      sincronizacoes: sync.map((s) => ({ ...s, executado_em: isoDe(s.executado_em) })),
    };
  }

  return { visaoGeral, campanhas, comportamento, leads, resumoLeads, lead, opcoes, estado, serieDiaria };
}

// ── Árvore campanha › conjunto › anúncio ──────────────────────────────────────

export type Metricas = {
  gasto: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  cliquesLink: number;
  visitantes: number;
  leram: number;
  conversas: number;
  atendidas: number;
  clientes: number;
  receita: number;
};

export type NoCampanha = Metricas & {
  id: string;
  nome: string;
  nivel: "campanha" | "conjunto" | "anuncio";
  meta: boolean;
  filhos: NoCampanha[];
};

const zero = (): Metricas => ({ gasto: 0, impressoes: 0, alcance: 0, cliques: 0, cliquesLink: 0, visitantes: 0, leram: 0, conversas: 0, atendidas: 0, clientes: 0, receita: 0 });
const CHAVES_METRICAS = Object.keys(zero()) as (keyof Metricas)[];

/** Soma só as métricas: o nó também tem id, nome e a lista de filhos, que não entram na conta. */
function somar(alvo: Metricas, m: Partial<Metricas>) {
  for (const k of CHAVES_METRICAS) alvo[k] += m[k] ?? 0;
}

function montarArvore(
  meta: {
    campanha_id: string;
    campanha_nome: string;
    adset_id: string;
    adset_nome: string;
    ad_id: string;
    ad_nome: string;
    gasto: number;
    impressoes: number;
    alcance: number;
    cliques: number;
    cliques_link: number;
  }[],
  site: { campanha: string; conjunto: string; anuncio: string; utm_id: string | null; ad_id: string | null; adset_id: string | null; visitantes: number; leram: number; conversas: number; atendidas: number; clientes: number; receita: number }[],
): NoCampanha[] {
  const campanhas = new Map<string, NoCampanha>();
  const no = (id: string, nome: string, nivel: NoCampanha["nivel"], ehMeta: boolean): NoCampanha => ({ ...zero(), id, nome, nivel, meta: ehMeta, filhos: [] });
  const filho = (pai: NoCampanha, id: string, nome: string, nivel: NoCampanha["nivel"], ehMeta: boolean) => {
    let n = pai.filhos.find((f) => f.id === id);
    if (!n) {
      n = no(id, nome, nivel, ehMeta);
      pai.filhos.push(n);
    }
    return n;
  };

  // 1. Estrutura e entrega vindas da Meta.
  for (const m of meta) {
    let c = campanhas.get(m.campanha_id);
    if (!c) {
      c = no(m.campanha_id, m.campanha_nome || m.campanha_id, "campanha", true);
      campanhas.set(m.campanha_id, c);
    }
    const conj = filho(c, m.adset_id, m.adset_nome || m.adset_id, "conjunto", true);
    const ad = filho(conj, m.ad_id, m.ad_nome || m.ad_id, "anuncio", true);
    const entrega = { gasto: m.gasto, impressoes: m.impressoes, alcance: m.alcance, cliques: m.cliques, cliquesLink: m.cliques_link };
    somar(ad, entrega);
    somar(conj, entrega);
    somar(c, entrega);
  }

  // 2. Resultado no site, casado pelo id do anúncio (jv_ad) ou pelo nome (utm_content).
  for (const s of site) {
    const resultado = { visitantes: s.visitantes, leram: s.leram, conversas: s.conversas, atendidas: s.atendidas, clientes: s.clientes, receita: s.receita };
    const campanha =
      [...campanhas.values()].find((c) => c.meta && (c.id === s.utm_id || c.nome === s.campanha || c.id === s.campanha)) ??
      (() => {
        const chave = `utm:${s.campanha}`;
        let c = campanhas.get(chave);
        if (!c) {
          c = no(chave, s.campanha, "campanha", false);
          campanhas.set(chave, c);
        }
        return c;
      })();

    let ad: NoCampanha | undefined;
    let conjunto: NoCampanha | undefined;
    for (const conj of campanha.filhos) {
      const achado = conj.filhos.find((a) => (s.ad_id && a.id === s.ad_id) || (s.anuncio && a.nome === s.anuncio));
      if (achado) {
        ad = achado;
        conjunto = conj;
        break;
      }
    }
    if (!ad || !conjunto) {
      conjunto =
        campanha.filhos.find((c) => (s.adset_id && c.id === s.adset_id) || (s.conjunto && c.nome === s.conjunto)) ??
        filho(campanha, `utm:${s.conjunto || "sem-conjunto"}`, s.conjunto || "Sem conjunto informado", "conjunto", false);
      ad = filho(conjunto, `utm:${s.anuncio || "sem-anuncio"}`, s.anuncio || "Sem anúncio informado", "anuncio", false);
    }
    somar(ad, resultado);
    somar(conjunto, resultado);
    somar(campanha, resultado);
  }

  const ordenar = (lista: NoCampanha[]) => {
    lista.sort((a, b) => b.gasto - a.gasto || b.conversas - a.conversas);
    for (const n of lista) ordenar(n.filhos);
    return lista;
  };
  return ordenar([...campanhas.values()]);
}

// ── Leads ─────────────────────────────────────────────────────────────────────

type LinhaLead = {
  codigo: string;
  criado_em: string;
  ultimo_contato: string | null;
  atualizado_em: string | null;
  status: string;
  valor: number | null;
  servico: string | null;
  nome: string | null;
  notas: string | null;
  manual: boolean;
  origem: string | null;
  pagina: string | null;
  fonte: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  dispositivo: string | null;
  cidade: string | null;
};

export type Lead = ReturnType<typeof normalizarLead>;

/** Datas como ISO (o texto do Postgres varia entre drivers). */
function isoDe(texto: string | null) {
  if (!texto) return null;
  const d = new Date(texto.includes("T") ? texto : texto.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
  return Number.isNaN(d.getTime()) ? texto : d.toISOString();
}

function normalizarLead(l: LinhaLead) {
  return {
    ...l,
    criado_em: isoDe(l.criado_em) ?? l.criado_em,
    ultimo_contato: isoDe(l.ultimo_contato),
    atualizado_em: isoDe(l.atualizado_em),
    valor: l.valor === null ? null : Number(l.valor),
  };
}
