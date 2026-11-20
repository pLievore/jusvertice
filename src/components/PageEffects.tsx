"use client";

import { useEffect } from "react";
import { type EventName, EVENTOS, MARCOS_ENGAJAMENTO } from "@/lib/eventos";
import { captureAttribution, track } from "@/lib/tracking";

const EVENTO_VALIDO = new Set<string>(EVENTOS);

/**
 * Efeitos globais da página:
 * - revela elementos [data-reveal] ao entrar na tela (só esconde depois que o JS está pronto);
 * - registra chegada (com origem), leitura do checklist, rolagem 50% / 90%;
 * - registra cada seção [data-secao] quando ela cruza o meio da tela (uma vez por página);
 * - registra o tempo de atenção (segundos com a página visível) em marcos;
 * - registra cliques em [data-track="evento"], com as propriedades em data-track-*.
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

  // Seções vistas: conta quando a seção cruza a linha do meio da tela, o que funciona igual para
  // seções curtas e para as longas (situações fixadas ocupam várias telas).
  useEffect(() => {
    const vistas = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const secao = (e.target as HTMLElement).dataset.secao;
          if (!e.isIntersecting || !secao || vistas.has(secao)) continue;
          vistas.add(secao);
          track("secao_vista", { secao });
          io.unobserve(e.target);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    document.querySelectorAll<HTMLElement>("[data-secao]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Tempo de atenção: só conta com a aba visível.
  useEffect(() => {
    let segundos = 0;
    let proximo = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      segundos += 1;
      if (proximo < MARCOS_ENGAJAMENTO.length && segundos >= MARCOS_ENGAJAMENTO[proximo]) {
        track("engajamento", { segundos: MARCOS_ENGAJAMENTO[proximo] });
        proximo += 1;
      }
      if (proximo >= MARCOS_ENGAJAMENTO.length) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Cliques marcados no HTML: <a data-track="contato_click" data-track-canal="telefone">.
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const alvo = (ev.target as Element | null)?.closest<HTMLElement>("[data-track]");
      const nome = alvo?.dataset.track;
      if (!alvo || !nome || !EVENTO_VALIDO.has(nome)) return;
      const props: Record<string, string> = {};
      for (const [chave, valor] of Object.entries(alvo.dataset)) {
        if (chave.startsWith("track") && chave !== "track" && valor) {
          props[chave.slice(5, 6).toLowerCase() + chave.slice(6)] = valor;
        }
      }
      track(nome as EventName, props);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
