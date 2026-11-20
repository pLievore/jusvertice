import { cookies } from "next/headers";
import { COOKIE_DEMO } from "@/lib/painel/sessao";
import { BotaoDemo } from "./BotaoDemo";

/** Aviso fixo enquanto o painel mostra dados de demonstração (nunca se confunde com o real). */
export async function FaixaDemo() {
  const demo = (await cookies()).get(COOKIE_DEMO)?.value === "1";
  if (!demo) return null;
  return (
    <section aria-label="Aviso" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-[#cca85e] px-4 py-2 text-center text-[0.8125rem] font-semibold text-[#002448]">
      <span>Você está vendo dados de demonstração. Nada aqui é real.</span>
      <BotaoDemo ligar={false} className="rounded-full bg-[#002448] px-3 py-1 text-[0.75rem] text-white hover:bg-[#0a3262]">
        Voltar aos dados reais
      </BotaoDemo>
    </section>
  );
}
