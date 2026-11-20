"use client";

import { GraficoEmpilhado, GraficoMatriz, type Formato } from "./graficos";
import { useTransicao } from "./Transicao";

/** Investimento por dia empilhado por campanha; clicar numa campanha filtra o painel por ela. */
export function EmpilhadoPorCampanha(props: { dias: string[]; series: { nome: string; valores: number[]; contexto?: boolean }[]; formato?: Formato }) {
  const { filtrar } = useTransicao();
  const nomesReais = new Set(props.series.filter((s) => !s.contexto).map((s) => s.nome));
  return <GraficoEmpilhado {...props} aoClicar={(nome) => nomesReais.has(nome) && filtrar({ campanha: nome })} />;
}

/** Matriz de anúncios; clicar numa bolha filtra pela campanha do anúncio. */
export function MatrizComFiltro(props: { pontos: { nome: string; campanha: string; gasto: number; cpl: number; conversas: number }[] }) {
  const { filtrar } = useTransicao();
  return <GraficoMatriz {...props} aoClicar={(campanha) => filtrar({ campanha })} />;
}
