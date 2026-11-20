import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BarraFiltros } from "@/components/painel/BarraFiltros";
import { BarraSegmentada, Cartao, EstadoVazio, Kpi } from "@/components/painel/blocos";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { EsqueletoPainel, SemBanco } from "@/components/painel/estados";
import { IconeBusca, IconeMais } from "@/components/painel/icones";
import { QuadroLeads } from "@/components/painel/QuadroLeads";
import { ESTILO_STATUS } from "@/components/painel/StatusLead";
import { AreaDados } from "@/components/painel/Transicao";
import { contextoPainel } from "@/lib/painel/contexto";
import { lerFiltros } from "@/lib/painel/filtros";
import { dividir, moeda, num, pct, periodoTexto, STATUS_LEAD } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Leads" };

export default function Leads({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <Suspense fallback={<EsqueletoPainel />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/admin/leads">["searchParams"] }) {
  const sp = await searchParams;
  const ctx = await contextoPainel();
  if (!ctx.consultas) return <SemBanco erro={ctx.erro} />;
  const f = lerFiltros(sp);
  const busca = typeof sp.busca === "string" && sp.busca.trim() ? sp.busca.trim().slice(0, 60) : null;
  const [leads, resumo, opcoes] = await Promise.all([ctx.consultas.leads(f, busca), ctx.consultas.resumoLeads(f), ctx.consultas.opcoes(f)]);

  const contar = (status: string) => resumo.find((r) => r.status === status)?.n ?? 0;
  const total = resumo.reduce((s, r) => s + r.n, 0);
  const fechou = contar("fechou");
  const perdeu = contar("perdeu");
  const receita = resumo.find((r) => r.status === "fechou")?.valor ?? 0;
  const emAberto = contar("nova") + contar("atendimento") + contar("proposta");
  const emProposta = resumo.find((r) => r.status === "proposta")?.valor ?? 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Leads"
        descricao={busca ? <>Busca por “{busca}” em todos os períodos</> : <>Conversas iniciadas · {periodoTexto(f.de, f.ate)}</>}
        acoes={
          <>
            <form action="/admin/leads" className="relative" role="search">
              <label className="sr-only" htmlFor="busca-lead">
                Buscar lead por código, nome ou anotação
              </label>
              <IconeBusca className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-[#6b7688]" />
              <input
                id="busca-lead"
                name="busca"
                defaultValue={busca ?? ""}
                placeholder="Código JV-…, nome ou anotação"
                className="min-h-11 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#d5dce6] bg-white pl-10 pr-3 text-[0.875rem] text-[#0a1f3f]"
              />
            </form>
            <Link href="/admin/leads/novo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#002448] px-4 text-[0.875rem] font-semibold text-white hover:bg-[#0a3262]">
              <IconeMais className="size-[18px]" />
              Novo lead
            </Link>
          </>
        }
      />
      {!busca && <BarraFiltros filtros={f} opcoes={opcoes} />}

      <AreaDados className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {busca && (
          <p className="text-[0.875rem] text-[#4a5870]">
            {leads.length} {leads.length === 1 ? "resultado" : "resultados"}.{" "}
            <Link href="/admin/leads" className="font-semibold text-[#1c5cab] underline underline-offset-4">
              Limpar busca
            </Link>
          </p>
        )}

        {!busca && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              <Kpi rotulo="Conversas" valor={num(total)} nota="Iniciadas no período" />
              <Kpi rotulo="Em aberto" valor={num(emAberto)} nota={emProposta ? `${moeda(emProposta, false)} em propostas` : "Aguardando andamento"} />
              <Kpi rotulo="Fecharam" valor={num(fechou)} nota={`${pct(dividir(fechou, total))} das conversas`} />
              <Kpi rotulo="Taxa de fechamento" valor={pct(dividir(fechou, fechou + perdeu), 0)} nota="Entre os que já decidiram" dica="Fecharam ÷ (fecharam + não fecharam)." />
              <Kpi rotulo="Receita" valor={moeda(receita, false)} nota="Valor dos contratos fechados" />
              <Kpi rotulo="Ticket médio" valor={moeda(dividir(receita, fechou), false)} nota="Por contrato fechado" />
            </div>

            <Cartao titulo="Andamento das conversas do período">
              <BarraSegmentada
                rotulo="Leads por andamento"
                partes={STATUS_LEAD.map((s) => ({
                  nome: s.nome,
                  valor: contar(s.id),
                  cor: ESTILO_STATUS[s.id].cor,
                }))}
              />
            </Cartao>
          </>
        )}

        <Cartao titulo={busca ? "Resultados" : "Quadro de leads"} subtitulo="Abra o lead para marcar o andamento, o serviço e o valor do contrato.">
          {leads.length ? (
            <QuadroLeads leads={leads} />
          ) : (
            <EstadoVazio texto={busca ? "Nenhum lead encontrado." : "Nenhuma conversa neste período. Os leads aparecem sozinhos quando alguém clica no WhatsApp do site."} />
          )}
        </Cartao>
      </AreaDados>
    </>
  );
}
