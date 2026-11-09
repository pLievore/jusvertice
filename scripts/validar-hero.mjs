// Valida um vídeo do Veo ANTES de virar hero (scrubbing pela rolagem).
// Uso: node scripts/validar-hero.mjs caminho/do/video.mp4
//
// O scrubbing expõe defeitos que passam despercebidos no play normal: um corte vira um salto
// no meio da rolagem, uma piscada vira um "flash" toda vez que a pessoa passa por ali, e um
// vídeo sem progressão faz a rolagem parecer não ter efeito. Aqui medimos tudo isso por quadro.
//
// Critérios:
//   resolução      ≥ 1920×1080 (16:9)                         — nitidez no desktop retina
//   duração        2,5 a 10 s                                  — scrubbing precisa de ~60+ quadros reais
//   cortes         nenhum salto de imagem (diferença > média + 6σ)
//   progressão     a luz sobe do começo ao fim (correlação de Spearman ≥ 0,85 e ganho ≥ 15/255)
//   piscadas       nenhuma queda de luz > 4/255 entre quadros vizinhos
//   tremor         movimento quadro a quadro estável (coef. de variação da diferença ≤ 0,6)
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const entrada = process.argv[2];
if (!entrada || !existsSync(entrada)) {
  console.error("uso: node scripts/validar-hero.mjs caminho/do/video.mp4");
  process.exit(1);
}

const sonda = (campos) =>
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", campos, "-of", "default=nw=1:nk=1", entrada])
    .toString()
    .trim()
    .split(/\r?\n/);
const [largura, altura] = sonda("stream=width,height").map(Number);
const duracao = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", entrada]).toString(),
);

// Luminância média (YAVG) e diferença para o quadro anterior (YDIF), quadro a quadro.
const saida = spawnSync("ffmpeg", ["-hide_banner", "-i", entrada, "-vf", "scale=480:-2,signalstats,metadata=print:file=-", "-an", "-f", "null", "-"], {
  maxBuffer: 64 * 1024 * 1024,
}).stdout.toString();
const yavg = [...saida.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const ydif = [...saida.matchAll(/lavfi\.signalstats\.YDIF=([\d.]+)/g)].map((m) => Number(m[1])).slice(1);

const media = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const desvio = (a) => Math.sqrt(media(a.map((x) => (x - media(a)) ** 2)));
const postos = (a) => {
  const ord = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
  const r = new Array(a.length);
  ord.forEach(([, i], k) => (r[i] = k));
  return r;
};
const spearman = (a) => {
  const r = postos(a);
  const t = a.map((_, i) => i);
  const mr = media(r);
  const mt = media(t);
  const cov = r.reduce((s, x, i) => s + (x - mr) * (t[i] - mt), 0);
  return cov / Math.sqrt(r.reduce((s, x) => s + (x - mr) ** 2, 0) * t.reduce((s, x) => s + (x - mt) ** 2, 0));
};

// Ignora meio segundo nas pontas: o Veo costuma "assentar" nos primeiros e últimos quadros.
const fps = yavg.length / duracao;
const borda = Math.round(fps * 0.5);
const miolo = ydif.slice(borda, ydif.length - borda);
const limiteCorte = media(miolo) + 6 * desvio(miolo);
const cortes = miolo.map((d, i) => [d, i + borda + 1]).filter(([d]) => d > limiteCorte && d > 8);

const quedas = [];
for (let i = 1; i < yavg.length; i++) if (yavg[i - 1] - yavg[i] > 4) quedas.push(i);

// Progressão medida por segundo (média por janela), para não confundir com ruído de quadro.
const janelas = [];
for (let s = 0; s < Math.floor(duracao); s++) janelas.push(media(yavg.slice(Math.round(s * fps), Math.round((s + 1) * fps))));
const rho = spearman(janelas);
const ganho = media(yavg.slice(-borda)) - media(yavg.slice(0, borda));
const cvMovimento = desvio(miolo) / media(miolo);

const checks = [
  ["Resolução", `${largura}×${altura}`, largura >= 1920 && altura >= 1080 && Math.abs(largura / altura - 16 / 9) < 0.02, "≥ 1920×1080, 16:9"],
  ["Duração", `${duracao.toFixed(1)} s`, duracao >= 2.5 && duracao <= 10.1, "2,5 a 10 s (≥ 60 quadros)"],
  ["Cortes / saltos", cortes.length ? `${cortes.length} (quadros ${cortes.map(([, i]) => i).join(", ")})` : "nenhum", cortes.length === 0, "nenhum"],
  ["Progressão da luz", `ρ = ${rho.toFixed(2)}, ganho ${ganho >= 0 ? "+" : ""}${ganho.toFixed(1)}`, rho >= 0.85 && ganho >= 15, "ρ ≥ 0,85 e ganho ≥ +15"],
  ["Piscadas", quedas.length ? `${quedas.length} (quadros ${quedas.slice(0, 8).join(", ")}${quedas.length > 8 ? "…" : ""})` : "nenhuma", quedas.length === 0, "nenhuma"],
  // Cena quase parada (diferença média < 1/255): o CV perde sentido com média ~0, então passa.
  ["Tremor", `CV ${cvMovimento.toFixed(2)} (dif. média ${media(miolo).toFixed(2)})`, media(miolo) < 1 || cvMovimento <= 0.6, "≤ 0,6 ou cena parada"],
];

console.log(`\n${entrada}\n`);
for (const [nome, valor, ok, alvo] of checks) console.log(`${ok ? "OK   " : "FALHA"} ${nome.padEnd(18)} ${valor.padEnd(34)} (alvo: ${alvo})`);
const falhas = checks.filter(([, , ok]) => !ok).length;
console.log(falhas ? `\n${falhas} critério(s) reprovado(s). Gere outra variação ou corte o trecho com defeito.` : "\nAprovado para o hero.");
process.exit(falhas ? 1 : 0);
