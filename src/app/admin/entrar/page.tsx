import type { Metadata } from "next";
import { Suspense } from "react";
import { Monogram, Wordmark } from "@/components/Logo";
import { Arco } from "@/components/Marcos";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function Entrar({ searchParams }: PageProps<"/admin/entrar">) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#002448] px-4 py-10">
      <Arco className="absolute -bottom-40 -right-40 w-[38rem] text-[#cca85e] opacity-90" />
      <Arco className="absolute -left-56 -top-56 w-[30rem] rotate-180 text-white/5" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3 text-white">
          <Monogram id="logo-entrar" className="h-12 w-auto" />
          <span className="flex flex-col leading-none">
            <Wordmark className="!text-[1.75rem]" />
            <span className="mt-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-[#cca85e]">Painel de resultados</span>
          </span>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:p-8">
          <h1 className="font-display text-[1.75rem] font-semibold uppercase leading-none text-[#0a1f3f]">Entrar</h1>
          <p className="mt-2 text-[0.9375rem] text-[#4a5870]">Acesso restrito à equipe da JusVértice.</p>
          <Suspense fallback={<FormEntrar volta="/admin" />}>
            <ComVolta searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function ComVolta({ searchParams }: { searchParams: PageProps<"/admin/entrar">["searchParams"] }) {
  const sp = await searchParams;
  const volta = typeof sp.volta === "string" ? sp.volta : "/admin";
  return <FormEntrar volta={volta} />;
}
