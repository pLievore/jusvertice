"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Rolagem suave (Lenis) dirigindo o scroll real — `useScroll` do Motion funciona sem fiação extra.
 *
 * Iniciado de forma imperativa e SEM envolver a árvore: o `<ReactLenis>` faz `setLenis` no mount,
 * e se essa atualização chega enquanto a raiz ainda hidrata (4G lento, página já rolada), o React 19
 * descarta o HTML do servidor e recria tudo. Medido: 1 em cada ~3 cargas a frio. A página não usa
 * o contexto do Lenis, então não precisa do provider.
 *
 * Movimento reduzido: rolagem nativa.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false, autoRaf: true });
    return () => lenis.destroy();
  }, []);
  return null;
}
