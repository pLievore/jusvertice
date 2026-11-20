"use client";

import { useId, useState } from "react";
import type { Pagina } from "@/content/tipos";
import { track } from "@/lib/tracking";
import { PlusIcon } from "../icons";
import { CabecalhoSecao } from "../Marcos";
import { WhatsAppLink } from "../WhatsAppLink";

type Item = { pergunta: string; resposta: string };

export function Faq({ pagina, itens }: { pagina: Pagina; itens: Item[] }) {
  const faq = pagina.faq;
  const [aberta, setAberta] = useState<number | null>(null);
  const base = useId();

  return (
    <section id="duvidas" aria-labelledby="faq-titulo" className="bg-surface py-24 md:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <CabecalhoSecao id="faq-titulo" rotulo={faq.eyebrow} titulo={faq.titulo} />
          <WhatsAppLink origem={pagina.origens.faq} arrow className="btn btn-ghost mt-8">
            {faq.cta}
          </WhatsAppLink>
        </div>

        <ul className="flex flex-col gap-3" data-reveal>
          {itens.map((item, i) => {
            const open = aberta === i;
            const btnId = `${base}-q${i}`;
            const panelId = `${base}-a${i}`;
            return (
              <li key={item.pergunta} className={`rounded-[1.25rem] border bg-card transition-colors duration-300 ${open ? "border-stage" : "border-border"}`}>
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => {
                      setAberta(open ? null : i);
                      if (!open) track("faq_aberta", { pergunta: item.pergunta });
                    }}
                    className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-[1.0625rem] font-semibold leading-snug md:px-7 md:py-6 md:text-[1.1875rem]"
                  >
                    {item.pergunta}
                    <span
                      aria-hidden="true"
                      className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-300 ${open ? "bg-stage text-gold" : "bg-surface text-foreground"}`}
                    >
                      <PlusIcon size={18} className={`transition-transform duration-500 ease-[var(--ease-editorial)] ${open ? "rotate-45" : ""}`} />
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={btnId} className="faq-panel" data-open={open}>
                  <div>
                    <p className="max-w-[42rem] px-5 pb-6 text-muted md:px-7 md:pb-7 md:text-[1.0625rem]">{item.resposta}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
