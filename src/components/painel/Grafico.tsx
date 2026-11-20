"use client";

/**
 * Base dos gráficos do painel (ECharts, renderizado em SVG: nítido em qualquer tela).
 * Só os módulos usados entram no pacote. Os componentes de cada tipo montam a opção.
 */
import { BarChart, HeatmapChart, LineChart, ScatterChart } from "echarts/charts";
import { AxisPointerComponent, GridComponent, MarkLineComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

echarts.use([BarChart, LineChart, HeatmapChart, ScatterChart, GridComponent, TooltipComponent, AxisPointerComponent, VisualMapComponent, MarkLineComponent, SVGRenderer]);

export type ParametroClique = { name?: string; seriesName?: string; dataIndex?: number; data?: unknown; value?: unknown };

type Props = {
  opcao: EChartsCoreOption;
  altura: number | string;
  /** Descrição curta para leitores de tela; os valores ficam na versão em tabela do cartão. */
  rotulo: string;
  aoClicar?: (p: ParametroClique) => void;
};

/** A família da Barlow que o next/font registrou (o nome real tem um sufixo gerado). */
export function fonteDoPainel() {
  if (typeof document === "undefined") return "sans-serif";
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

export function Grafico({ opcao, altura, rotulo, aoClicar }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const instancia = useRef<echarts.ECharts | null>(null);
  const clique = useRef(aoClicar);
  useEffect(() => {
    clique.current = aoClicar;
  }, [aoClicar]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const grafico = echarts.init(el, undefined, { renderer: "svg" });
    instancia.current = grafico;
    grafico.on("click", (p) => clique.current?.(p as ParametroClique));
    const ro = new ResizeObserver(() => grafico.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      grafico.dispose();
      instancia.current = null;
    };
  }, []);

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    instancia.current?.setOption(
      { animation: !reduzir, animationDuration: 500, animationEasing: "cubicOut", textStyle: { fontFamily: fonteDoPainel() }, ...opcao },
      { notMerge: true },
    );
  }, [opcao]);

  return <div ref={ref} role="img" aria-label={rotulo} style={{ height: altura, width: "100%" }} className={aoClicar ? "[&_path]:cursor-pointer" : ""} />;
}
