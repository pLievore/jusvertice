"use client";

import { useEffect, useState } from "react";
import { INTERNO_KEY } from "@/lib/tracking";

function ler() {
  try {
    return window.localStorage.getItem(INTERNO_KEY) === "1";
  } catch {
    return false;
  }
}

function gravar(interno: boolean) {
  try {
    if (interno) window.localStorage.setItem(INTERNO_KEY, "1");
    else window.localStorage.removeItem(INTERNO_KEY);
  } catch {
    // Aba anônima ou armazenamento bloqueado: o aparelho continua contando.
  }
}

/** Quem entra no painel é da equipe: este aparelho para de contar como visita no site. */
export function MarcarAparelhoInterno() {
  useEffect(() => {
    if (window.localStorage && !window.localStorage.getItem(`${INTERNO_KEY}_escolhido`)) gravar(true);
  }, []);
  return null;
}

/** Chave da Configuração: contar ou não as visitas deste aparelho. */
export function ChaveAparelhoInterno() {
  const [interno, setInterno] = useState<boolean | null>(null);
  useEffect(() => setInterno(ler()), []);
  if (interno === null) return <p className="text-[0.875rem] text-[#6b7688]">Verificando este aparelho…</p>;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="max-w-[34rem] text-[0.875rem] text-[#4a5870]">
        {interno
          ? "Este aparelho está marcado como interno: as visitas e cliques feitos nele não entram nos números."
          : "Este aparelho conta como um visitante comum. Marque como interno para não misturar os testes da equipe com os resultados."}
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={interno}
        onClick={() => {
          const novo = !interno;
          gravar(novo);
          try {
            window.localStorage.setItem(`${INTERNO_KEY}_escolhido`, "1");
          } catch {
            // segue sem lembrar a escolha
          }
          setInterno(novo);
        }}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${interno ? "bg-[#002448]" : "bg-[#c3cbd6]"}`}
      >
        <span className="sr-only">Não contar as visitas deste aparelho</span>
        <span className={`inline-block size-6 rounded-full bg-white shadow transition-transform ${interno ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
