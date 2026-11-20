"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useTransition } from "react";
import { comFiltros } from "@/lib/painel/filtros";

/**
 * Navegação dos filtros. Enquanto os dados novos chegam, a tela atual continua no lugar com
 * opacidade reduzida (sem esqueleto piscando, sem a página pular).
 * Caminho e filtros atuais são lidos na hora do clique (window.location): nada de dado de URL
 * no layout, que assim não precisa de Suspense.
 */
type Ctx = { pendente: boolean; filtrar: (mudancas: Record<string, string | null>) => void; ir: (url: string) => void };

const Contexto = createContext<Ctx>({ pendente: false, filtrar: () => {}, ir: () => {} });

export function TransicaoProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const ir = useCallback((url: string) => iniciar(() => router.push(url, { scroll: false })), [router]);
  const filtrar = useCallback(
    (mudancas: Record<string, string | null>) => ir(`${window.location.pathname}${comFiltros(window.location.search, mudancas)}`),
    [ir],
  );

  return <Contexto value={{ pendente, filtrar, ir }}>{children}</Contexto>;
}

export function useTransicao() {
  return useContext(Contexto);
}

/** Área de dados: esmaece enquanto a navegação dos filtros está em andamento. */
export function AreaDados({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { pendente } = useTransicao();
  return (
    <div className={`transition-opacity duration-200 ${pendente ? "opacity-55" : ""} ${className}`} aria-busy={pendente}>
      {children}
    </div>
  );
}
