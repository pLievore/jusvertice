import type { Metadata } from "next";
import { Suspense } from "react";
import { BarraFiltros } from "@/components/painel/BarraFiltros";
import { BarraSegmentada, Cartao, EstadoVazio, Kpi } from "@/components/painel/blocos";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { EsqueletoPainel, SemBanco } from "@/components/painel/estados";
import { ListaBarras } from "@/components/painel/ListaBarras";
import { COR } from "@/components/painel/tema";
import { AreaDados } from "@/components/painel/Transicao";
import { contextoPainel } from "@/lib/painel/contexto";
import { confiancaDiferenca } from "@/lib/painel/estatistica";
import { lerFiltros } from "@/lib/painel/filtros";
import { dividir, nomePagina, num, pct, periodoTexto } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "No site" };

export default function Comportamento({ searchParams }: PageProps<"/admin/comportamento">) {
  return (
    <Suspense fallback={<EsqueletoPainel />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

const FAIXAS: Record<string, string> = {
  "0": "Menos de 15 segundos",
  "15": "15 a 30 segundos",
  "30": "30 segundos a 1 minuto",
  "60": "1 a 2 minutos",
  "120": "2 a 5 minutos",
  "300": "Mais de 5 minutos",
};

const CANAIS: Record<string, string> = { telefone: "Telefone", instagram: "Instagram", email: "E-mail" };

async function Conteudo({ searchParams }: { searchParams: PageProps<"/admin/comportamento">["searchParams"] }) {
  const sp = await searchParams;
  const ctx = await contextoPainel();
  if (!ctx.consultas) return <SemBanco erro={ctx.erro} />;
  const f = lerFiltros(sp);
  const [d, opcoes] = await Promise.all([ctx.consultas.comportamento(f), ctx.consultas.opcoes(f)]);
  const { visitas, interacoes: it } = d;
  const atencao30 = d.engajamento.filter((e) => !["0", "15"].includes(e.faixa)).reduce((s, e) => s + e.sessoes, 0);
  const recorrentes = d.novos.recorrentes.sessoes;
  const totalNovos = d.novos.novos.sessoes + recorrentes;

  return (
    <>
      <CabecalhoPagina titulo="No site" descricao={<>O que as pessoas fazem na página · {periodoTexto(f.de, f.ate)} · {num(visitas)} visitas</>} />
      <BarraFiltros filtros={f} opcoes={opcoes} />

      <AreaDados className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {!visitas && <EstadoVazio texto="Sem visitas neste período." />}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Kpi rotulo="Leram o autodiagnóstico" valor={pct(dividir(it.leuChecklist, visitas), 0)} nota={`${num(it.leuChecklist)} visitas`} />
          <Kpi rotulo="Chegaram ao fim" valor={pct(dividir(it.rolou90, visitas), 0)} nota="Rolaram 90% da página" />
          <Kpi rotulo="Ficaram 30 s ou mais" valor={pct(dividir(atencao30, visitas), 0)} nota="Com a página visível" />
          <Kpi rotulo="Usaram o comparador" valor={pct(dividir(it.usouComparador, visitas), 1)} nota={`${num(it.usouComparador)} visitas`} />
          <Kpi rotulo="Abriram o autodiagnóstico" valor={pct(dividir(it.autodiagnostico, visitas), 1)} nota="Pelo botão do topo" />
          <Kpi rotulo="Visitas de quem voltou" valor={pct(dividir(recorrentes, totalNovos), 0)} nota={`${num(recorrentes)} visitas`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Cartao titulo="Até onde as pessoas chegam" subtitulo="Visitas que viram cada seção, na ordem da página.">
            <ListaBarras
              rotulo="Alcance por seção"
              maximo={visitas || 1}
              itens={[
                { chave: "inicio", nome: "Topo (hero)", valor: visitas, texto: pct(visitas ? 1 : null, 0) },
                ...d.secoes.map((s) => ({ chave: s.id, nome: s.nome, valor: s.sessoes, texto: pct(dividir(s.sessoes, visitas), 0), secundario: num(s.sessoes) })),
              ]}
            />
          </Cartao>
          <Cartao titulo="Tempo de atenção" subtitulo="Quanto tempo cada visita ficou com a página visível.">
            <ListaBarras
              rotulo="Tempo de atenção"
              maximo={Math.max(1, ...d.engajamento.map((e) => e.sessoes))}
              itens={d.engajamento.map((e) => ({ chave: e.faixa, nome: FAIXAS[e.faixa], valor: e.sessoes, texto: pct(dividir(e.sessoes, visitas), 0), secundario: num(e.sessoes) }))}
            />
          </Cartao>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Cartao titulo="O que marcam no autodiagnóstico" subtitulo="Visitas que marcaram cada item. Mostra a dor que o anúncio está atraindo.">
            {d.itens.length ? (
              <ListaBarras rotulo="Itens marcados" itens={d.itens.map((i) => ({ chave: i.id, nome: i.texto, valor: i.sessoes, texto: num(i.sessoes) }))} />
            ) : (
              <EstadoVazio texto="Ninguém marcou itens no período." compacto />
            )}
          </Cartao>
          <Cartao titulo="Perguntas mais abertas" subtitulo="Dúvidas que valem virar anúncio ou resposta pronta no WhatsApp.">
            {d.faq.length ? (
              <ListaBarras rotulo="Perguntas abertas" itens={d.faq.map((q) => ({ chave: q.pergunta, nome: q.pergunta, valor: q.aberturas, texto: num(q.aberturas) }))} />
            ) : (
              <EstadoVazio texto="Nenhuma pergunta aberta no período." compacto />
            )}
          </Cartao>
        </div>

        <TesteAB variantes={d.variantes} />

        <div className="grid gap-4 lg:grid-cols-3">
          <Cartao titulo="Navegador ou app" subtitulo="Por onde as pessoas abriram o site e quantas chamaram." className="lg:col-span-2">
            {d.navegadores.length ? (
              <ListaBarras
                rotulo="Navegadores"
                itens={d.navegadores.slice(0, 8).map((n) => ({
                  chave: n.navegador,
                  nome: n.navegador,
                  valor: n.visitantes,
                  texto: num(n.visitantes),
                  secundario: `${pct(dividir(n.conversas, n.visitantes))} conversa`,
                }))}
              />
            ) : (
              <EstadoVazio texto="Sem visitas no período." compacto />
            )}
          </Cartao>
          <div className="flex flex-col gap-4">
            <Cartao titulo="Novas e de quem voltou" subtitulo="Visitas de primeira vez × de quem já tinha visitado.">
              <BarraSegmentada
                rotulo="Visitas novas e recorrentes"
                partes={[
                  { nome: "Primeira visita", valor: d.novos.novos.sessoes, cor: COR.serie[0] },
                  { nome: "Voltou", valor: recorrentes, cor: COR.serie[1] },
                ]}
              />
              <p className="mt-3 text-[0.8125rem] text-[#4a5870]">
                Quem volta chama em {pct(dividir(d.novos.recorrentes.conversas, recorrentes))} das visitas; na primeira visita, {pct(dividir(d.novos.novos.conversas, d.novos.novos.sessoes))}.
              </p>
            </Cartao>
            <Cartao titulo="Contatos fora do WhatsApp" subtitulo="Cliques no rodapé.">
              {d.contatos.length ? (
                <ul className="flex flex-col gap-2 text-[0.875rem]">
                  {d.contatos.map((c) => (
                    <li key={c.canal} className="flex justify-between">
                      <span>{CANAIS[c.canal] ?? c.canal}</span>
                      <span className="font-semibold tabular-nums">{num(c.cliques)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EstadoVazio texto="Nenhum clique em telefone ou Instagram." compacto />
              )}
            </Cartao>
          </div>
        </div>
      </AreaDados>
    </>
  );
}

/** Versões da página contra a original de cada grupo, com a confiança de que a diferença é real. */
function TesteAB({ variantes }: { variantes: { pagina: string; visitantes: number; conversas: number }[] }) {
  const grupos = [
    { nome: "Regularização (urbana)", original: "/", paginas: variantes.filter((v) => !v.pagina.startsWith("/georreferenciamento")) },
    { nome: "Imóvel rural", original: "/georreferenciamento", paginas: variantes.filter((v) => v.pagina.startsWith("/georreferenciamento")) },
  ].filter((g) => g.paginas.length);

  return (
    <Cartao
      titulo="Versões da página (teste A/B)"
      subtitulo="Cada versão do título comparada à original. Só declare vencedora com confiança de 95% ou mais."
    >
      {grupos.length ? (
        <div className="flex flex-col gap-6">
          {grupos.map((g) => {
            const base = g.paginas.find((p) => p.pagina === g.original);
            const taxaBase = base ? dividir(base.conversas, base.visitantes) : null;
            const maxTaxa = Math.max(0.0001, ...g.paginas.map((p) => dividir(p.conversas, p.visitantes) ?? 0));
            return (
              <div key={g.nome} className="overflow-x-auto" tabIndex={0} role="region" aria-label={`Teste A/B: ${g.nome}`}>
                <table className="w-full min-w-[40rem] border-collapse text-[0.875rem]">
                  <caption className="mb-2 text-left text-[0.8125rem] font-semibold text-[#4a5870]">{g.nome}</caption>
                  <thead>
                    <tr className="border-b border-[#e3e8ef] text-[0.75rem] text-[#4a5870]">
                      <th scope="col" className="py-2 pr-4 text-left font-semibold">Versão</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Pessoas</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Conversas</th>
                      <th scope="col" className="w-[30%] px-3 py-2 text-left font-semibold">Taxa de conversa</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Contra a original</th>
                      <th scope="col" className="py-2 pl-3 text-left font-semibold">Leitura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.paginas
                      .sort((x, y) => (x.pagina === g.original ? -1 : y.pagina === g.original ? 1 : x.pagina.localeCompare(y.pagina)))
                      .map((p) => {
                        const taxa = dividir(p.conversas, p.visitantes);
                        const ehBase = p.pagina === g.original;
                        const conf = base && !ehBase ? confiancaDiferenca(base.conversas, base.visitantes, p.conversas, p.visitantes) : null;
                        const dif = taxa !== null && taxaBase ? (taxa - taxaBase) / taxaBase : null;
                        const veredito = ehBase
                          ? { texto: "Referência", classe: "bg-[#eef1f6] text-[#4a5870]", icone: "•" }
                          : conf === null || conf < 0.95 || dif === null
                            ? { texto: `Inconclusivo${conf !== null ? ` (${pct(conf, 0)})` : ""}`, classe: "bg-[#eef1f6] text-[#4a5870]", icone: "?" }
                            : dif > 0
                              ? { texto: `Melhor (${pct(conf, 0)} de confiança)`, classe: "bg-[#e7f6e7] text-[#006300]", icone: "✓" }
                              : { texto: `Pior (${pct(conf, 0)} de confiança)`, classe: "bg-[#fdecea] text-[#b42318]", icone: "✕" };
                        return (
                          <tr key={p.pagina} className="border-b border-[#eef1f5] last:border-0">
                            <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                              <span className="font-medium text-[#0a1f3f]">{nomePagina(p.pagina)}</span>
                              <span className="block text-[0.75rem] text-[#6b7688]">{p.pagina}</span>
                            </th>
                            <td className="px-3 py-2.5 text-right tabular-nums">{num(p.visitantes)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{num(p.conversas)}</td>
                            <td className="px-3 py-2.5">
                              <span className="flex items-center gap-3">
                                <span className="h-2 flex-1 rounded-full bg-[#eef1f5]">
                                  <span className="block h-full rounded-full" style={{ width: `${((taxa ?? 0) / maxTaxa) * 100}%`, background: ehBase ? COR.contexto : COR.serie[0] }} />
                                </span>
                                <span className="w-14 text-right font-semibold tabular-nums">{pct(taxa)}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{ehBase || dif === null ? "—" : `${dif > 0 ? "+" : ""}${pct(dif, 0)}`}</td>
                            <td className="py-2.5 pl-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${veredito.classe}`}>
                                <span aria-hidden="true">{veredito.icone}</span>
                                {veredito.texto}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        <EstadoVazio texto="Sem visitas às versões no período." compacto />
      )}
    </Cartao>
  );
}
