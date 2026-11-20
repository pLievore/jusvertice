import type { ReactNode } from "react";
import { Monogram } from "@/components/Logo";

/** Título da tela (na voz da marca: condensada, caixa alta) e o resumo do recorte. */
export function CabecalhoPagina({ titulo, descricao, acoes }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pb-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex min-w-0 items-center gap-3">
        <Monogram id={`logo-cabecalho-${titulo}`} variante="papel" className="h-8 w-auto lg:hidden" />
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] font-semibold uppercase leading-none tracking-[0.005em] text-[#0a1f3f] sm:text-[2rem]">{titulo}</h1>
          {descricao && <p className="mt-1.5 text-[0.875rem] text-[#5b677a]">{descricao}</p>}
        </div>
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}
