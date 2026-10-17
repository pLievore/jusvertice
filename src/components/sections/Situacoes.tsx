"use client";

/**
 * Situações que atendemos — carrossel fixado e girado pela rolagem (desktop),
 * mesma mecânica da EthosBand do Andre-Watch: cada situação entra pela direita,
 * fica em foco no centro e sai pela esquerda. A última segura até a seção liberar.
 *
 * Celular e movimento reduzido: pilha simples com revelação. Fixar 4 telas no
 * telefone vira parede — o polegar rola e a página não anda.
 */
import { cubicBezier, motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { situacoes } from "@/content/site";
import { WhatsAppLink } from "../WhatsAppLink";

type Item = (typeof situacoes.itens)[number];

const TELA_POR_ITEM_VH = 90;
const CHEGA = cubicBezier(0.22, 1, 0.36, 1);
const SAI = cubicBezier(0.5, 0, 0.75, 0);

function Conteudo({ item, i, total }: { item: Item; i: number; total: number }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-16">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stage">
        <Image
          src={item.imagem}
          alt={item.alt}
          fill
          sizes="(min-width: 1280px) 560px, (min-width: 768px) 45vw, 100vw"
          quality={88}
          placeholder="blur"
          className="object-cover"
          draggable={false}
        />
      </div>
      <div className="flex flex-col gap-5">
        <span className="meta">
          {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <h3 className="display text-[clamp(2.1rem,1.2rem+3.4vw,4rem)] leading-[1.02]">{item.titulo}</h3>
        <p className="max-w-md text-muted md:text-lg">{item.texto}</p>
        <WhatsAppLink origem={item.origem} arrow className="link-quiet self-start">
          {situacoes.cta}
        </WhatsAppLink>
      </div>
    </div>
  );
}

function Slide({
  item,
  i,
  total,
  progresso,
  aoFocar,
}: {
  item: Item;
  i: number;
  total: number;
  progresso: MotionValue<number>;
  aoFocar: () => void;
}) {
  const seg = 1 / total;
  const centro = (i + 0.5) * seg;
  const span = seg * 0.7;
  const ultimo = i === total - 1;
  const primeiro = i === 0;
  // Offsets precisam ficar em [0, 1]: o Motion acelera via timeline de rolagem nativa (WAAPI).
  const pontos = [Math.max(0, centro - span), centro, Math.min(1, centro + span)];
  const opts = { ease: [CHEGA, SAI] };
  const x = useTransform(progresso, pontos, [primeiro ? "0%" : "60%", "0%", ultimo ? "0%" : "-60%"], opts);
  const scale = useTransform(progresso, pontos, [primeiro ? 1 : 0.6, 1, ultimo ? 1 : 0.6], opts);
  const opacity = useTransform(progresso, pontos, [primeiro ? 1 : 0, 1, ultimo ? 1 : 0], opts);
  return (
    <motion.div
      style={{ x, scale, opacity }}
      onFocusCapture={aoFocar}
      className="absolute inset-0 flex items-center px-[var(--gutter)] will-change-transform"
    >
      <Conteudo item={item} i={i} total={total} />
    </motion.div>
  );
}

function Tique({ i, total, progresso }: { i: number; total: number; progresso: MotionValue<number> }) {
  const seg = 1 / total;
  const c = (i + 0.5) * seg;
  const opacity = useTransform(progresso, [c - seg / 2, c, c + seg / 2], [0.3, 1, 0.3]);
  const scaleX = useTransform(progresso, [c - seg / 2, c, c + seg / 2], [1, 2.4, 1]);
  return <motion.span className="block h-px w-6 origin-left bg-foreground" style={{ opacity, scaleX }} />;
}

function Cabecalho() {
  return (
    <div>
      <p className="eyebrow">{situacoes.eyebrow}</p>
      <h2 id="situacoes-titulo" className="titulo mt-5">
        {situacoes.titulo}
      </h2>
    </div>
  );
}

export function Situacoes() {
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const total = situacoes.itens.length;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const atualizar = () => setDesktop(mq.matches);
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);

  // Teclado: focar um link de um slide leva a rolagem até ele ficar em foco na tela.
  const irPara = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const alvo = el.offsetTop + ((i + 0.5) / total) * (el.offsetHeight - window.innerHeight);
    if (Math.abs(window.scrollY - alvo) > 4) window.scrollTo({ top: alvo, behavior: "instant" });
  };

  if (reduce || !desktop) {
    return (
      <section ref={ref} aria-labelledby="situacoes-titulo" className="border-t border-border py-24">
        <div className="container-x">
          <div data-reveal>
            <Cabecalho />
          </div>
          <ul className="mt-14 grid gap-16">
            {situacoes.itens.map((item, i) => (
              <li key={item.origem} data-reveal style={{ "--i": 0 } as CSSProperties}>
                <Conteudo item={item} i={i} total={total} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      aria-labelledby="situacoes-titulo"
      className="relative border-t border-border"
      style={{ height: `${total * TELA_POR_ITEM_VH + 40}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-28">
        <div className="container-x flex items-end justify-between gap-8">
          <Cabecalho />
          <div aria-hidden="true" className="flex gap-2 pb-4">
            {situacoes.itens.map((item, i) => (
              <Tique key={item.origem} i={i} total={total} progresso={scrollYProgress} />
            ))}
          </div>
        </div>
        <div className="relative flex-1">
          {situacoes.itens.map((item, i) => (
            <Slide key={item.origem} item={item} i={i} total={total} progresso={scrollYProgress} aoFocar={() => irPara(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
