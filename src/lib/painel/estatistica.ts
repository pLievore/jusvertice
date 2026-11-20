/**
 * Teste de duas proporções (taxa de conversa da versão × da original), bicaudal.
 * Devolve a confiança de que a diferença não é acaso (0 a 1). Com poucas pessoas, a confiança
 * fica baixa e o painel diz "ainda inconclusivo" em vez de declarar vencedor.
 */

// Aproximação de Abramowitz e Stegun 7.1.26 (erro < 1,5e-7).
function erf(x: number) {
  const sinal = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return sinal * y;
}

export function confiancaDiferenca(conv1: number, n1: number, conv2: number, n2: number) {
  if (n1 < 1 || n2 < 1) return null;
  const p1 = conv1 / n1;
  const p2 = conv2 / n2;
  const p = (conv1 + conv2) / (n1 + n2);
  const erro = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (!erro) return null;
  const z = Math.abs(p2 - p1) / erro;
  return erf(z / Math.SQRT2);
}
