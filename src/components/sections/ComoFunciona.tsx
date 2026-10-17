"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { type CSSProperties, useRef } from "react";
import { comoFunciona, microcopyDiagnostico } from "@/content/site";
import { WhatsAppLink } from "../WhatsAppLink";

/** Linha que liga os três passos e se desenha conforme a rolagem (vertical no celular, horizontal no desktop). */
export function ComoFunciona() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 45%"] });
  const linha = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section aria-labelledby="como-titulo" className="on-stage relative overflow-hidden py-24 md:py-36">
      <div className="container-x">
        <p className="eyebrow" data-reveal>
          {comoFunciona.eyebrow}
        </p>
        <h2 id="como-titulo" className="titulo mt-5 max-w-[16ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
          {comoFunciona.titulo}
        </h2>

        <ol ref={ref} className="relative mt-16 grid gap-12 pl-10 md:mt-24 md:grid-cols-3 md:gap-10 md:pl-0 md:pt-12">
          {/* Trilho + traço */}
          <span aria-hidden="true" className="absolute bottom-2 left-[0.3rem] top-2 w-px bg-stage-border md:inset-x-0 md:bottom-auto md:top-0 md:h-px md:w-auto" />
          <motion.span
            aria-hidden="true"
            className="absolute bottom-2 left-[0.3rem] top-2 hidden w-px origin-top bg-gold max-md:block"
            style={reduce ? undefined : { scaleY: linha }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 hidden h-px origin-left bg-gold md:block"
            style={reduce ? undefined : { scaleX: linha }}
          />

          {comoFunciona.passos.map((passo, i) => (
            <li key={passo.titulo} className="relative" data-reveal style={{ "--i": i } as CSSProperties}>
              <span
                aria-hidden="true"
                className="absolute -left-10 top-1 size-[0.65rem] rotate-45 border border-gold bg-stage md:-top-[3.05rem] md:left-0"
              />
              <span aria-hidden="true" className="display block text-[3.5rem] leading-none text-gold-light md:text-[4.5rem]">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-[1.6rem] leading-tight md:text-[1.9rem]">
                <span className="sr-only">Passo {i + 1}: </span>
                {passo.titulo}
              </h3>
              <p className="mt-3 max-w-[22rem] text-stage-muted md:text-lg">{passo.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col gap-4 border-t border-stage-border pt-10 sm:flex-row sm:items-center sm:justify-between md:mt-24" data-reveal>
          <p className="meta">{microcopyDiagnostico()}</p>
          <WhatsAppLink origem="como-funciona" arrow className="btn btn-primary">
            {comoFunciona.cta}
          </WhatsAppLink>
        </div>
      </div>
    </section>
  );
}
