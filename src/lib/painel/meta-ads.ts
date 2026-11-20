/**
 * Sincronização com a API de Marketing da Meta (Insights): gasto, impressões, alcance e cliques de
 * cada anúncio, dia a dia. Precisa de META_ADS_TOKEN (token de usuário do sistema com ads_read) e
 * META_AD_ACCOUNT_ID (com ou sem o prefixo act_). Reprocessa os últimos dias a cada execução, porque
 * a Meta ainda ajusta números de dias recentes.
 */
import type { Banco } from "@/lib/db";
import { hojeSP, somarDias } from "./filtros";

type LinhaInsights = {
  date_start: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  inline_link_clicks?: string;
};

export function metaConfigurada() {
  return Boolean(process.env.META_ADS_TOKEN && process.env.META_AD_ACCOUNT_ID);
}

export async function sincronizarMeta(banco: Banco, dias = 35) {
  const token = process.env.META_ADS_TOKEN;
  const contaBruta = process.env.META_AD_ACCOUNT_ID;
  if (!token || !contaBruta) {
    return registrar(banco, false, "Faltam META_ADS_TOKEN e META_AD_ACCOUNT_ID nas variáveis de ambiente.", 0);
  }
  const conta = contaBruta.replace(/^act_/, "").trim();
  const versao = process.env.META_GRAPH_VERSION ?? "v24.0";
  const ate = hojeSP();
  const desde = somarDias(ate, -(dias - 1));

  const params = new URLSearchParams({
    level: "ad",
    time_increment: "1",
    fields: "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,clicks,inline_link_clicks",
    time_range: JSON.stringify({ since: desde, until: ate }),
    limit: "500",
    access_token: token,
  });
  let url: string | null = `https://graph.facebook.com/${versao}/act_${conta}/insights?${params}`;
  const linhas: LinhaInsights[] = [];

  try {
    for (let pagina = 0; url && pagina < 40; pagina++) {
      const res: Response = await fetch(url, { cache: "no-store" });
      const corpo = (await res.json()) as { data?: LinhaInsights[]; paging?: { next?: string }; error?: { message?: string } };
      if (!res.ok || corpo.error) {
        return registrar(banco, false, `A Meta recusou: ${corpo.error?.message ?? res.status}`, 0);
      }
      linhas.push(...(corpo.data ?? []));
      url = corpo.paging?.next ?? null;
    }
  } catch (erro) {
    return registrar(banco, false, `Falha de conexão com a Meta: ${(erro as Error).message}`, 0);
  }

  const registros = linhas
    .filter((l) => l.ad_id)
    .map((l) => ({
      dia: l.date_start,
      ad_id: l.ad_id,
      ad_nome: l.ad_name ?? null,
      adset_id: l.adset_id ?? null,
      adset_nome: l.adset_name ?? null,
      campanha_id: l.campaign_id ?? null,
      campanha_nome: l.campaign_name ?? null,
      gasto: Number(l.spend ?? 0),
      impressoes: Number(l.impressions ?? 0),
      alcance: Number(l.reach ?? 0),
      cliques: Number(l.clicks ?? 0),
      cliques_link: Number(l.inline_link_clicks ?? 0),
    }));

  // Substitui a janela inteira: anúncio que zerou um dia some do resultado da Meta e também daqui.
  await banco.query(`delete from public.anuncios_diario where dia between $1::date and $2::date`, [desde, ate]);
  for (let i = 0; i < registros.length; i += 1000) {
    await banco.query(
      `insert into public.anuncios_diario (dia, ad_id, ad_nome, adset_id, adset_nome, campanha_id, campanha_nome, gasto, impressoes, alcance, cliques, cliques_link)
       select dia, ad_id, ad_nome, adset_id, adset_nome, campanha_id, campanha_nome, gasto, impressoes, alcance, cliques, cliques_link
       from jsonb_to_recordset($1::jsonb) as t(dia date, ad_id text, ad_nome text, adset_id text, adset_nome text, campanha_id text,
         campanha_nome text, gasto numeric, impressoes int, alcance int, cliques int, cliques_link int)
       on conflict (dia, ad_id) do update set ad_nome = excluded.ad_nome, adset_id = excluded.adset_id, adset_nome = excluded.adset_nome,
         campanha_id = excluded.campanha_id, campanha_nome = excluded.campanha_nome, gasto = excluded.gasto,
         impressoes = excluded.impressoes, alcance = excluded.alcance, cliques = excluded.cliques, cliques_link = excluded.cliques_link`,
      [JSON.stringify(registros.slice(i, i + 1000))],
    );
  }
  return registrar(banco, true, `${registros.length} linhas de ${desde} a ${ate}.`, registros.length);
}

async function registrar(banco: Banco, ok: boolean, mensagem: string, linhas: number) {
  await banco.query(
    `insert into public.sincronizacao (fonte, executado_em, ok, mensagem, linhas) values ('meta', now(), $1, $2, $3)
     on conflict (fonte) do update set executado_em = excluded.executado_em, ok = excluded.ok, mensagem = excluded.mensagem, linhas = excluded.linhas`,
    [ok, mensagem, linhas],
  );
  return { ok, mensagem, linhas };
}
