"use client";

import { Fragment, type ReactNode, useState } from "react";
import type { NoCampanha } from "@/lib/painel/consultas";
import { dividir, moeda, multiplo, num, pct } from "@/lib/painel/formato";
import { COR } from "./tema";
import { useTransicao } from "./Transicao";

type Coluna = { id: string; nome: string; valor: (n: NoCampanha) => number | null; texto: (n: NoCampanha) => string; barra?: boolean; menorMelhor?: boolean };

const COLUNAS: Coluna[] = [
  { id: "gasto", nome: "Investimento", valor: (n) => n.gasto, texto: (n) => (n.gasto ? moeda(n.gasto, false) : "—"), barra: true },
  { id: "impressoes", nome: "Impressões", valor: (n) => n.impressoes, texto: (n) => (n.impressoes ? num(n.impressoes) : "—") },
  { id: "ctr", nome: "CTR do link", valor: (n) => dividir(n.cliquesLink, n.impressoes), texto: (n) => pct(dividir(n.cliquesLink, n.impressoes), 2) },
  { id: "visitantes", nome: "Pessoas no site", valor: (n) => n.visitantes, texto: (n) => num(n.visitantes) },
  { id: "conversas", nome: "Conversas", valor: (n) => n.conversas, texto: (n) => num(n.conversas), barra: true },
  { id: "cpl", nome: "Custo por conversa", valor: (n) => dividir(n.gasto, n.conversas), texto: (n) => (n.gasto ? moeda(dividir(n.gasto, n.conversas)) : "—"), menorMelhor: true },
  { id: "clientes", nome: "Clientes", valor: (n) => n.clientes, texto: (n) => num(n.clientes) },
  { id: "receita", nome: "Receita", valor: (n) => n.receita, texto: (n) => (n.receita ? moeda(n.receita, false) : "—") },
  { id: "roas", nome: "ROAS", valor: (n) => dividir(n.receita, n.gasto), texto: (n) => multiplo(dividir(n.receita, n.gasto)) },
];

const NIVEL = { campanha: "Campanha", conjunto: "Conjunto", anuncio: "Anúncio" } as const;

/**
 * Tabela campanha › conjunto › anúncio, com ordenação por coluna e barras de dados discretas
 * em investimento e conversas (como a formatação condicional do Power BI). No celular vira cartões.
 */
export function TabelaCampanhas({ arvore, selecionada }: { arvore: NoCampanha[]; selecionada: string | null }) {
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set(arvore.slice(0, 1).map((c) => c.id)));
  const [ordem, setOrdem] = useState<{ coluna: string; desc: boolean }>({ coluna: "gasto", desc: true });
  const { filtrar } = useTransicao();

  const coluna = COLUNAS.find((c) => c.id === ordem.coluna) ?? COLUNAS[0];
  const ordenar = (lista: NoCampanha[]) =>
    [...lista].sort((a, b) => {
      const va = coluna.valor(a) ?? (ordem.desc ? -Infinity : Infinity);
      const vb = coluna.valor(b) ?? (ordem.desc ? -Infinity : Infinity);
      return ordem.desc ? vb - va : va - vb;
    });
  const maximos = Object.fromEntries(COLUNAS.filter((c) => c.barra).map((c) => [c.id, Math.max(1, ...arvore.map((n) => c.valor(n) ?? 0))]));
  const alternar = (id: string) =>
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const linha = (n: NoCampanha, profundidade: number, chave: string): ReactNode => {
    const aberto = abertos.has(chave);
    const temFilhos = n.filhos.length > 0;
    return (
      <Fragment key={chave}>
        <tr className={`border-b border-[#eef1f5] ${profundidade === 0 ? "bg-white" : "bg-[#fafbfd]"} ${selecionada === n.nome ? "outline outline-2 -outline-offset-2 outline-[#2a78d6]" : ""}`}>
          <th scope="row" className="sticky left-0 z-[1] min-w-[16rem] max-w-[22rem] bg-inherit py-2.5 pr-4 text-left font-normal" style={{ paddingLeft: `${0.75 + profundidade * 1.25}rem` }}>
            <span className="flex items-center gap-2">
              {temFilhos ? (
                <button
                  type="button"
                  onClick={() => alternar(chave)}
                  aria-expanded={aberto}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-[#4a5870] hover:bg-[#eef1f6]"
                  aria-label={`${aberto ? "Recolher" : "Abrir"} ${NIVEL[n.nivel].toLowerCase()} ${n.nome}`}
                >
                  <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${aberto ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              ) : (
                <span className="size-7 shrink-0" />
              )}
              <span className="min-w-0">
                <span className={`block truncate ${profundidade === 0 ? "font-semibold text-[#0a1f3f]" : "text-[#0a1f3f]"}`} title={n.nome}>
                  {n.nome}
                </span>
                <span className="text-[0.75rem] text-[#6b7688]">
                  {NIVEL[n.nivel]}
                  {!n.meta && " · só UTM"}
                </span>
              </span>
              {profundidade === 0 && (
                <button
                  type="button"
                  onClick={() => filtrar({ campanha: selecionada === n.nome ? null : n.nome })}
                  className="ml-auto shrink-0 rounded-full border border-[#d5dce6] px-2.5 py-1 text-[0.75rem] font-semibold text-[#1c5cab] hover:bg-[#eef4fc]"
                >
                  {selecionada === n.nome ? "Limpar" : "Filtrar"}
                </button>
              )}
            </span>
          </th>
          {COLUNAS.map((c) => {
            const v = c.valor(n) ?? 0;
            const largura = c.barra && profundidade === 0 ? Math.min(100, (v / maximos[c.id]) * 100) : 0;
            return (
              <td key={c.id} className="relative whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-[#0a1f3f]">
                {largura > 0 && (
                  <span className="absolute bottom-1.5 right-3 h-[3px] rounded-full" style={{ width: `calc(${largura}% - 1.5rem)`, maxWidth: "calc(100% - 1.5rem)", background: c.id === "gasto" ? COR.ouro : COR.serie[0], opacity: 0.85 }} aria-hidden="true" />
                )}
                {c.texto(n)}
              </td>
            );
          })}
        </tr>
        {aberto && ordenar(n.filhos).map((filho) => linha(filho, profundidade + 1, `${chave}›${filho.id}`))}
      </Fragment>
    );
  };

  return (
    <>
      {/* Desktop e tablet: tabela com rolagem lateral e primeira coluna fixa */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-[0.875rem]">
          <caption className="sr-only">Resultado por campanha, conjunto e anúncio</caption>
          <thead>
            <tr className="border-b border-[#e3e8ef]">
              <th scope="col" className="sticky left-0 z-[1] bg-white py-2.5 pl-3 pr-4 text-left text-[0.75rem] font-semibold text-[#4a5870]">
                Campanha › conjunto › anúncio
              </th>
              {COLUNAS.map((c) => (
                <th key={c.id} scope="col" aria-sort={ordem.coluna === c.id ? (ordem.desc ? "descending" : "ascending") : "none"} className="px-1 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => setOrdem((o) => ({ coluna: c.id, desc: o.coluna === c.id ? !o.desc : !c.menorMelhor }))}
                    className={`inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[0.75rem] font-semibold hover:bg-[#eef1f6] ${ordem.coluna === c.id ? "text-[#0a1f3f]" : "text-[#4a5870]"}`}
                  >
                    {c.nome}
                    <span aria-hidden="true" className={ordem.coluna === c.id ? "" : "opacity-0"}>
                      {ordem.desc ? "↓" : "↑"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{ordenar(arvore).map((c) => linha(c, 0, c.id))}</tbody>
        </table>
      </div>

      {/* Celular: um cartão por campanha */}
      <ul className="flex flex-col gap-3 md:hidden">
        {ordenar(arvore).map((c) => (
          <li key={c.id} className="rounded-xl border border-[#e3e8ef] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold leading-snug text-[#0a1f3f]">{c.nome}</p>
              <button
                type="button"
                onClick={() => filtrar({ campanha: selecionada === c.nome ? null : c.nome })}
                className="min-h-9 shrink-0 rounded-full border border-[#d5dce6] px-3 text-[0.75rem] font-semibold text-[#1c5cab]"
              >
                {selecionada === c.nome ? "Limpar" : "Filtrar"}
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2.5">
              {COLUNAS.filter((col) => ["gasto", "conversas", "cpl", "ctr", "clientes", "roas"].includes(col.id)).map((col) => (
                <div key={col.id}>
                  <dt className="text-[0.6875rem] text-[#6b7688]">{col.nome}</dt>
                  <dd className="text-[0.9375rem] font-semibold tabular-nums text-[#0a1f3f]">{col.texto(c)}</dd>
                </div>
              ))}
            </dl>
            {c.filhos.length > 0 && (
              <details className="mt-3 border-t border-[#eef1f5] pt-2">
                <summary className="flex min-h-10 cursor-pointer items-center text-[0.8125rem] font-semibold text-[#1c5cab]">
                  {c.filhos.reduce((s, cj) => s + cj.filhos.length, 0)} anúncios
                </summary>
                <ul className="mt-1 flex flex-col divide-y divide-[#eef1f5]">
                  {c.filhos.flatMap((cj) =>
                    cj.filhos.map((ad) => (
                      <li key={`${cj.id}›${ad.id}`} className="py-2">
                        <p className="text-[0.8125rem] text-[#0a1f3f]">{ad.nome}</p>
                        <p className="text-[0.75rem] text-[#6b7688]">
                          {cj.nome} · {num(ad.conversas)} conv. · {ad.gasto ? moeda(dividir(ad.gasto, ad.conversas)) : "—"} por conversa
                        </p>
                      </li>
                    )),
                  )}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
