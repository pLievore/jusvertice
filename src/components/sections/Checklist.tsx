"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { checklist } from "@/content/site";
import { CheckIcon } from "../icons";
import { WhatsAppLink } from "../WhatsAppLink";

export function Checklist({ microcopy }: { microcopy: string }) {
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
    <section id="checklist" aria-labelledby="checklist-titulo" className="relative py-24 md:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow" data-reveal>
            {checklist.eyebrow}
          </p>
          <h2 id="checklist-titulo" className="titulo mt-5" data-reveal style={{ "--i": 1 } as CSSProperties}>
            {checklist.titulo}
          </h2>
          <p className="mt-6 max-w-[28rem] text-muted md:text-lg" data-reveal style={{ "--i": 2 } as CSSProperties}>
            {checklist.intro}
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
                      <CheckIcon size={15} />
                    </span>
                    <span className="font-display text-[1.3rem] leading-snug md:text-[1.5rem]">{item.texto}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <blockquote className="mt-12 max-w-[34rem] font-display text-[1.35rem] italic leading-snug text-muted md:text-[1.6rem]" data-reveal>
            “{checklist.fecho}”
          </blockquote>

          <div className="mt-10" data-reveal>
            <WhatsAppLink origem="checklist" extra={extra} arrow className="btn btn-primary w-full sm:w-auto">
              {checklist.cta}
            </WhatsAppLink>
            <p className="meta mt-3" aria-live="polite">
              {marcados.length > 0
                ? `${marcados.length === 1 ? "O ponto marcado vai" : `Os ${marcados.length} pontos marcados vão`} junto na mensagem.`
                : microcopy}
            </p>
          </div>
        </div>
      </div>
      {/* Estágio 2 do funil: passou do checklist */}
      <div id="checklist-fim" aria-hidden="true" className="absolute bottom-0 h-px w-full" />
    </section>
  );
}
