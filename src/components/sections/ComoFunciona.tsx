"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { type CSSProperties, useRef } from "react";
import type { Pagina } from "@/content/tipos";
import { CabecalhoSecao } from "../Marcos";
import { WhatsAppLink } from "../WhatsAppLink";

/**
 * Os três passos como uma poligonal de levantamento: cada passo é um marco, ligados por
 * tracejado que se desenha conforme a rolagem (vertical no celular, horizontal no desktop).
 */
export function ComoFunciona({ pagina }: { pagina: Pagina }) {
  const comoFunciona = pagina.comoFunciona;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 50%"] });
  const linha = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="como-funciona" aria-labelledby="como-titulo" data-secao="como-funciona" className="relative py-24 md:py-32">
      <div className="container-x">
        <CabecalhoSecao id="como-titulo" rotulo={comoFunciona.eyebrow} titulo={comoFunciona.titulo} />

        <ol ref={ref} className="relative mt-14 grid gap-12 pl-16 md:mt-20 md:grid-cols-3 md:gap-10 md:pl-0 md:pt-20">
          {/* Trilho tracejado + o mesmo tracejado em dourado, revelado pela rolagem */}
          {/* A escala vai sempre no style: tirar a prop deixaria o último valor (0) aplicado. */}
          <span aria-hidden="true" className="tracejado-v absolute bottom-6 left-[1.45rem] top-6 w-px text-muted/35 md:hidden" />
          <motion.span
            aria-hidden="true"
            className="tracejado-v absolute bottom-6 left-[1.45rem] top-6 w-[2px] origin-top text-gold-ink md:hidden"
            style={{ scaleY: reduce ? 1 : linha }}
          />
          <span aria-hidden="true" className="tracejado absolute left-[1.45rem] right-[calc((100%_-_5rem)/3_-_1.45rem)] top-[1.45rem] hidden h-px text-muted/35 md:block" />
          <motion.span
            aria-hidden="true"
            className="tracejado absolute left-[1.45rem] right-[calc((100%_-_5rem)/3_-_1.45rem)] top-[1.45rem] hidden h-[2px] origin-left bg-[length:8px_2px] text-gold-ink md:block"
            style={{ scaleX: reduce ? 1 : linha }}
          />

          {comoFunciona.passos.map((passo, i) => (
            <li key={passo.titulo} className="relative" data-reveal style={{ "--i": i } as CSSProperties}>
              {/* Marco numerado */}
              <span
                aria-hidden="true"
                className="absolute -left-16 top-0 grid size-[2.9rem] place-items-center rounded-full border-2 border-stage bg-background font-display text-[1.35rem] font-semibold leading-none text-stage md:-top-20 md:left-0"
              >
                {i + 1}
              </span>
              <h3 className="font-display text-[1.75rem] font-semibold uppercase leading-[1.05] md:text-[2rem]">
                <span className="sr-only">Passo {i + 1}: </span>
                {passo.titulo}
              </h3>
              <p className="mt-3 max-w-[22rem] text-muted md:text-lg">{passo.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 md:mt-20" data-reveal>
          <WhatsAppLink origem={pagina.origens.comoFunciona} arrow className="btn btn-primary">
            {comoFunciona.cta}
          </WhatsAppLink>
        </div>
      </div>
    </section>
  );
}
