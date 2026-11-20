"use client";

import { type ReactNode, useId, useState } from "react";

export type Tabela = { colunas: string[]; linhas: (string | number)[][] };

/**
 * Cartão de gráfico com a "versão em tabela" (o gêmeo acessível de todo gráfico) e o download
 * em CSV dos mesmos números. A tabela também é o que o leitor de tela lê.
 */
export function CartaoGrafico({
  titulo,
  subtitulo,
  tabela,
  arquivo,
  children,
  className = "",
  extra,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  tabela: Tabela;
  arquivo: string;
  children: ReactNode;
  className?: string;
  extra?: ReactNode;
}) {
  const [modo, setModo] = useState<"grafico" | "tabela">("grafico");
  const idTabela = useId();

  const baixar = () => {
    const celula = (v: string | number) => {
      const t = String(v);
      return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    // Ponto e vírgula + BOM: abre direto no Excel em português.
    const csv = "﻿" + [tabela.colunas, ...tabela.linhas].map((l) => l.map(celula).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${arquivo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={`painel-cartao flex min-w-0 flex-col ${className}`} aria-label={titulo}>
      <header className="flex items-start justify-between gap-3 px-5 pt-4 sm:px-6 sm:pt-5">
        <div className="min-w-0">
          <h2 className="text-[0.9688rem] font-semibold leading-snug text-[#0a1f3f]">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 text-[0.8125rem] leading-snug text-[#5b677a]">{subtitulo}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {extra}
          <button
            type="button"
            onClick={() => setModo(modo === "grafico" ? "tabela" : "grafico")}
            aria-pressed={modo === "tabela"}
            aria-controls={idTabela}
            className="painel-icone"
            title={modo === "grafico" ? "Ver como tabela" : "Ver como gráfico"}
          >
            <span className="sr-only">{modo === "grafico" ? "Ver como tabela" : "Ver como gráfico"}</span>
            {modo === "grafico" ? (
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M4 19.5h16M7 16V11M12 16V6M17 16v-3" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button type="button" onClick={baixar} className="painel-icone" title="Baixar CSV">
            <span className="sr-only">Baixar os dados de {titulo} em CSV</span>
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19.5h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>
      <div className="flex min-w-0 flex-1 flex-col px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
        <div hidden={modo === "tabela"}>{children}</div>
        <div id={idTabela} className={modo === "tabela" ? "max-h-[22rem] overflow-auto" : "sr-only"}>
          <table className="w-full border-collapse text-left text-[0.8125rem]">
            <caption className="sr-only">{titulo}</caption>
            <thead className="sticky top-0 bg-white">
              <tr>
                {tabela.colunas.map((c, i) => (
                  <th key={c} scope="col" className={`border-b border-[#e3e8ef] py-2 pr-4 font-semibold text-[#4a5870] ${i > 0 ? "text-right" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.linhas.map((linha, i) => (
                <tr key={i} className="border-b border-[#eef1f5] last:border-0">
                  {linha.map((v, j) =>
                    j === 0 ? (
                      <th key={j} scope="row" className="py-2 pr-4 font-normal text-[#0a1f3f]">
                        {v}
                      </th>
                    ) : (
                      <td key={j} className="py-2 pr-4 text-right tabular-nums text-[#0a1f3f]">
                        {v}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
