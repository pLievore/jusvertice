"use client";

/**
 * Header fixo com transição do azul da marca para o claro (mesma mecânica do Andre-Watch).
 *
 * Nasce transparente sobre o hero e vira claro quando o hero termina. Mede o próprio progresso
 * contra `[data-stage-hero]` a cada scroll.
 *
 * A navegação só aponta para seções da própria página (quem vem do anúncio não sai dela) e
 * aparece a partir do desktop; no celular ficam a marca e, depois do hero, a barra fixa.
 */
import { type MotionStyle, motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { useLayoutEffect } from "react";
import type { Origem } from "@/content/origens";
import { Monogram, Wordmark } from "./Logo";
import { WhatsAppLink } from "./WhatsAppLink";

const STAGE = { bg: "rgba(0,36,72,0)", fg: "#f4f2ec", border: "rgba(29,66,114,0)" };
const PAPER = { bg: "rgba(243,245,248,0.94)", fg: "#0a1f3f", border: "rgba(213,220,230,1)" };
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

  const background = useTransform(progress, FLIP, [STAGE.bg, PAPER.bg]);
  const color = useTransform(progress, FLIP, [STAGE.fg, PAPER.fg]);
  const borderColor = useTransform(progress, FLIP, [STAGE.border, PAPER.border]);
  const palco = useTransform(progress, FLIP, [1, 0]);
  const papel = useTransform(progress, FLIP, [0, 1]);
  // Botão: dourado sobre o hero, azul da marca sobre o claro.
  const ctaBg = useTransform(progress, FLIP, ["#cca85e", "#002448"]);
  const ctaFg = useTransform(progress, FLIP, ["#002448", "#ffffff"]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-[6px]"
      style={{ background, color, borderColor } as MotionStyle}
    >
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
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

        <div className="hidden items-center gap-8 md:flex">
          <nav aria-label="Seções da página" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[0.9375rem] font-medium">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="link-quiet no-underline hover:underline" data-track="navegacao_click" data-track-destino={n.href}>
                    {n.texto}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <motion.span className="block rounded-full" style={{ background: ctaBg, color: ctaFg } as MotionStyle}>
            <WhatsAppLink origem={origem} className="btn min-h-11 px-5 py-2 text-[0.9375rem]">
              Falar no WhatsApp
            </WhatsAppLink>
          </motion.span>
        </div>
      </div>
    </motion.header>
  );
}
