"use client";

import { useActionState } from "react";
import { entrar, type EstadoForm } from "../acoes";

export function FormEntrar({ volta }: { volta: string }) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(entrar, null);

  return (
    <form action={acao} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="volta" value={volta} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] font-semibold text-[#4a5870]">Senha</span>
        <input
          type="password"
          name="senha"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={Boolean(estado?.erro)}
          aria-describedby={estado?.erro ? "erro-senha" : undefined}
          className="min-h-12 rounded-xl border border-[#cdd5df] px-4 text-[1rem] text-[#0a1f3f] outline-none transition-shadow focus:border-[#2a78d6] focus:shadow-[0_0_0_3px_rgba(42,120,214,0.2)]"
        />
      </label>
      {estado?.erro && (
        <p id="erro-senha" role="alert" className="rounded-xl bg-[#fdecea] px-3.5 py-2.5 text-[0.875rem] font-medium text-[#b42318]">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="min-h-12 rounded-full bg-[#002448] text-[1rem] font-semibold text-white transition-colors hover:bg-[#0a3262] disabled:opacity-60"
      >
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
