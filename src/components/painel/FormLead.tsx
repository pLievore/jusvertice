"use client";

import { useActionState, useState } from "react";
import { criarLead, type EstadoForm, salvarLead } from "@/app/admin/acoes";
import type { Lead } from "@/lib/painel/consultas";
import { STATUS_LEAD } from "@/lib/painel/formato";
import { ESTILO_STATUS } from "./StatusLead";

const SERVICOS = [
  "Averbação de construção",
  "Escritura e registro",
  "Inventário e partilha",
  "Compra sem escritura",
  "Topografia e levantamento",
  "Georreferenciamento e certificação",
  "Retificação de área",
  "Desmembramento",
  "Partilha de imóvel rural",
];

const FONTES_MANUAIS = ["Indicação", "Telefone", "Instagram (mensagem direta)", "Visita ao escritório", "Outro"];

const campo = "min-h-11 w-full rounded-xl border border-[#cdd5df] bg-white px-3.5 text-[0.9375rem] text-[#0a1f3f] outline-none transition-shadow focus:border-[#2a78d6] focus:shadow-[0_0_0_3px_rgba(42,120,214,0.18)]";
const rotulo = "text-[0.8125rem] font-semibold text-[#4a5870]";

function valorInicial(v: number | null | undefined) {
  return v === null || v === undefined ? "" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Andamento({ inicial }: { inicial: string }) {
  const [status, setStatus] = useState(inicial);
  return (
    <fieldset>
      <legend className={rotulo}>Andamento</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STATUS_LEAD.map((s) => {
          const e = ESTILO_STATUS[s.id];
          const marcado = status === s.id;
          return (
            <label
              key={s.id}
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 text-[0.8125rem] font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#2a78d6] ${
                marcado ? "border-[#002448] bg-[#f4f7fb] text-[#0a1f3f]" : "border-[#e1e6ee] text-[#4a5870] hover:border-[#c3cbd6]"
              }`}
            >
              <input type="radio" name="status" value={s.id} checked={marcado} onChange={() => setStatus(s.id)} className="sr-only" />
              <span className="grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] text-white" style={{ background: e.cor }} aria-hidden="true">
                {marcado ? "✓" : ""}
              </span>
              {s.nome}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Mensagem({ estado }: { estado: EstadoForm }) {
  return (
    <p aria-live="polite" className="min-h-6 text-[0.875rem] font-medium">
      {estado?.erro && <span className="text-[#b42318]">{estado.erro}</span>}
      {estado?.ok && <span className="text-[#006300]">✓ {estado.ok}</span>}
    </p>
  );
}

export function FormLead({ lead }: { lead: Lead }) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(salvarLead, null);
  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="codigo" value={lead.codigo} />
      <Andamento inicial={lead.status} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Valor (contrato ou proposta)</span>
          <span className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] text-[#6b7688]">R$</span>
            <input name="valor" inputMode="decimal" defaultValue={valorInicial(lead.valor)} placeholder="0,00" className={`${campo} pl-10`} />
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Serviço</span>
          <input name="servico" list="servicos" defaultValue={lead.servico ?? ""} placeholder="Escolha ou escreva" className={campo} />
          <datalist id="servicos">
            {SERVICOS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={rotulo}>Nome do cliente</span>
          <input name="nome" defaultValue={lead.nome ?? ""} autoComplete="off" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={rotulo}>Anotações</span>
          <textarea name="notas" defaultValue={lead.notas ?? ""} rows={4} className={`${campo} py-3`} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pendente} className="min-h-12 rounded-full bg-[#002448] px-7 font-semibold text-white transition-colors hover:bg-[#0a3262] disabled:opacity-60">
          {pendente ? "Salvando…" : "Salvar"}
        </button>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

export function FormNovoLead() {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(criarLead, null);
  return (
    <form action={acao} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Nome do cliente</span>
          <input name="nome" required autoComplete="off" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Como chegou</span>
          <select name="fonte" className={campo} defaultValue="Indicação">
            {FONTES_MANUAIS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
      <Andamento inicial="nova" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Valor (contrato ou proposta)</span>
          <span className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] text-[#6b7688]">R$</span>
            <input name="valor" inputMode="decimal" placeholder="0,00" className={`${campo} pl-10`} />
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Serviço</span>
          <input name="servico" list="servicos-novo" placeholder="Escolha ou escreva" className={campo} />
          <datalist id="servicos-novo">
            {SERVICOS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={rotulo}>Anotações</span>
          <textarea name="notas" rows={3} className={`${campo} py-3`} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pendente} className="min-h-12 rounded-full bg-[#002448] px-7 font-semibold text-white transition-colors hover:bg-[#0a3262] disabled:opacity-60">
          {pendente ? "Criando…" : "Criar lead"}
        </button>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

/** Excluir pede confirmação no próprio botão (sem janela do navegador). */
export function BotaoExcluir({ acao, codigo }: { acao: (dados: FormData) => Promise<void>; codigo: string }) {
  const [confirmar, setConfirmar] = useState(false);
  return (
    <form action={acao} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="codigo" value={codigo} />
      {confirmar ? (
        <>
          <span className="text-[0.8125rem] text-[#4a5870]">Excluir este lead de vez?</span>
          <button type="submit" className="min-h-10 rounded-full bg-[#b42318] px-4 text-[0.8125rem] font-semibold text-white">
            Sim, excluir
          </button>
          <button type="button" onClick={() => setConfirmar(false)} className="min-h-10 px-2 text-[0.8125rem] font-semibold text-[#4a5870]">
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmar(true)} className="min-h-10 px-1 text-[0.8125rem] font-semibold text-[#b42318] underline decoration-[#f0b4ab] underline-offset-4">
          Excluir lead
        </button>
      )}
    </form>
  );
}
