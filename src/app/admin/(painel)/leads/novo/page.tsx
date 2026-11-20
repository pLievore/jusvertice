import type { Metadata } from "next";
import Link from "next/link";
import { Cartao } from "@/components/painel/blocos";
import { FormNovoLead } from "@/components/painel/FormLead";
import { IconeVoltar } from "@/components/painel/icones";

export const metadata: Metadata = { title: "Novo lead" };

/** Para quem chegou fora do site (indicação, telefone, Instagram): entra no funil igual. */
export default function NovoLead() {
  return (
    <>
      <header className="px-4 pb-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <Link href="/admin/leads" className="inline-flex min-h-10 items-center gap-2 text-[0.875rem] font-semibold text-[#1c5cab]">
          <IconeVoltar className="size-[18px]" />
          Leads
        </Link>
        <h1 className="mt-2 font-display text-[1.75rem] font-semibold uppercase leading-none text-[#0a1f3f] sm:text-[2rem]">Novo lead</h1>
        <p className="mt-2 text-[0.875rem] text-[#5b677a]">Para clientes que chegaram fora do site. Os que chamam pelo site entram sozinhos.</p>
      </header>
      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <Cartao className="max-w-3xl">
          <FormNovoLead />
        </Cartao>
      </div>
    </>
  );
}
