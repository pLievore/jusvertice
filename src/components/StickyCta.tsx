"use client";

import { useEffect, useState } from "react";
import type { Origem } from "@/content/origens";
import { WhatsAppLink } from "./WhatsAppLink";

/**
 * Botão de WhatsApp fixo no rodapé da tela, só no celular.
 * Aparece depois que o botão do topo sai da tela e some quando o botão final aparece.
 */
export function StickyCta({ origem, texto }: { origem: Origem; texto: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const topo = document.getElementById("cta-topo");
    const final = document.getElementById("cta-final");
    if (!topo || !final) return;
    let topoAtivo = true; // botão do topo na tela ou ainda abaixo dela
    let finalAtivo = false; // botão final na tela ou já ultrapassado
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === topo) topoAtivo = e.isIntersecting || e.boundingClientRect.top > 0;
        if (e.target === final) finalAtivo = e.isIntersecting || e.boundingClientRect.bottom < 0;
      }
      setVisivel(!topoAtivo && !finalAtivo);
    });
    io.observe(topo);
    io.observe(final);
    return () => io.disconnect();
  }, []);

  // Foco do teclado nunca fica escondido atrás da barra (WCAG 2.4.11).
  // scroll-padding cobre a rolagem por âncora; o focusin cobre o Chrome, que ignora scroll-padding ao focar.
  useEffect(() => {
    const barra = document.querySelector<HTMLElement>(".sticky-cta");
    const ativa = visivel && !!barra && getComputedStyle(barra).display !== "none";
    document.documentElement.style.setProperty("--sticky-cta-h", ativa ? "4.75rem" : "0px");
    if (!ativa || !barra) return;

    const corrigir = (el: Element | null) => {
      if (!(el instanceof HTMLElement) || barra.contains(el)) return;
      // Só foco por teclado: toque também gera foco (ex.: <main tabIndex=-1>) e não deve rolar a página.
      if (!el.matches(":focus-visible")) return;
      const alvo = (el.closest("label") ?? el).getBoundingClientRect();
      if (alvo.height > window.innerHeight / 2) return;
      // Posição final da barra, não a da animação de entrada.
      const topoBarra = window.innerHeight - barra.offsetHeight;
      if (alvo.bottom > topoBarra - 16) window.scrollBy({ top: alvo.bottom - topoBarra + 16, behavior: "instant" });
    };
    const onFocus = (e: FocusEvent) => requestAnimationFrame(() => corrigir(e.target as Element));
    document.addEventListener("focusin", onFocus);
    const raf = requestAnimationFrame(() => corrigir(document.activeElement));
    return () => {
      document.removeEventListener("focusin", onFocus);
      cancelAnimationFrame(raf);
    };
  }, [visivel]);

  return (
    <div className="sticky-cta on-stage md:hidden" data-visible={visivel} inert={!visivel}>
      <WhatsAppLink origem={origem} className="btn btn-primary w-full">
        {texto}
      </WhatsAppLink>
    </div>
  );
}
