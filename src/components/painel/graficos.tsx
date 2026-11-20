"use client";

/**
 * Gráficos do painel, seguindo o guia de visualização:
 * - uma escala por gráfico (nunca dois eixos); medidas diferentes viram gráficos lado a lado;
 * - linhas de 2px, colunas de no máximo 24px com ponta arredondada, área a 10%;
 * - grade em fio sólido e recuado; mira vertical + dica com todas as séries no ponto;
 * - nomes vindos de UTM são escapados antes de entrar na dica (dado não confiável).
 */
import type { EChartsCoreOption } from "echarts/core";
import { useMemo } from "react";
import { DIAS_SEMANA_LONGOS, diaComSemana, diaCurto, moeda, num, numCompacto } from "@/lib/painel/formato";
import { Grafico, type ParametroClique } from "./Grafico";
import { COR } from "./tema";

export type Formato = "num" | "moeda" | "pct";

const escapar = (t: unknown) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function formatar(v: number | null | undefined, formato: Formato) {
  if (formato === "moeda") return moeda(v);
  if (formato === "pct") return typeof v === "number" ? `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";
  return num(v);
}

function eixoY(formato: Formato) {
  return {
    type: "value",
    splitNumber: 4,
    // Contagem não tem fração: sem isso, uma série zerada vira marcas "0, 0, 1, 1, 1".
    minInterval: formato === "num" ? 1 : undefined,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: COR.grade, width: 1, type: "solid" } },
    axisLabel: {
      color: COR.mudo,
      fontSize: 12,
      formatter: (v: number) => (formato === "moeda" ? `R$ ${numCompacto(v)}` : formato === "pct" ? `${Math.round(v * 100)}%` : numCompacto(v)),
    },
  };
}

function eixoDias(dias: string[]) {
  return {
    type: "category",
    data: dias,
    boundaryGap: true,
    axisLine: { lineStyle: { color: COR.eixo } },
    axisTick: { show: false },
    axisLabel: { color: COR.mudo, fontSize: 12, hideOverlap: true, formatter: (d: string) => diaCurto(d) },
  };
}

const GRADE = { left: 8, right: 16, top: 16, bottom: 4, containLabel: true };

/** Dica de eixo: valor primeiro (forte), nome da série depois, chave em traço da cor da série. */
function dicaEixo(formatos: Formato[], rotuloEixo: (v: string) => string = diaComSemana) {
  return {
    trigger: "axis",
    axisPointer: { type: "line", lineStyle: { color: COR.mudo, width: 1, type: "solid" } },
    backgroundColor: COR.superficie,
    borderColor: COR.grade,
    borderWidth: 1,
    padding: [10, 12],
    extraCssText: "box-shadow:0 8px 24px rgba(10,31,63,.12);border-radius:10px;",
    textStyle: { color: COR.tinta, fontSize: 13 },
    formatter: (itens: { axisValue: string; seriesName: string; value: number | null; color: string; seriesIndex: number }[]) => {
      if (!itens.length) return "";
      const linhas = itens
        .map(
          (i) =>
            `<div style="display:flex;align-items:center;gap:8px;margin-top:4px">
               <span style="width:12px;height:2px;border-radius:2px;background:${i.color}"></span>
               <strong style="font-weight:600">${escapar(formatar(i.value, formatos[i.seriesIndex] ?? formatos[0]))}</strong>
               <span style="color:${COR.tinta2}">${escapar(i.seriesName)}</span>
             </div>`,
        )
        .join("");
      return `<div style="color:${COR.tinta2};font-size:12px">${escapar(rotuloEixo(itens[0].axisValue))}</div>${linhas}`;
    },
  };
}

/** Ponto final destacado (8px, anel de 2px na cor da superfície): o "agora" da série. */
function comPontoFinal(valores: (number | null)[], cor: string) {
  return valores.map((v, i) =>
    i === valores.length - 1 && v !== null
      ? { value: v, symbol: "circle", symbolSize: 9, itemStyle: { color: cor, borderColor: COR.superficie, borderWidth: 2 } }
      : { value: v, symbol: "none" },
  );
}

/** Tendência de uma medida por dia, com o período anterior como contexto em cinza. */
export function GraficoTendencia({
  dias,
  atual,
  anterior,
  nome,
  formato = "num",
  altura = 240,
  area = true,
}: {
  dias: string[];
  atual: number[];
  anterior?: number[];
  nome: string;
  formato?: Formato;
  altura?: number;
  area?: boolean;
}) {
  const opcao = useMemo<EChartsCoreOption>(
    () => ({
      grid: GRADE,
      xAxis: eixoDias(dias),
      yAxis: eixoY(formato),
      tooltip: dicaEixo([formato, formato]),
      series: [
        {
          name: nome,
          type: "line",
          data: comPontoFinal(atual, COR.serie[0]),
          showSymbol: true,
          smooth: false,
          lineStyle: { width: 2, color: COR.serie[0], cap: "round", join: "round" },
          itemStyle: { color: COR.serie[0] },
          areaStyle: area ? { color: COR.serie[0], opacity: 0.1 } : undefined,
          emphasis: { disabled: true },
          z: 3,
        },
        ...(anterior
          ? [
              {
                name: "Período anterior",
                type: "line",
                data: anterior.map((v) => ({ value: v, symbol: "none" })),
                smooth: false,
                lineStyle: { width: 1.5, color: COR.contexto },
                itemStyle: { color: COR.contexto },
                emphasis: { disabled: true },
                z: 2,
              },
            ]
          : []),
      ],
    }),
    [anterior, area, atual, dias, formato, nome],
  );
  return <Grafico opcao={opcao} altura={altura} rotulo={`${nome} por dia`} />;
}

/** Colunas por dia, uma série (cor única: a medida já é a altura). */
export function GraficoColunas({ dias, valores, nome, formato = "num", altura = 220 }: { dias: string[]; valores: number[]; nome: string; formato?: Formato; altura?: number }) {
  const opcao = useMemo<EChartsCoreOption>(
    () => ({
      grid: GRADE,
      xAxis: eixoDias(dias),
      yAxis: eixoY(formato),
      tooltip: { ...dicaEixo([formato]), axisPointer: { type: "shadow", shadowStyle: { color: "rgba(42,120,214,0.06)" } } },
      series: [
        {
          name: nome,
          type: "bar",
          data: valores,
          barMaxWidth: 24,
          itemStyle: { color: COR.serie[0], borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { color: "#256abf" } },
        },
      ],
    }),
    [dias, formato, nome, valores],
  );
  return <Grafico opcao={opcao} altura={altura} rotulo={`${nome} por dia`} />;
}

/** Colunas empilhadas por dia e categoria (até 3 cores + "Outras" em cinza). */
export function GraficoEmpilhado({
  dias,
  series,
  formato = "num",
  altura = 260,
  aoClicar,
}: {
  dias: string[];
  series: { nome: string; valores: number[]; contexto?: boolean }[];
  formato?: Formato;
  altura?: number;
  aoClicar?: (nomeSerie: string) => void;
}) {
  const opcao = useMemo<EChartsCoreOption>(
    () => ({
      grid: GRADE,
      xAxis: eixoDias(dias),
      yAxis: eixoY(formato),
      tooltip: { ...dicaEixo(series.map(() => formato)), axisPointer: { type: "shadow", shadowStyle: { color: "rgba(42,120,214,0.06)" } } },
      series: series.map((s, i) => {
        const cor = s.contexto ? COR.contexto : COR.serie[i];
        return {
          name: s.nome,
          type: "bar",
          stack: "total",
          data: s.valores,
          barMaxWidth: 24,
          // Fio da cor da superfície entre os blocos (o espaço de 2px), ponta arredondada só no topo.
          itemStyle: { color: cor, borderColor: COR.superficie, borderWidth: 1, borderRadius: i === series.length - 1 ? [4, 4, 0, 0] : 0 },
          emphasis: { focus: "series" },
        };
      }),
    }),
    [dias, formato, series],
  );
  const clique = useMemo(() => (aoClicar ? (p: ParametroClique) => p.seriesName && aoClicar(p.seriesName) : undefined), [aoClicar]);
  return <Grafico opcao={opcao} altura={altura} rotulo="Investimento por dia e campanha" aoClicar={clique} />;
}

/** Várias linhas na mesma escala (ex.: custo por conversa de até 3 campanhas). */
export function GraficoLinhas({
  rotulos,
  series,
  formato = "num",
  altura = 260,
  rotuloEixo,
}: {
  rotulos: string[];
  series: { nome: string; valores: (number | null)[] }[];
  formato?: Formato;
  altura?: number;
  rotuloEixo?: "dia" | "semana";
}) {
  const opcao = useMemo<EChartsCoreOption>(
    () => ({
      grid: GRADE,
      xAxis: {
        ...eixoDias(rotulos),
        axisLabel: { color: COR.mudo, fontSize: 12, hideOverlap: true, formatter: (d: string) => (rotuloEixo === "semana" ? `sem. ${diaCurto(d)}` : diaCurto(d)) },
      },
      yAxis: eixoY(formato),
      tooltip: dicaEixo(
        series.map(() => formato),
        (d) => (rotuloEixo === "semana" ? `Semana de ${diaCurto(d)}` : diaComSemana(d)),
      ),
      series: series.map((s, i) => ({
        name: s.nome,
        type: "line",
        data: comPontoFinal(s.valores, COR.serie[i]),
        connectNulls: true,
        lineStyle: { width: 2, color: COR.serie[i], cap: "round", join: "round" },
        itemStyle: { color: COR.serie[i] },
        emphasis: { disabled: true },
      })),
    }),
    [formato, rotuloEixo, rotulos, series],
  );
  return <Grafico opcao={opcao} altura={altura} rotulo="Custo por conversa ao longo do tempo" />;
}

/** Mapa de calor dia da semana × hora (rampa azul sequencial, escala na legenda). */
export function GraficoCalor({ celulas, altura = 260 }: { celulas: { dow: number; hora: number; conversas: number }[]; altura?: number }) {
  const opcao = useMemo<EChartsCoreOption>(() => {
    const maximo = Math.max(1, ...celulas.map((c) => c.conversas));
    const horas = Array.from({ length: 24 }, (_, h) => `${h}h`);
    // Segunda primeiro (a semana de trabalho), domingo no fim.
    const ordem = [1, 2, 3, 4, 5, 6, 0];
    return {
      grid: { left: 8, right: 8, top: 8, bottom: 40, containLabel: true },
      xAxis: { type: "category", data: horas, splitArea: { show: false }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: COR.mudo, fontSize: 11, interval: 2 } },
      yAxis: {
        type: "category",
        data: ordem.map((d) => DIAS_SEMANA_LONGOS[d].slice(0, 3)),
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: COR.mudo, fontSize: 12 },
      },
      visualMap: {
        min: 0,
        max: maximo,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 10,
        itemHeight: 120,
        text: ["Mais", "Menos"],
        textStyle: { color: COR.mudo, fontSize: 11 },
        inRange: { color: [COR.rampa[0], COR.rampa[4], COR.rampa[7], COR.rampa[10], COR.rampa[12]] },
      },
      tooltip: {
        backgroundColor: COR.superficie,
        borderColor: COR.grade,
        textStyle: { color: COR.tinta, fontSize: 13 },
        extraCssText: "box-shadow:0 8px 24px rgba(10,31,63,.12);border-radius:10px;",
        formatter: (p: { value: [number, number, number] }) =>
          `<strong>${num(p.value[2])}</strong> <span style="color:${COR.tinta2}">conversas</span><div style="color:${COR.tinta2};font-size:12px">${DIAS_SEMANA_LONGOS[ordem[p.value[1]]]}, ${p.value[0]}h–${p.value[0] + 1}h</div>`,
      },
      series: [
        {
          type: "heatmap",
          data: ordem.flatMap((dow, y) =>
            Array.from({ length: 24 }, (_, hora) => [hora, y, celulas.find((c) => c.dow === dow && c.hora === hora)?.conversas ?? 0]),
          ),
          itemStyle: { borderColor: COR.superficie, borderWidth: 2, borderRadius: 3 },
          emphasis: { itemStyle: { borderColor: COR.tinta, borderWidth: 1 } },
        },
      ],
    };
  }, [celulas]);
  return <Grafico opcao={opcao} altura={altura} rotulo="Conversas por dia da semana e hora" />;
}

/**
 * Matriz de anúncios: investimento × custo por conversa, bolha = conversas. Uma série (cor única),
 * com a mediana de cada eixo dividindo em quadrantes de decisão.
 */
export function GraficoMatriz({
  pontos,
  altura = 320,
  aoClicar,
}: {
  pontos: { nome: string; campanha: string; gasto: number; cpl: number; conversas: number }[];
  altura?: number;
  aoClicar?: (campanha: string) => void;
}) {
  const opcao = useMemo<EChartsCoreOption>(() => {
    const mediana = (v: number[]) => {
      const s = [...v].sort((a, b) => a - b);
      return s.length ? s[Math.floor(s.length / 2)] : 0;
    };
    const maxConv = Math.max(1, ...pontos.map((p) => p.conversas));
    return {
      grid: { left: 8, right: 24, top: 28, bottom: 30, containLabel: true },
      xAxis: { ...eixoY("moeda"), name: "Investimento", nameLocation: "middle", nameGap: 30, nameTextStyle: { color: COR.mudo, fontSize: 12 } },
      yAxis: { ...eixoY("moeda"), name: "Custo por conversa", nameTextStyle: { color: COR.mudo, fontSize: 12, align: "left" } },
      tooltip: {
        trigger: "item",
        backgroundColor: COR.superficie,
        borderColor: COR.grade,
        textStyle: { color: COR.tinta, fontSize: 13 },
        extraCssText: "box-shadow:0 8px 24px rgba(10,31,63,.12);border-radius:10px;",
        formatter: (p: { data: { nome: string; campanha: string; value: [number, number, number] } }) =>
          `<div style="font-weight:600">${escapar(p.data.nome)}</div>
           <div style="color:${COR.tinta2};font-size:12px;margin-bottom:6px">${escapar(p.data.campanha)}</div>
           <div><strong>${moeda(p.data.value[1])}</strong> <span style="color:${COR.tinta2}">por conversa</span></div>
           <div><strong>${moeda(p.data.value[0])}</strong> <span style="color:${COR.tinta2}">investidos</span></div>
           <div><strong>${num(p.data.value[2])}</strong> <span style="color:${COR.tinta2}">conversas</span></div>`,
      },
      series: [
        {
          type: "scatter",
          data: pontos.map((p) => ({ nome: p.nome, campanha: p.campanha, name: p.campanha, value: [p.gasto, p.cpl, p.conversas] })),
          symbolSize: (v: [number, number, number]) => 10 + Math.sqrt(v[2] / maxConv) * 26,
          itemStyle: { color: COR.serie[0], opacity: 0.78, borderColor: COR.superficie, borderWidth: 2 },
          emphasis: { itemStyle: { opacity: 1, borderColor: COR.tinta, borderWidth: 1.5 } },
          markLine: {
            silent: true,
            symbol: "none",
            label: { show: false },
            lineStyle: { color: COR.eixo, type: "solid", width: 1 },
            data: [{ xAxis: mediana(pontos.map((p) => p.gasto)) }, { yAxis: mediana(pontos.map((p) => p.cpl)) }],
          },
        },
      ],
    };
  }, [pontos]);
  const clique = useMemo(
    () => (aoClicar ? (p: ParametroClique) => aoClicar((p.data as { campanha: string }).campanha) : undefined),
    [aoClicar],
  );
  return <Grafico opcao={opcao} altura={altura} rotulo="Anúncios por investimento e custo por conversa" aoClicar={clique} />;
}
