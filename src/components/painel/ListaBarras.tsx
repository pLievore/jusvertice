"use client";

import type { ChaveFiltro } from "@/lib/painel/filtros";
import { COR } from "./tema";
import { useTransicao } from "./Transicao";

export type ItemBarra = { chave: string; nome: string; valor: number; texto: string; secundario?: string };

/**
 * Barras horizontais ranqueadas (nome, barra e número por linha), uma cor só: a medida já é o
 * comprimento. Com `filtro`, cada linha é um botão que filtra o painel inteiro por ela; a escolhida
 * fica em destaque e as outras recuam (filtro cruzado). Clicar de novo limpa.
 */
export function ListaBarras({
  itens,
  filtro,
  selecionado,
  rotulo,
  maximo,
}: {
  itens: ItemBarra[];
  filtro?: ChaveFiltro;
  selecionado?: string | null;
  rotulo: string;
  maximo?: number;
}) {
  const { filtrar } = useTransicao();
  const topo = maximo ?? Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="flex flex-col" aria-label={rotulo}>
      {itens.map((item) => {
        const ativo = selecionado === item.chave;
        const recuado = Boolean(selecionado) && !ativo;
        const conteudo = (
          <>
            <span className="flex min-w-0 items-baseline justify-between gap-3">
              <span className={`truncate text-[0.875rem] ${ativo ? "font-semibold text-[#0a1f3f]" : "text-[#0a1f3f]"}`}>{item.nome}</span>
              <span className="shrink-0 text-[0.875rem] tabular-nums">
                <span className="font-semibold text-[#0a1f3f]">{item.texto}</span>
                {item.secundario && <span className="ml-1.5 text-[#5b677a]">{item.secundario}</span>}
              </span>
            </span>
            <span className="mt-1.5 block h-2 w-full rounded-full bg-[#eef1f5]">
              <span
                className="block h-full rounded-full transition-[width,background-color] duration-500"
                style={{ width: `${Math.max(item.valor > 0 ? 1.5 : 0, (item.valor / topo) * 100)}%`, background: recuado ? COR.contexto : COR.serie[0] }}
              />
            </span>
          </>
        );
        return (
          <li key={item.chave} className="border-b border-[#eef1f5] last:border-0">
            {filtro ? (
              <button
                type="button"
                onClick={() => filtrar({ [filtro]: ativo ? null : item.chave })}
                aria-pressed={ativo}
                className={`block w-full rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[#f4f6fa] focus-visible:bg-[#f4f6fa] ${ativo ? "bg-[#eef4fc]" : ""}`}
                title={ativo ? "Limpar este filtro" : `Filtrar o painel por ${item.nome}`}
              >
                {conteudo}
              </button>
            ) : (
              <div className="px-2 py-2.5">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
