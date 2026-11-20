"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lead } from "@/lib/painel/consultas";
import { dataHora, moeda, nomeOrigem, STATUS_LEAD } from "@/lib/painel/formato";
import { ESTILO_STATUS } from "./StatusLead";

/**
 * Leads em quadro (uma coluna por andamento) a partir de telas largas; no celular, abas por
 * andamento e uma lista. Cada cartão abre o lead para marcar o andamento e o valor.
 */
export function QuadroLeads({ leads }: { leads: Lead[] }) {
  const [aba, setAba] = useState<string>("todos");
  const [limite, setLimite] = useState(20);
  const porStatus = (status: string) => leads.filter((l) => l.status === status);
  const lista = aba === "todos" ? leads : porStatus(aba);

  return (
    <>
      <div className="hidden gap-3 xl:grid xl:grid-cols-5">
        {STATUS_LEAD.map((s) => {
          const itens = porStatus(s.id);
          const e = ESTILO_STATUS[s.id];
          return (
            <section key={s.id} className="flex min-w-0 flex-col rounded-2xl bg-[#e6eaf1] p-2" aria-label={`${s.nome}: ${itens.length}`}>
              <header className="flex items-center justify-between px-2 py-2">
                <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[#0a1f3f]">
                  <span className="size-2.5 rounded-full" style={{ background: e.cor }} aria-hidden="true" />
                  {s.nome}
                </h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.75rem] font-semibold tabular-nums text-[#4a5870]">{itens.length}</span>
              </header>
              <ul className="flex max-h-[38rem] flex-col gap-2 overflow-y-auto p-0.5">
                {itens.slice(0, 60).map((l) => (
                  <li key={l.codigo}>
                    <CartaoLead lead={l} />
                  </li>
                ))}
                {itens.length > 60 && <li className="px-2 py-1 text-[0.75rem] text-[#4a5870]">+ {itens.length - 60} neste andamento. Use a busca ou um período menor.</li>}
                {!itens.length && <li className="px-2 py-6 text-center text-[0.75rem] text-[#4a5870]">Nenhum lead</li>}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="xl:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 [scrollbar-width:none]" role="tablist" aria-label="Andamento">
          {[{ id: "todos", nome: "Todos" }, ...STATUS_LEAD].map((s) => {
            const n = s.id === "todos" ? leads.length : porStatus(s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={aba === s.id}
                onClick={() => {
                  setAba(s.id);
                  setLimite(20);
                }}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[0.8125rem] font-semibold ${
                  aba === s.id ? "border-[#002448] bg-[#002448] text-white" : "border-[#d5dce6] bg-white text-[#4a5870]"
                }`}
              >
                {s.nome}
                <span className="tabular-nums opacity-80">{n}</span>
              </button>
            );
          })}
        </div>
        <div role="tabpanel" aria-label="Leads do andamento escolhido">
        <ul className="grid gap-2 sm:grid-cols-2">
          {lista.slice(0, limite).map((l) => (
            <li key={l.codigo}>
              <CartaoLead lead={l} mostrarStatus={aba === "todos"} />
            </li>
          ))}
          {!lista.length && <li className="py-10 text-center text-[0.875rem] text-[#4a5870]">Nenhum lead neste andamento.</li>}
        </ul>
        </div>
        {lista.length > limite && (
          <button
            type="button"
            onClick={() => setLimite((n) => n + 20)}
            className="mt-3 min-h-11 w-full rounded-xl border border-[#d5dce6] bg-white text-[0.875rem] font-semibold text-[#0a1f3f]"
          >
            Mostrar mais {Math.min(20, lista.length - limite)} de {lista.length - limite} restantes
          </button>
        )}
      </div>
    </>
  );
}

function CartaoLead({ lead, mostrarStatus = false }: { lead: Lead; mostrarStatus?: boolean }) {
  const e = ESTILO_STATUS[lead.status] ?? ESTILO_STATUS.nova;
  return (
    <Link
      href={`/admin/leads/${encodeURIComponent(lead.codigo)}`}
      className="block rounded-xl border border-[#e1e6ee] bg-white p-3 shadow-[0_1px_2px_rgba(10,31,63,0.05)] transition-[border-color,box-shadow] hover:border-[#bcd2ef] hover:shadow-[0_6px_16px_-10px_rgba(10,31,63,0.25)]"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-[0.875rem] font-semibold text-[#0a1f3f]">{lead.nome ?? "Sem nome"}</span>
          <span className="font-mono text-[0.75rem] text-[#4a5870]">{lead.codigo}</span>
        </span>
        {lead.valor !== null && <span className="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-[#0a1f3f]">{moeda(lead.valor, false)}</span>}
      </span>
      <span className="mt-2 block text-[0.75rem] leading-snug text-[#4a5870]">
        {nomeOrigem(lead.origem)}
        {lead.utm_campaign ? ` · ${lead.utm_campaign}` : lead.fonte ? ` · ${lead.fonte}` : ""}
      </span>
      <span className="mt-2 flex items-center justify-between gap-2 text-[0.6875rem] text-[#6b7688]">
        <span>{dataHora(lead.criado_em)}</span>
        {mostrarStatus ? (
          <span className="inline-flex items-center gap-1 font-semibold" style={{ color: e.texto }}>
            <span aria-hidden="true">{e.icone}</span>
            {STATUS_LEAD.find((s) => s.id === lead.status)?.nome}
          </span>
        ) : (
          lead.cidade && <span>{lead.cidade}</span>
        )}
      </span>
    </Link>
  );
}
