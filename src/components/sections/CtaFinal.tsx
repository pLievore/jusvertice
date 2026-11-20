"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useRef } from "react";
import { microcopyDiagnostico, midia } from "@/content/site";
import type { Pagina } from "@/content/tipos";
import { Arco, comDestaque, Rotulo } from "../Marcos";
import { WhatsAppLink } from "../WhatsAppLink";

/** Fechamento com a frase da marca ("Da irregularidade à tranquilidade"), sobre a foto noturna. */
export function CtaFinal({ pagina }: { pagina: Pagina }) {
  const ctaFinal = pagina.ctaFinal;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const giro = useTransform(scrollYProgress, [0, 1], [-14, 10]);

  return (
    <section ref={ref} id="cta-final" aria-labelledby="cta-final-titulo" className="on-stage relative overflow-hidden">
      <motion.div aria-hidden="true" className="absolute -inset-y-[10%] inset-x-0 will-change-transform" style={reduce ? undefined : { y }}>
        <Image src={ctaFinal.imagem ?? midia.ctaFinal} alt="" fill sizes="100vw" quality={88} placeholder="blur" className="object-cover" />
      </motion.div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,36,72,0.97) 12%, rgba(0,36,72,0.72) 52%, rgba(0,36,72,0.5) 100%), linear-gradient(90deg, rgba(0,36,72,0.6), transparent 70%)",
        }}
      />
      {/* Arco dourado, girando devagar com a rolagem */}
      <motion.div
        aria-hidden="true"
        // Celular: no alto, longe do texto (que fica embaixo). Desktop: saindo pelo canto inferior.
        className="absolute -right-[14%] top-[3%] w-[40vw] text-gold opacity-90 sm:-bottom-[18%] sm:-right-[12%] sm:top-auto sm:w-[min(70vw,40rem)]"
        style={reduce ? undefined : { rotate: giro }}
      >
        <Arco className="w-full" />
      </motion.div>

      <div className="container-x relative flex min-h-[80svh] flex-col justify-end py-24 md:py-32">
        <Rotulo>{ctaFinal.eyebrow}</Rotulo>
        <h2 id="cta-final-titulo" className="titulo-hero mt-5 max-w-[18ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
          {comDestaque(ctaFinal.titulo, ctaFinal.destaque, true)}
        </h2>
        <p className="mt-6 max-w-[34rem] text-stage-muted md:text-lg" data-reveal style={{ "--i": 2 } as CSSProperties}>
          {ctaFinal.texto}
        </p>
        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6" data-reveal style={{ "--i": 3 } as CSSProperties}>
          <WhatsAppLink origem={pagina.origens.rodape} arrow className="btn btn-primary self-start">
            {ctaFinal.cta}
          </WhatsAppLink>
          <p className="meta">{microcopyDiagnostico()}</p>
        </div>
      </div>
    </section>
  );
}
