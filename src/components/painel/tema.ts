/**
 * Cores do painel. A moldura usa a marca (azul #002448 e dourado); os gráficos usam a paleta
 * validada para daltonismo (dataviz › palette.md), conferida sobre o branco dos cartões:
 * scripts do skill › validate_palette.js "#2a78d6,#eb6834,#1baf7a,#eda100" --surface "#ffffff".
 * Verde-água e amarelo ficam abaixo de 3:1: todo gráfico tem legenda e a versão em tabela.
 */
export const COR = {
  superficie: "#ffffff",
  plano: "#eef1f6",
  tinta: "#0a1f3f",
  tinta2: "#4a5870",
  mudo: "#6b7688",
  grade: "#e8ecf2",
  eixo: "#cdd5df",
  marca: "#002448",
  ouro: "#cca85e",
  serie: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  /** Série de contexto (período anterior, "outras"): recua para o cinza. */
  contexto: "#b3bdca",
  /** Rampa sequencial azul (100 → 700). */
  rampa: ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"],
  /** Rampa ordinal do funil (validada com --ordinal). */
  funil: ["#0d366b", "#184f95", "#256abf", "#3987e5", "#6da7ec"],
  bom: "#0ca30c",
  bomTexto: "#006300",
  critico: "#d03b3b",
  aviso: "#fab219",
} as const;
