"use client";

/**
 * Header fixo com transição de palco para papel (mesma mecânica do Andre-Watch).
 *
 * Nasce escuro junto com o hero e vira papel quando o hero termina — um header
 * claro parado sobre a foto noturna viraria uma faixa colada em cima do filme.
 * Mede o próprio progresso contra `[data-stage-hero]` a cada scroll.
 *
 * Sem menu de navegação de propósito (plano): quem vem do anúncio não deve ter
 * para onde sair. Só a marca e o WhatsApp.
 */
import { type MotionStyle, motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { useLayoutEffect } from "react";
import type { Origem } from "@/content/origens";
import { Monogram, Wordmark } from "./Logo";
import { WhatsAppLink } from "./WhatsAppLink";

const STAGE = { bg: "rgba(7,20,41,0)", fg: "#f3f1ec", border: "rgba(31,45,71,0)" };
const PAPER = { bg: "rgba(247,245,240,0.96)", fg: "#0e1a2e", border: "rgba(224,219,209,1)" };
const FLIP: [number, number] = [0.72, 0.98];

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

  const background = useTransform(progress, FLIP, [STAGE.bg, PAPER.bg]);
  const color = useTransform(progress, FLIP, [STAGE.fg, PAPER.fg]);
  const borderColor = useTransform(progress, FLIP, [STAGE.border, PAPER.border]);
  const palco = useTransform(progress, FLIP, [1, 0]);
  const papel = useTransform(progress, FLIP, [0, 1]);
  const ctaBorder = useTransform(progress, FLIP, ["rgba(243,241,236,0.35)", "rgba(14,26,46,0.25)"]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-[2px]"
      style={{ background, color, borderColor } as MotionStyle}
    >
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-4">
        <a href="#conteudo" className="flex min-h-11 items-center gap-3">
          <span className="relative block h-9 w-[2.15rem]">
            <motion.span className="absolute inset-0" style={{ opacity: palco }}>
              <Monogram id="logo-palco" className="h-9 w-auto" />
            </motion.span>
            <motion.span className="absolute inset-0" style={{ opacity: papel }}>
              <Monogram id="logo-papel" variante="papel" className="h-9 w-auto" />
            </motion.span>
          </span>
          <Wordmark />
        </a>

        <motion.span className="hidden md:block" style={{ borderColor: ctaBorder }}>
          <WhatsAppLink origem={origem} className="btn min-h-11 border border-[inherit] px-5 py-2.5 text-[0.875rem]">
            Falar no WhatsApp
          </WhatsAppLink>
        </motion.span>
      </div>
    </motion.header>
  );
}
