"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useRef } from "react";
import { ctaFinal, microcopyDiagnostico, midia } from "@/content/site";
import { WhatsAppLink } from "../WhatsAppLink";

export function CtaFinal() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={ref} id="cta-final" aria-labelledby="cta-final-titulo" className="on-stage relative overflow-hidden">
      <motion.div aria-hidden="true" className="absolute -inset-y-[10%] inset-x-0 will-change-transform" style={reduce ? undefined : { y }}>
        <Image src={midia.ctaFinal} alt="" fill sizes="100vw" quality={88} placeholder="blur" className="object-cover" />
      </motion.div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(7,20,41,0.96) 15%, rgba(7,20,41,0.7) 55%, rgba(7,20,41,0.55) 100%)" }}
      />

      <div className="container-x relative flex min-h-[85svh] flex-col justify-end py-24 md:py-32">
        <p className="eyebrow" data-reveal>
          {ctaFinal.eyebrow}
        </p>
        <h2 id="cta-final-titulo" className="display mt-5 max-w-[16ch] text-[clamp(2.6rem,1.3rem+5.4vw,6rem)]" data-reveal style={{ "--i": 1 } as CSSProperties}>
          {ctaFinal.titulo}
        </h2>
        <div className="mt-10" data-reveal style={{ "--i": 2 } as CSSProperties}>
          <WhatsAppLink origem="rodape" arrow className="btn btn-primary">
            {ctaFinal.cta}
          </WhatsAppLink>
          <p className="meta mt-4">{microcopyDiagnostico()}</p>
        </div>
      </div>
    </section>
  );
}
