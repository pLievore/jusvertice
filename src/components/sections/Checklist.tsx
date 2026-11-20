"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { Pagina } from "@/content/tipos";
import { CheckIcon } from "../icons";
import { CabecalhoSecao, Vertice } from "../Marcos";
import { WhatsAppLink } from "../WhatsAppLink";

/**
 * Autodiagnóstico num painel azul (o mesmo cartão azul dos posts): o que a pessoa marca
 * vai junto na mensagem do WhatsApp. No celular o painel ocupa a largura toda.
 */
export function Checklist({ pagina, microcopy }: { pagina: Pagina; microcopy: string }) {
  const checklist = pagina.checklist;
  const [marcados, setMarcados] = useState<string[]>([]);
  const listaRef = useRef<HTMLUListElement>(null);

  // Quem marcou algo antes do JS carregar (4G lento) não perde o que marcou.
  useEffect(() => {
    const ja = Array.from(listaRef.current?.querySelectorAll<HTMLInputElement>("input:checked") ?? [], (i) => i.value);
    if (ja.length) setMarcados((prev) => Array.from(new Set([...prev, ...ja])));
  }, []);

  const alternar = (id: string, on: boolean) =>
    setMarcados((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));

  const extra = marcados.length
    ? "O que marquei no site:\n" +
      checklist.itens
        .filter((i) => marcados.includes(i.id))
        .map((i) => `• ${i.texto}`)
        .join("\n")
    : undefined;

  return (
    <section id="checklist" aria-labelledby="checklist-titulo" className="relative md:pb-32">
      <div className="mx-auto max-w-[80rem] md:px-[var(--gutter)]">
        <div className="on-stage relative overflow-hidden px-[var(--gutter)] py-20 md:rounded-[2rem] md:px-14 md:py-20 lg:px-20">
          <div className="relative grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
            <div className="lg:self-start">
              <CabecalhoSecao id="checklist-titulo" rotulo={checklist.eyebrow} titulo={checklist.titulo} intro={checklist.intro} />
              <p className="mt-8 max-w-[30rem] border-l-2 border-gold pl-4 text-[0.9688rem] text-stage-muted" data-reveal>
                {checklist.fecho}
              </p>
            </div>

            <div>
              <fieldset>
                <legend className="sr-only">{checklist.titulo}</legend>
                <ul ref={listaRef} className="border-b border-border">
                  {checklist.itens.map((item, i) => (
                    <li key={item.id} data-reveal style={{ "--i": i } as CSSProperties}>
                      <label className="check-row">
                        {/* Não controlado de propósito: um `checked` controlado seria ressincronizado
                            para false na hidratação e apagaria o que foi marcado antes do JS carregar. */}
                        <input
                          type="checkbox"
                          value={item.id}
                          onChange={(e) => alternar(item.id, e.target.checked)}
                          className="sr-only"
                        />
                        <span className="check-box" aria-hidden="true">
                          <CheckIcon size={16} />
                        </span>
                        <span className="text-[1.125rem] font-medium leading-snug md:text-[1.25rem]">{item.texto}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>

              <div className="mt-10 flex flex-col items-stretch gap-4 sm:items-start" data-reveal>
                <WhatsAppLink origem={pagina.origens.checklist} extra={extra} arrow className="btn btn-primary w-full sm:w-auto">
                  {checklist.cta}
                </WhatsAppLink>
                <p className="flex items-center gap-2.5 text-[0.9375rem] text-stage-muted" aria-live="polite">
                  <Vertice size={12} className={marcados.length ? "text-gold" : "text-stage-muted"} />
                  {marcados.length > 0
                    ? `${marcados.length === 1 ? "O ponto marcado vai" : `Os ${marcados.length} pontos marcados vão`} junto na mensagem.`
                    : microcopy}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Estágio 2 do funil: passou do checklist */}
      <div id="checklist-fim" aria-hidden="true" className="absolute bottom-0 h-px w-full" />
    </section>
  );
}
