import { nomeStatus } from "@/lib/painel/formato";

/**
 * Andamento do lead. Fechou e Não fechou usam as cores de estado (bom/crítico) com ícone;
 * os estágios em andamento são neutros, com ícone próprio: a cor nunca diz sozinha.
 */
export const ESTILO_STATUS: Record<string, { cor: string; fundo: string; texto: string; icone: string }> = {
  nova: { cor: "#6da7ec", fundo: "#eef4fc", texto: "#184f95", icone: "●" },
  atendimento: { cor: "#3987e5", fundo: "#e6effb", texto: "#184f95", icone: "◐" },
  proposta: { cor: "#256abf", fundo: "#e3ebf7", texto: "#104281", icone: "◑" },
  fechou: { cor: "#0ca30c", fundo: "#e7f6e7", texto: "#006300", icone: "✓" },
  perdeu: { cor: "#b3bdca", fundo: "#f0f2f5", texto: "#4a5870", icone: "✕" },
};

export function SeloStatus({ status }: { status: string }) {
  const e = ESTILO_STATUS[status] ?? ESTILO_STATUS.nova;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold" style={{ background: e.fundo, color: e.texto }}>
      <span aria-hidden="true">{e.icone}</span>
      {nomeStatus(status)}
    </span>
  );
}
