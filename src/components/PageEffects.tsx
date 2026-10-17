"use client";

import { useEffect } from "react";
import { captureAttribution, track } from "@/lib/tracking";

/**
 * Efeitos globais da página:
 * - revela elementos [data-reveal] ao entrar na tela (só esconde depois que o JS está pronto);
 * - registra chegada (com origem), leitura do checklist e rolagem 50% / 90%.
 */
export function PageEffects() {
  // Revelação
  useEffect(() => {
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0 },
    );
    // Elementos já acima da dobra (ex.: recarregou no meio da página) aparecem direto.
    for (const el of els) {
      if (el.getBoundingClientRect().bottom < 0) el.classList.add("is-visible");
      else io.observe(el);
    }
    root.classList.add("reveal-ready");
    return () => io.disconnect();
  }, []);

  // Funil
  useEffect(() => {
    captureAttribution();
    track("page_view");

    const marcos = new Set<number>();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
        for (const marco of [50, 90] as const) {
          if (pct >= marco && !marcos.has(marco)) {
            marcos.add(marco);
            track(marco === 50 ? "scroll_50" : "scroll_90");
          }
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const fim = document.getElementById("checklist-fim");
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) {
        track("checklist_lido");
        io.disconnect();
      }
    });
    if (fim) io.observe(fim);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return null;
}
