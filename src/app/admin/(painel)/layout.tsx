import Link from "next/link";
import { Suspense } from "react";
import { Monogram, Wordmark } from "@/components/Logo";
import { FaixaDemo } from "@/components/painel/FaixaDemo";
import { IconeExterno, IconeSair } from "@/components/painel/icones";
import { MarcarAparelhoInterno } from "@/components/painel/AparelhoInterno";
import { NavInferior, NavLateral } from "@/components/painel/NavPainel";
import { TransicaoProvider } from "@/components/painel/Transicao";
import { sair } from "../acoes";

/** Moldura do painel: menu lateral no azul da marca (desktop) e barra de abas embaixo (celular). */
export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <TransicaoProvider>
      <a
        href="#painel-conteudo"
        className="sr-only-focusable fixed left-4 top-4 z-[60] rounded-full bg-[#cca85e] px-5 py-3 font-semibold text-[#002448]"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#002448] px-4 pb-5 pt-6 text-white lg:flex">
        <Link href="/admin" className="flex min-h-11 items-center gap-3 px-2">
          <Monogram id="logo-painel" className="h-9 w-auto" />
          <span className="flex flex-col leading-none">
            <Wordmark className="!text-[1.35rem]" />
            <span className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#cca85e]">Painel</span>
          </span>
        </Link>
        <NavLateral />
        <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[0.875rem] text-[#afbcd1] transition-colors hover:bg-white/5 hover:text-white"
          >
            <IconeExterno className="size-[18px]" />
            Ver o site
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          <form action={sair}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[0.875rem] text-[#afbcd1] transition-colors hover:bg-white/5 hover:text-white"
            >
              <IconeSair className="size-[18px]" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="pb-24 lg:pb-0 lg:pl-60">
        <Suspense fallback={null}>
          <FaixaDemo />
        </Suspense>
        <main id="painel-conteudo" tabIndex={-1} className="outline-none">
          {children}
        </main>
      </div>

      <NavInferior />
      <MarcarAparelhoInterno />
    </TransicaoProvider>
  );
}
