"use client";

/**
 * Header fixo: transparente sobre o hero e, quando o hero termina, uma barra no azul da marca
 * (como nos posts). O logo fica sempre nas cores originais, que só funcionam sobre o azul.
 * Mede o próprio progresso contra `[data-stage-hero]` a cada scroll.
 *
 * A navegação só aponta para seções da própria página (quem vem do anúncio não sai dela) e
 * aparece a partir do desktop; no celular ficam a marca e, depois do hero, a barra fixa.
 */
import { type MotionStyle, motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { useLayoutEffect } from "react";
import type { Origem } from "@/content/origens";
import { Monogram, Wordmark } from "./Logo";
import { WhatsAppLink } from "./WhatsAppLink";

const SOBRE_O_HERO = { bg: "rgba(0,36,72,0)", border: "rgba(29,66,114,0)" };
const AZUL = { bg: "rgba(0,36,72,0.96)", border: "rgba(29,66,114,1)" };
const FLIP: [number, number] = [0.72, 0.98];

const NAV = [
  { href: "#servicos", texto: "Serviços" },
  { href: "#como-funciona", texto: "Como funciona" },
  { href: "#duvidas", texto: "Dúvidas" },
];

export function SiteHeader({ origem }: { origem: Origem }) {
  const { scrollY } = useScroll();
  const progress = useMotionValue(0);

  useLayoutEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-stage-hero]");
    if (!hero) {
      progress.set(1);
      return;
    }
    const update = () => {
      const rect = hero.getBoundingClientRect();
      const alcance = Math.max(hero.offsetHeight - 72, window.innerHeight * 0.6);
      progress.set(Math.min(1, Math.max(0, -rect.top / alcance)));
    };
    update();
    const off = scrollY.on("change", update);
    window.addEventListener("resize", update);
    return () => {
      off();
      window.removeEventListener("resize", update);
    };
  }, [progress, scrollY]);

  const background = useTransform(progress, FLIP, [SOBRE_O_HERO.bg, AZUL.bg]);
  const borderColor = useTransform(progress, FLIP, [SOBRE_O_HERO.border, AZUL.border]);

  return (
    <motion.header
      className="on-stage fixed inset-x-0 top-0 z-50 border-b backdrop-blur-[6px]"
      style={{ backgroundColor: background, borderColor } as MotionStyle}
    >
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
        <a href="#conteudo" className="flex min-h-11 items-center gap-3 text-[#f4f2ec]">
          <Monogram id="logo-cabecalho" className="h-9 w-auto" />
          <Wordmark />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <nav aria-label="Seções da página" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[0.9375rem] font-medium text-[#f4f2ec]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="link-quiet no-underline hover:underline" data-track="navegacao_click" data-track-destino={n.href}>
                    {n.texto}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <WhatsAppLink origem={origem} className="btn btn-gold min-h-11 px-5 py-2 text-[0.9375rem]">
            Falar no WhatsApp
          </WhatsAppLink>
        </div>
      </div>
    </motion.header>
  );
}
