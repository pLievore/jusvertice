"use client";

import { type CSSProperties, useId, useState } from "react";
import { faq } from "@/content/site";
import { track } from "@/lib/tracking";
import { PlusIcon } from "../icons";
import { WhatsAppLink } from "../WhatsAppLink";

type Item = { pergunta: string; resposta: string };

export function Faq({ itens }: { itens: Item[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const base = useId();

  return (
    <section aria-labelledby="faq-titulo" className="border-t border-border py-24 md:py-36">
      <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow" data-reveal>
            {faq.eyebrow}
          </p>
          <h2 id="faq-titulo" className="titulo mt-5" data-reveal style={{ "--i": 1 } as CSSProperties}>
            {faq.titulo}
          </h2>
          <WhatsAppLink origem="faq" arrow className="link-quiet mt-8" >
            {faq.cta}
          </WhatsAppLink>
        </div>

        <ul className="border-b border-border" data-reveal>
          {itens.map((item, i) => {
            const open = aberta === i;
            const btnId = `${base}-q${i}`;
            const panelId = `${base}-a${i}`;
            return (
              <li key={item.pergunta} className="border-t border-border">
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
                    className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-[1.3rem] leading-snug md:text-[1.55rem]"
                  >
                    {item.pergunta}
                    <PlusIcon
                      size={22}
                      className={`shrink-0 text-muted transition-transform duration-500 ease-[var(--ease-editorial)] ${open ? "rotate-45" : ""}`}
                    />
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={btnId} className="faq-panel" data-open={open}>
                  <div>
                    <p className="max-w-[40rem] pb-7 pr-10 text-muted md:text-lg">{item.resposta}</p>
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
