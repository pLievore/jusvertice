"use client";

import { useEffect, useId, useRef, useState } from "react";
import { type Filtros, PAGINAS, PERIODOS } from "@/lib/painel/filtros";
import { NOMES_DISPOSITIVO, nomeOrigem } from "@/lib/painel/formato";
import { IconeFiltro, IconeX } from "./icones";
import { useTransicao } from "./Transicao";

type Opcoes = { fontes: string[]; campanhas: string[] };

/**
 * Uma linha de filtros acima de tudo o que eles afetam: período primeiro (atalhos antes do
 * personalizado), depois página, fonte, campanha e aparelho. Filtros vindos de clique em gráfico
 * aparecem como etiquetas removíveis. No celular, os filtros de dimensão abrem numa folha.
 */
export function BarraFiltros({ filtros, opcoes, dimensoes = true }: { filtros: Filtros; opcoes: Opcoes; dimensoes?: boolean }) {
  const { filtrar, pendente } = useTransicao();
  const [folha, setFolha] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (folha && !d.open) d.showModal();
    if (!folha && d.open) d.close();
  }, [folha]);

  const ativos = [
    filtros.pagina !== "todas" && { chave: "pagina", nome: PAGINAS.find((p) => p.id === filtros.pagina)?.nome ?? filtros.pagina },
    filtros.fonte && { chave: "fonte", nome: `Fonte: ${filtros.fonte}` },
    filtros.campanha && { chave: "campanha", nome: `Campanha: ${filtros.campanha}` },
    filtros.dispositivo && { chave: "dispositivo", nome: NOMES_DISPOSITIVO[filtros.dispositivo] ?? filtros.dispositivo },
    filtros.origem && { chave: "origem", nome: `Botão: ${nomeOrigem(filtros.origem)}` },
  ].filter(Boolean) as { chave: string; nome: string }[];

  const selects = (
    <>
      <Seletor
        rotulo="Página"
        valor={filtros.pagina}
        aoMudar={(v) => filtrar({ pagina: v === "todas" ? null : v })}
        opcoes={PAGINAS.map((p) => ({ valor: p.id, nome: p.nome }))}
      />
      <Seletor
        rotulo="Fonte"
        valor={filtros.fonte ?? ""}
        aoMudar={(v) => filtrar({ fonte: v || null })}
        opcoes={[{ valor: "", nome: "Todas as fontes" }, ...unir(opcoes.fontes, filtros.fonte).map((f) => ({ valor: f, nome: f }))]}
      />
      <Seletor
        rotulo="Campanha"
        valor={filtros.campanha ?? ""}
        aoMudar={(v) => filtrar({ campanha: v || null })}
        opcoes={[{ valor: "", nome: "Todas as campanhas" }, ...unir(opcoes.campanhas, filtros.campanha).map((c) => ({ valor: c, nome: c }))]}
      />
      <Seletor
        rotulo="Aparelho"
        valor={filtros.dispositivo ?? ""}
        aoMudar={(v) => filtrar({ dispositivo: v || null })}
        opcoes={[{ valor: "", nome: "Todos os aparelhos" }, ...Object.entries(NOMES_DISPOSITIVO).map(([valor, nome]) => ({ valor, nome }))]}
      />
    </>
  );

  return (
    <div className="sticky top-0 z-30 border-b border-[#dfe5ee] bg-[#eef1f6]/92 px-4 py-3 backdrop-blur sm:px-6 lg:px-8" role="region" aria-label="Filtros">
      <div className="flex flex-wrap items-center gap-2">
        <div className="-mx-1 flex max-w-full overflow-x-auto px-1 [scrollbar-width:none] sm:overflow-visible">
          <div className="inline-flex rounded-xl border border-[#d5dce6] bg-white p-1" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={filtros.periodo === p.id}
                onClick={() => filtrar({ periodo: p.id === "30d" ? null : p.id })}
                className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-[0.8125rem] font-semibold transition-colors ${
                  filtros.periodo === p.id ? "bg-[#002448] text-white" : "text-[#4a5870] hover:bg-[#eef1f6] hover:text-[#0a1f3f]"
                }`}
              >
                {p.nome}
              </button>
            ))}
            <PeriodoPersonalizado filtros={filtros} />
          </div>
        </div>

        {dimensoes && <div className="hidden flex-wrap items-center gap-2 lg:flex">{selects}</div>}

        {dimensoes && (
          <button
            type="button"
            onClick={() => setFolha(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d5dce6] bg-white px-3.5 text-[0.8125rem] font-semibold text-[#0a1f3f] lg:hidden"
            aria-haspopup="dialog"
            aria-controls={id}
          >
            <IconeFiltro className="size-[18px]" />
            Filtros
            {ativos.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-[#002448] text-[0.6875rem] text-white">{ativos.length}</span>}
          </button>
        )}

        {pendente && (
          <span className="ml-1 inline-flex items-center gap-2 text-[0.8125rem] text-[#5b677a]" role="status">
            <span className="size-3.5 animate-spin rounded-full border-2 border-[#c3cbd6] border-t-[#2a78d6]" aria-hidden="true" />
            Atualizando
          </span>
        )}
      </div>

      {ativos.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {ativos.map((a) => (
            <button
              key={a.chave}
              type="button"
              onClick={() => filtrar({ [a.chave]: null })}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#bcd2ef] bg-[#e9f1fc] py-1 pl-3 pr-2 text-[0.8125rem] font-medium text-[#184f95] hover:bg-[#dce9fa]"
            >
              {a.nome}
              <IconeX className="size-3.5" />
              <span className="sr-only">(remover filtro)</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => filtrar({ pagina: null, fonte: null, campanha: null, dispositivo: null, origem: null })}
            className="min-h-8 px-2 text-[0.8125rem] font-semibold text-[#4a5870] underline decoration-[#c3cbd6] underline-offset-4 hover:text-[#0a1f3f]"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {dimensoes && (
        <dialog
          id={id}
          ref={dialogo}
          onClose={() => setFolha(false)}
          className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-white p-0 text-[#0a1f3f] backdrop:bg-[#002448]/40 lg:hidden"
          aria-label="Filtros"
        >
          <div className="flex items-center justify-between border-b border-[#e3e8ef] px-5 py-4">
            <h2 className="text-[1rem] font-semibold">Filtros</h2>
            <button type="button" onClick={() => setFolha(false)} className="painel-icone" aria-label="Fechar">
              <IconeX className="size-5" />
            </button>
          </div>
          <div className="flex flex-col gap-4 px-5 py-5 [&_select]:w-full [&_label]:w-full">{selects}</div>
          <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <button type="button" onClick={() => setFolha(false)} className="min-h-12 w-full rounded-xl bg-[#002448] font-semibold text-white">
              Ver resultados
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}

function unir(lista: string[], atual: string | null) {
  return atual && !lista.includes(atual) ? [atual, ...lista] : lista;
}

function Seletor({ rotulo, valor, aoMudar, opcoes }: { rotulo: string; valor: string; aoMudar: (v: string) => void; opcoes: { valor: string; nome: string }[] }) {
  return (
    <label className="flex flex-col gap-1 lg:block">
      <span className="text-[0.75rem] font-semibold text-[#4a5870] lg:sr-only">{rotulo}</span>
      <span className="relative block">
        <select
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          className="min-h-11 w-full appearance-none truncate rounded-xl border border-[#d5dce6] bg-white py-2 pl-3.5 pr-9 text-[0.8125rem] font-medium text-[#0a1f3f] lg:max-w-[15rem]"
        >
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.nome}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#4a5870]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}

function PeriodoPersonalizado({ filtros }: { filtros: Filtros }) {
  const { filtrar } = useTransicao();
  const [aberto, setAberto] = useState(false);
  const [de, setDe] = useState(filtros.de);
  const [ate, setAte] = useState(filtros.ate);
  const id = useId();
  const ativo = filtros.periodo === "personalizado";
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        aria-pressed={ativo}
        onClick={() => setAberto(!aberto)}
        className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-[0.8125rem] font-semibold transition-colors ${
          ativo ? "bg-[#002448] text-white" : "text-[#4a5870] hover:bg-[#eef1f6] hover:text-[#0a1f3f]"
        }`}
      >
        {ativo ? `${filtros.de.split("-").reverse().join("/")} – ${filtros.ate.split("-").reverse().join("/")}` : "Personalizado"}
      </button>
      {aberto && (
        <form
          id={id}
          onSubmit={(e) => {
            e.preventDefault();
            if (!de || !ate || de > ate) return;
            setAberto(false);
            filtrar({ periodo: "personalizado", de, ate });
          }}
          className="fixed inset-x-4 top-28 z-50 flex flex-col gap-3 rounded-2xl border border-[#d5dce6] bg-white p-4 shadow-[0_16px_40px_rgba(10,31,63,0.18)] sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-72"
        >
          <label className="flex flex-col gap-1 text-[0.75rem] font-semibold text-[#4a5870]">
            De
            <input type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} className="min-h-11 rounded-xl border border-[#d5dce6] px-3 text-[0.875rem] text-[#0a1f3f]" required />
          </label>
          <label className="flex flex-col gap-1 text-[0.75rem] font-semibold text-[#4a5870]">
            Até
            <input type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} className="min-h-11 rounded-xl border border-[#d5dce6] px-3 text-[0.875rem] text-[#0a1f3f]" required />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAberto(false)} className="min-h-11 flex-1 rounded-xl border border-[#d5dce6] text-[0.875rem] font-semibold">
              Cancelar
            </button>
            <button type="submit" className="min-h-11 flex-1 rounded-xl bg-[#002448] text-[0.875rem] font-semibold text-white">
              Aplicar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
