import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BarraFiltros } from "@/components/painel/BarraFiltros";
import { BarraSegmentada, Cartao, EstadoVazio, Funil, Kpi, Minigrafico, Variacao } from "@/components/painel/blocos";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { CartaoGrafico } from "@/components/painel/CartaoGrafico";
import { EsqueletoPainel, SemBanco } from "@/components/painel/estados";
import { GraficoCalor, GraficoColunas, GraficoTendencia } from "@/components/painel/graficos";
import { ListaBarras } from "@/components/painel/ListaBarras";
import { COR } from "@/components/painel/tema";
import { AreaDados } from "@/components/painel/Transicao";
import type { Celula, Fatia } from "@/lib/painel/consultas";
import { contextoPainel } from "@/lib/painel/contexto";
import { lerFiltros } from "@/lib/painel/filtros";
import { DIAS_SEMANA_LONGOS, dividir, moeda, multiplo, NOMES_DISPOSITIVO, nomeOrigem, num, numCompacto, pct, periodoTexto } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Visão geral" };

export default function VisaoGeral({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<EsqueletoPainel />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const sp = await searchParams;
  const ctx = await contextoPainel();
  if (!ctx.consultas) return <SemBanco erro={ctx.erro} />;
  const f = lerFiltros(sp);
  const [d, opcoes] = await Promise.all([ctx.consultas.visaoGeral(f), ctx.consultas.opcoes(f)]);
  const { atual: a, anterior: b, serie } = d;

  const cpl = dividir(a.investimento, a.conversasMeta);
  const cplAnterior = dividir(b.investimento, b.conversasMeta);
  const roas = dividir(a.receitaMeta, a.investimento);
  const roasAnterior = dividir(b.receitaMeta, b.investimento);
  const temGasto = a.investimento > 0 || b.investimento > 0;
  const dias = serie.map((p) => p.dia);
  const semDados = a.visitas === 0 && a.conversas === 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Visão geral"
        descricao={
          <>
            {periodoTexto(f.de, f.ate)} <span aria-hidden="true">·</span> comparado a {periodoTexto(f.anteriorDe, f.anteriorAte)}
          </>
        }
      />
      <BarraFiltros filtros={f} opcoes={opcoes} />

      <AreaDados className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {semDados && (
          <EstadoVazio texto="Ainda não há visitas neste período. Os números aparecem assim que o site receber tráfego.">
            <Link href="/admin/configuracao" className="font-semibold text-[#1c5cab] underline underline-offset-4">
              Ver configuração e dados de demonstração
            </Link>
          </EstadoVazio>
        )}

        {/* Número principal + indicadores */}
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="painel-cartao relative overflow-hidden bg-[#002448] p-6 text-white xl:col-span-4">
            <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-24 -top-24 w-56 text-[#cca85e]/90 sm:-right-16 sm:-top-16" aria-hidden="true">
              <path d="M12 200A188 188 0 0 1 200 12" fill="none" stroke="currentColor" strokeWidth="10" />
            </svg>
            <p className="relative text-[0.875rem] font-medium text-[#afbcd1]">Conversas iniciadas no WhatsApp</p>
            <p className="relative mt-3 text-[3.5rem] font-semibold leading-none tracking-[-0.02em]">{num(a.conversas)}</p>
            <div className="relative mt-3 [&_p]:text-[#afbcd1]">
              <Variacao atual={a.conversas} anterior={b.conversas} />
            </div>
            <Minigrafico valores={serie.map((p) => p.conversas)} cor={COR.ouro} className="relative mt-5 !h-14" altura={48} />
            <dl className="relative mt-5 grid grid-cols-2 gap-4 border-t border-white/12 pt-4">
              <div>
                <dt className="text-[0.75rem] text-[#afbcd1]">Taxa de conversão</dt>
                <dd className="mt-1 text-[1.25rem] font-semibold">{pct(dividir(a.conversas, a.visitantes))}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] text-[#afbcd1]">Cliques no WhatsApp</dt>
                <dd className="mt-1 text-[1.25rem] font-semibold">{num(a.cliquesWhats)}</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:col-span-8">
            <Kpi rotulo="Visitas" valor={numCompacto(a.visitas)} atual={a.visitas} anterior={b.visitas} serie={serie.map((p) => p.visitas)} dica="Sessões no site; 30 minutos sem atividade abre outra." />
            <Kpi
              rotulo="Investimento (Meta)"
              valor={temGasto ? moeda(a.investimento, false) : "—"}
              atual={temGasto ? a.investimento : null}
              anterior={temGasto ? b.investimento : null}
              serie={temGasto ? serie.map((p) => p.investimento) : undefined}
              dica="Gasto dos anúncios no período, sincronizado da Meta todo dia."
            />
            <Kpi
              rotulo="Custo por conversa"
              valor={moeda(cpl)}
              atual={cpl}
              anterior={cplAnterior}
              melhorSeSobe={false}
              destaque
              dica="Investimento dividido pelas conversas que vieram dos anúncios da Meta."
            />
            <Kpi rotulo="Clientes fechados" valor={num(a.clientes)} atual={a.clientes} anterior={b.clientes} dica="Leads marcados como 'Fechou' na tela de Leads." />
            <Kpi rotulo="Receita fechada" valor={moeda(a.receita, false)} atual={a.receita} anterior={b.receita} dica="Soma do valor dos leads que fecharam." />
            <Kpi rotulo="Retorno (ROAS)" valor={multiplo(roas)} atual={roas} anterior={roasAnterior} dica="Receita das conversas da Meta dividida pelo investimento." />
          </div>
        </div>

        <LeituraRapida origens={d.origens} fontes={d.fontes} dispositivos={d.dispositivos} calor={d.calor} leram={a.leram} visitantes={a.visitantes} cpl={cpl} cplAnterior={cplAnterior} />

        <div className="grid gap-4 xl:grid-cols-12">
          <CartaoGrafico
            className="xl:col-span-8"
            titulo="Conversas por dia"
            subtitulo="Linha azul: período escolhido. Cinza: o período anterior, dia a dia."
            arquivo="conversas-por-dia"
            tabela={{
              colunas: ["Dia", "Conversas", "Período anterior"],
              linhas: serie.map((p, i) => [p.dia.split("-").reverse().join("/"), p.conversas, d.serieAnterior[i]?.conversas ?? 0]),
            }}
          >
            <GraficoTendencia dias={dias} atual={serie.map((p) => p.conversas)} anterior={d.serieAnterior.map((p) => p.conversas)} nome="Conversas" altura={260} />
          </CartaoGrafico>

          <Cartao className="xl:col-span-4" titulo="Funil" subtitulo="Pessoas em cada etapa, do anúncio ao contrato.">
            <Funil
              etapas={[
                { nome: "Visitaram o site", valor: a.visitantes },
                { nome: "Leram o autodiagnóstico", valor: a.leram },
                { nome: "Iniciaram conversa", valor: a.conversas, descricao: "Clicaram no WhatsApp" },
                { nome: "Viraram atendimento", valor: a.atendidas, descricao: "Marcados na tela de Leads" },
                { nome: "Fecharam", valor: a.clientes },
              ]}
            />
          </Cartao>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CartaoGrafico
            titulo="Visitas por dia"
            arquivo="visitas-por-dia"
            tabela={{ colunas: ["Dia", "Visitas", "Pessoas"], linhas: serie.map((p) => [p.dia.split("-").reverse().join("/"), p.visitas, p.visitantes]) }}
          >
            <GraficoColunas dias={dias} valores={serie.map((p) => p.visitas)} nome="Visitas" />
          </CartaoGrafico>
          {temGasto ? (
            <CartaoGrafico
              titulo="Investimento por dia"
              subtitulo="Anúncios da Meta."
              arquivo="investimento-por-dia"
              tabela={{ colunas: ["Dia", "Investimento (R$)"], linhas: serie.map((p) => [p.dia.split("-").reverse().join("/"), p.investimento.toFixed(2).replace(".", ",")]) }}
            >
              <GraficoColunas dias={dias} valores={serie.map((p) => p.investimento)} nome="Investimento" formato="moeda" />
            </CartaoGrafico>
          ) : (
            <Cartao titulo="Investimento por dia">
              <EstadoVazio texto="Sem dados de investimento. Conecte a conta de anúncios da Meta para ver gasto, custo por conversa e retorno." compacto>
                <Link href="/admin/configuracao" className="font-semibold text-[#1c5cab] underline underline-offset-4">
                  Conectar a Meta
                </Link>
              </EstadoVazio>
            </Cartao>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Cartao titulo="Conversas por botão" subtitulo="Qual parte da página faz a pessoa chamar. Clique para filtrar.">
            {d.origens.length ? (
              <ListaBarras
                rotulo="Conversas por botão"
                filtro="origem"
                selecionado={f.origem}
                itens={d.origens.slice(0, 10).map((o) => ({
                  chave: o.origem,
                  nome: nomeOrigem(o.origem),
                  valor: o.conversas,
                  texto: num(o.conversas),
                  secundario: o.clientes ? `${o.clientes} ${o.clientes === 1 ? "cliente" : "clientes"}` : undefined,
                }))}
              />
            ) : (
              <EstadoVazio texto="Nenhuma conversa no período." compacto />
            )}
          </Cartao>

          <Cartao titulo="De onde vêm as pessoas" subtitulo="Pessoas por fonte e quantas iniciam conversa. Clique para filtrar.">
            {d.fontes.length ? (
              <ListaBarras
                rotulo="Fontes de tráfego"
                filtro="fonte"
                selecionado={f.fonte}
                itens={d.fontes.map((x) => ({
                  chave: x.chave || "Direto",
                  nome: x.chave || "Direto",
                  valor: x.visitantes,
                  texto: num(x.visitantes),
                  secundario: `${pct(dividir(x.conversas, x.visitantes))} conversa`,
                }))}
              />
            ) : (
              <EstadoVazio texto="Sem visitas no período." compacto />
            )}
          </Cartao>

          <Cartao titulo="Aparelhos" subtitulo="Pessoas por aparelho e a taxa de conversa de cada um." className="lg:col-span-2 xl:col-span-1">
            <Aparelhos fatias={d.dispositivos} selecionado={f.dispositivo} />
          </Cartao>
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <CartaoGrafico
            className="xl:col-span-8"
            titulo="Quando as conversas acontecem"
            subtitulo="Dia da semana × hora (horário de Brasília). Bom para programar anúncios e o atendimento."
            arquivo="conversas-dia-hora"
            tabela={{
              colunas: ["Dia", ...Array.from({ length: 24 }, (_, h) => `${h}h`)],
              linhas: [1, 2, 3, 4, 5, 6, 0].map((dow) => [DIAS_SEMANA_LONGOS[dow], ...Array.from({ length: 24 }, (_, h) => d.calor.find((c) => c.dow === dow && c.hora === h)?.conversas ?? 0)]),
            }}
          >
            <GraficoCalor celulas={d.calor} />
          </CartaoGrafico>
          <Cartao className="xl:col-span-4" titulo="Cidades" subtitulo="Pessoas por cidade (localização aproximada).">
            {d.cidades.filter((c) => c.chave).length ? (
              <ListaBarras
                rotulo="Cidades"
                itens={d.cidades
                  .filter((c) => c.chave)
                  .map((c) => ({ chave: c.chave, nome: c.chave, valor: c.visitantes, texto: num(c.visitantes), secundario: c.conversas ? `${c.conversas} conv.` : undefined }))}
              />
            ) : (
              <EstadoVazio texto="A cidade aparece quando o site estiver na Vercel (localização pelo IP, sem guardar o IP)." compacto />
            )}
          </Cartao>
        </div>
      </AreaDados>
    </>
  );
}

function Aparelhos({ fatias, selecionado }: { fatias: Fatia[]; selecionado: string | null }) {
  const ordem = ["celular", "computador", "tablet"];
  const lista = ordem.map((chave) => fatias.find((x) => x.chave === chave) ?? { chave, visitantes: 0, conversas: 0 });
  return (
    <div className="flex flex-col gap-5">
      <BarraSegmentada
        rotulo="Pessoas por aparelho"
        partes={lista.map((x, i) => ({ nome: NOMES_DISPOSITIVO[x.chave], valor: x.visitantes, cor: COR.serie[i] }))}
      />
      <ListaBarras
        rotulo="Taxa de conversa por aparelho"
        filtro="dispositivo"
        selecionado={selecionado}
        maximo={Math.max(0.0001, ...lista.map((x) => dividir(x.conversas, x.visitantes) ?? 0))}
        itens={lista.map((x) => ({
          chave: x.chave,
          nome: NOMES_DISPOSITIVO[x.chave],
          valor: dividir(x.conversas, x.visitantes) ?? 0,
          texto: pct(dividir(x.conversas, x.visitantes)),
          secundario: `${num(x.conversas)} conv.`,
        }))}
      />
    </div>
  );
}

/** Frases calculadas dos dados do período: o que vale saber sem precisar ler gráfico. */
function LeituraRapida({
  origens,
  fontes,
  dispositivos,
  calor,
  leram,
  visitantes,
  cpl,
  cplAnterior,
}: {
  origens: { origem: string; conversas: number }[];
  fontes: Fatia[];
  dispositivos: Fatia[];
  calor: Celula[];
  leram: number;
  visitantes: number;
  cpl: number | null;
  cplAnterior: number | null;
}) {
  const frases: { titulo: string; texto: string }[] = [];
  const totalConv = origens.reduce((s, o) => s + o.conversas, 0);
  if (origens[0] && totalConv >= 5) {
    frases.push({ titulo: "Botão que mais converte", texto: `${nomeOrigem(origens[0].origem)} gerou ${pct(origens[0].conversas / totalConv, 0)} das conversas.` });
  }
  const pico = [...calor].sort((a, b) => b.conversas - a.conversas)[0];
  if (pico && pico.conversas >= 2) {
    frases.push({ titulo: "Horário de pico", texto: `${DIAS_SEMANA_LONGOS[pico.dow]}, das ${pico.hora}h às ${pico.hora + 1}h, é quando mais gente chama.` });
  }
  const melhorFonte = fontes
    .filter((x) => x.visitantes >= 30)
    .map((x) => ({ ...x, taxa: x.conversas / x.visitantes }))
    .sort((a, b) => b.taxa - a.taxa)[0];
  if (melhorFonte) {
    frases.push({ titulo: "Fonte mais qualificada", texto: `${melhorFonte.chave || "Direto"} transforma ${pct(melhorFonte.taxa)} das pessoas em conversa.` });
  }
  if (cpl !== null && cplAnterior !== null) {
    const v = (cpl - cplAnterior) / cplAnterior;
    if (Math.abs(v) >= 0.05) {
      frases.push({ titulo: "Custo por conversa", texto: `${v < 0 ? "Caiu" : "Subiu"} ${pct(Math.abs(v), 0)} em relação ao período anterior (${moeda(cplAnterior)} → ${moeda(cpl)}).` });
    }
  }
  const celular = dispositivos.find((x) => x.chave === "celular");
  const totalDisp = dispositivos.reduce((s, x) => s + x.visitantes, 0);
  if (frases.length < 4 && celular && totalDisp) {
    frases.push({ titulo: "Celular", texto: `${pct(celular.visitantes / totalDisp, 0)} das pessoas abrem o site pelo celular.` });
  }
  if (frases.length < 4 && visitantes) {
    frases.push({ titulo: "Leitura", texto: `${pct(leram / visitantes, 0)} das pessoas chegam ao autodiagnóstico.` });
  }
  if (!frases.length) return null;
  return (
    <section className="painel-cartao px-5 py-4 sm:px-6" aria-label="Leitura rápida">
      <h2 className="flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[#7e5f20]">
        <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
          <circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="7" cy="7" r="1.9" fill="currentColor" />
        </svg>
        Leitura rápida
      </h2>
      <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        {frases.slice(0, 4).map((x) => (
          <li key={x.titulo} className="border-l-2 border-[#cca85e] pl-3">
            <p className="text-[0.75rem] font-semibold text-[#4a5870]">{x.titulo}</p>
            <p className="mt-0.5 text-[0.9375rem] leading-snug text-[#0a1f3f]">{x.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
