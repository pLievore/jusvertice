"use client";

import { type ReactNode, useTransition } from "react";
import { alternarDemo } from "@/app/admin/acoes";

export function BotaoDemo({ ligar, className, children }: { ligar: boolean; className?: string; children: ReactNode }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button type="button" disabled={pendente} onClick={() => iniciar(() => alternarDemo(ligar))} className={`${className} disabled:opacity-60`}>
      {pendente ? "Trocando…" : children}
    </button>
  );
}
