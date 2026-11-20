import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BarraFiltros } from "@/components/painel/BarraFiltros";
import { Cartao, EstadoVazio, Kpi } from "@/components/painel/blocos";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { CartaoGrafico } from "@/components/painel/CartaoGrafico";
import { EsqueletoPainel, SemBanco } from "@/components/painel/estados";
import { EmpilhadoPorCampanha, MatrizComFiltro } from "@/components/painel/graficos-filtro";
import { GraficoLinhas } from "@/components/painel/graficos";
import { TabelaCampanhas } from "@/components/painel/TabelaCampanhas";
import { AreaDados } from "@/components/painel/Transicao";
import type { NoCampanha } from "@/lib/painel/consultas";
import { contextoPainel } from "@/lib/painel/contexto";
import { diasEntre, lerFiltros, somarDias } from "@/lib/painel/filtros";
import { dividir, moeda, multiplo, num, numCompacto, pct, periodoTexto } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Campanhas" };

export default function Campanhas({ searchParams }: PageProps<"/admin/campanhas">) {
  return (
    <Suspense fallback={<EsqueletoPainel />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

/** Segunda-feira da semana do dia (as semanas do gráfico começam na segunda). */
function inicioDaSemana(dia: string) {
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay();
  return somarDias(dia, -((dow + 6) % 7));
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/admin/campanhas">["searchParams"] }) {
  const sp = await searchParams;
  const ctx = await contextoPainel();
  if (!ctx.consultas) return <SemBanco erro={ctx.erro} />;
  const f = lerFiltros(sp);
  const [d, opcoes] = await Promise.all([ctx.consultas.campanhas(f), ctx.consultas.opcoes(f)]);
  const { atual: a, anterior: b, arvore } = d;

  // Até 3 campanhas com cor; o resto vira "Outras" em cinza (cor segue a campanha, não a posição).
  const gastoPorCampanha = new Map<string, number>();
  for (const g of d.gastoDia) gastoPorCampanha.set(g.campanha, (gastoPorCampanha.get(g.campanha) ?? 0) + g.gasto);
  const principais = [...gastoPorCampanha.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([nome]) => nome);
  const dias = Array.from({ length: diasEntre(f.de, f.ate) }, (_, i) => somarDias(f.de, i));
  const valoresDe = (filtro: (campanha: string) => boolean) =>
    dias.map((dia) => d.gastoDia.filter((g) => g.dia === dia && filtro(g.campanha)).reduce((s, g) => s + g.gasto, 0));
  const seriesGasto: { nome: string; valores: number[]; contexto?: boolean }[] = [
    ...principais.map((nome) => ({ nome, valores: valoresDe((c) => c === nome) })),
    ...(gastoPorCampanha.size > 3 ? [{ nome: "Outras campanhas", valores: valoresDe((c) => !principais.includes(c)), contexto: true }] : []),
  ];

  // Custo por conversa por semana (ou por dia, em períodos curtos), das mesmas campanhas.
  const porSemana = f.dias > 21;
  const balde = (dia: string) => (porSemana ? inicioDaSemana(dia) : dia);
  const rotulos = [...new Set(dias.map(balde))];
  const seriesCpl = principais.map((nome) => ({
    nome,
    valores: rotulos.map((r) => {
      const gasto = d.gastoDia.filter((g) => g.campanha === nome && balde(g.dia) === r).reduce((s, g) => s + g.gasto, 0);
      const conv = d.conversasDia.filter((c) => c.campanha === nome && balde(c.dia) === r).reduce((s, c) => s + c.conversas, 0);
      return conv ? gasto / conv : null;
    }),
  }));

  const anuncios = arvore.flatMap((c) => c.filhos.flatMap((cj) => cj.filhos.map((ad) => ({ ad, campanha: c.nome }))));
  const pontos = anuncios
    .filter(({ ad }) => ad.gasto > 0 && ad.conversas > 0)
    .map(({ ad, campanha }) => ({ nome: ad.nome, campanha, gasto: ad.gasto, cpl: ad.gasto / ad.conversas, conversas: ad.conversas }));
  const semMeta = a.investimento === 0 && b.investimento === 0;

  return (
    <>
      <CabecalhoPagina titulo="Campanhas" descricao={<>Anúncios da Meta e campanhas com UTM · {periodoTexto(f.de, f.ate)}</>} />
      <BarraFiltros filtros={f} opcoes={opcoes} />

      <AreaDados className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {semMeta && (
          <EstadoVazio texto="Ainda não há dados de anúncios. Conecte a conta da Meta e marque os anúncios com os parâmetros de URL para ligar cada visita ao anúncio que a trouxe.">
            <Link href="/admin/configuracao" className="font-semibold text-[#1c5cab] underline underline-offset-4">
              Ver como conectar
            </Link>
          </EstadoVazio>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi rotulo="Investimento" valor={moeda(a.investimento, false)} atual={a.investimento} anterior={b.investimento} serie={dias.map((dia) => d.gastoDia.filter((g) => g.dia === dia).reduce((s, g) => s + g.gasto, 0))} />
          <Kpi rotulo="Impressões" valor={numCompacto(a.impressoes)} atual={a.impressoes} anterior={b.impressoes} />
          <Kpi rotulo="CPM" valor={moeda(dividir(a.investimento * 1000, a.impressoes))} atual={dividir(a.investimento * 1000, a.impressoes)} anterior={dividir(b.investimento * 1000, b.impressoes)} melhorSeSobe={false} dica="Custo por mil impressões." />
          <Kpi rotulo="CTR do link" valor={pct(dividir(a.cliquesLink, a.impressoes), 2)} atual={dividir(a.cliquesLink, a.impressoes)} anterior={dividir(b.cliquesLink, b.impressoes)} dica="Cliques no link a cada 100 impressões." />
          <Kpi rotulo="Custo por clique" valor={moeda(dividir(a.investimento, a.cliquesLink))} atual={dividir(a.investimento, a.cliquesLink)} anterior={dividir(b.investimento, b.cliquesLink)} melhorSeSobe={false} />
          <Kpi rotulo="Custo por conversa" valor={moeda(dividir(a.investimento, a.conversasMeta))} atual={dividir(a.investimento, a.conversasMeta)} anterior={dividir(b.investimento, b.conversasMeta)} melhorSeSobe={false} destaque />
          <Kpi rotulo="Custo por cliente" valor={moeda(dividir(a.investimento, a.clientesMeta), false)} atual={dividir(a.investimento, a.clientesMeta)} anterior={dividir(b.investimento, b.clientesMeta)} melhorSeSobe={false} />
          <Kpi rotulo="Retorno (ROAS)" valor={multiplo(dividir(a.receitaMeta, a.investimento))} atual={dividir(a.receitaMeta, a.investimento)} anterior={dividir(b.receitaMeta, b.investimento)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <CartaoGrafico
            className="xl:col-span-7"
            titulo="Investimento por dia"
            subtitulo="Empilhado por campanha. Clique numa campanha para filtrar."
            arquivo="investimento-por-campanha"
            tabela={{
              colunas: ["Dia", ...seriesGasto.map((s) => s.nome)],
              linhas: dias.map((dia, i) => [dia.split("-").reverse().join("/"), ...seriesGasto.map((s) => s.valores[i].toFixed(2).replace(".", ","))]),
            }}
          >
            {seriesGasto.length ? <Legenda nomes={seriesGasto.map((s) => s.nome)} contexto={seriesGasto.some((s) => s.contexto)} /> : null}
            {seriesGasto.length ? <EmpilhadoPorCampanha dias={dias} series={seriesGasto} formato="moeda" /> : <EstadoVazio texto="Sem investimento no período." compacto />}
          </CartaoGrafico>

          <CartaoGrafico
            className="xl:col-span-5"
            titulo={porSemana ? "Custo por conversa por semana" : "Custo por conversa por dia"}
            subtitulo={porSemana ? "O número que diz se vale subir a verba. A última semana ainda está em andamento." : "O número que diz se vale subir a verba de cada campanha."}
            arquivo="custo-por-conversa"
            tabela={{
              colunas: [porSemana ? "Semana de" : "Dia", ...seriesCpl.map((s) => s.nome)],
              linhas: rotulos.map((r, i) => [r.split("-").reverse().join("/"), ...seriesCpl.map((s) => (s.valores[i] === null ? "—" : moeda(s.valores[i])))]),
            }}
          >
            {seriesCpl.length ? <Legenda nomes={seriesCpl.map((s) => s.nome)} linha /> : null}
            {seriesCpl.length ? <GraficoLinhas rotulos={rotulos} series={seriesCpl} formato="moeda" rotuloEixo={porSemana ? "semana" : "dia"} /> : <EstadoVazio texto="Sem conversas de anúncios no período." compacto />}
          </CartaoGrafico>
        </div>

        <CartaoGrafico
          titulo="Matriz de anúncios"
          subtitulo="Cada bolha é um anúncio: quanto custou (→), quanto pagou por conversa (↑) e quantas trouxe (tamanho). As linhas são as medianas."
          arquivo="matriz-anuncios"
          tabela={{
            colunas: ["Anúncio", "Campanha", "Investimento", "Conversas", "Custo por conversa"],
            linhas: pontos.sort((x, y) => x.cpl - y.cpl).map((p) => [p.nome, p.campanha, moeda(p.gasto), p.conversas, moeda(p.cpl)]),
          }}
        >
          {pontos.length >= 2 ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <MatrizComFiltro pontos={pontos} />
              <ul className="grid content-start gap-3 text-[0.8125rem] text-[#4a5870]">
                <Quadrante titulo="Embaixo à direita: escalar" texto="Muito investimento e custo por conversa abaixo da mediana. Candidato a receber mais verba." />
                <Quadrante titulo="Embaixo à esquerda: testar mais" texto="Barato por conversa, mas com pouco investimento ainda. Vale aumentar aos poucos." />
                <Quadrante titulo="Em cima à direita: revisar" texto="Consome verba e cada conversa sai cara. Troque o criativo ou o público." />
                <Quadrante titulo="Em cima à esquerda: pausar" texto="Pouco investimento e conversa cara: provavelmente não vai melhorar." />
              </ul>
            </div>
          ) : (
            <EstadoVazio texto="A matriz aparece quando houver pelo menos dois anúncios com investimento e conversas no período." compacto />
          )}
        </CartaoGrafico>

        <Cartao titulo="Resultado por campanha" subtitulo="Abra a campanha para ver conjuntos e anúncios. Ordene clicando no nome da coluna.">
          {arvore.length ? <TabelaCampanhas arvore={arvore} selecionada={f.campanha} /> : <EstadoVazio texto="Nenhuma campanha no período." compacto />}
        </Cartao>

        <ResumoSemCampanha arvore={arvore} visitantes={a.visitantes} />
      </AreaDados>
    </>
  );
}

function Legenda({ nomes, contexto = false, linha = false }: { nomes: string[]; contexto?: boolean; linha?: boolean }) {
  const cores = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-[#4a5870]">
      {nomes.map((nome, i) => {
        const cor = contexto && i === nomes.length - 1 ? "#b3bdca" : cores[i];
        return (
          <li key={nome} className="flex items-center gap-2">
            <span className={linha ? "h-[3px] w-3.5 rounded-full" : "size-2.5 rounded-[3px]"} style={{ background: cor }} aria-hidden="true" />
            {nome}
          </li>
        );
      })}
    </ul>
  );
}

function Quadrante({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <li className="rounded-xl bg-[#f6f8fb] p-3">
      <p className="font-semibold text-[#0a1f3f]">{titulo}</p>
      <p className="mt-0.5 leading-snug">{texto}</p>
    </li>
  );
}

/** Quanto do tráfego chegou sem campanha marcada: é o que a tabela não consegue atribuir. */
function ResumoSemCampanha({ arvore, visitantes }: { arvore: NoCampanha[]; visitantes: number }) {
  const comCampanha = arvore.reduce((s, c) => s + c.visitantes, 0);
  const sem = Math.max(0, visitantes - comCampanha);
  if (!visitantes) return null;
  return (
    <p className="px-1 text-[0.8125rem] text-[#5b677a]">
      {num(comCampanha)} de {num(visitantes)} pessoas ({pct(dividir(comCampanha, visitantes), 0)}) chegaram por uma campanha marcada. As outras {num(sem)} vieram de
      fontes sem UTM (direto, busca, perfil do Instagram).
    </p>
  );
}
