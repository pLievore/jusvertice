// Pipeline do hero: vídeo do Veo 3 → mídia pronta para a página.
//
// Uso:  node scripts/montar-hero.mjs caminho/do/video.mp4 [quadros=120] [--boomerang]
//
// Gera:
//   public/midia/hero/quadros/jv-NNN.webp   sequência do desktop (avança com a rolagem)
//   public/midia/hero/hero-mobile.mp4       vídeo do celular, 16:9 inteiro (faixa no topo)
//   src/assets/midia/hero-poster.jpg        primeiro quadro (enquanto os quadros carregam)
//   src/assets/midia/hero-poster-final.jpg  último quadro, casa acesa (movimento reduzido)
//   src/content/hero-midia.json             liga o modo vídeo e guarda a versão (cache)
//
// Celular: o vídeo NÃO é recortado em retrato. Um 1280×720 recortado em 3:4 sobra 540 px
// de largura, esticado 3× numa tela retina — borrado. Ele entra inteiro numa faixa 16:9.
// Por padrão toca uma vez e para com a casa acesa; `--boomerang` faz ida e volta em loop.
//
// Requer ffmpeg no PATH.
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const boomerang = args.includes("--boomerang");
const [entrada, quadrosArg] = args.filter((a) => !a.startsWith("--"));
if (!entrada || !existsSync(entrada)) {
  console.error("uso: node scripts/montar-hero.mjs caminho/do/video.mp4 [quadros] [--boomerang]");
  process.exit(1);
}
const QUADROS = Number(quadrosArg ?? 120);
const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });
const sonda = (campos, extra = []) =>
  execFileSync("ffprobe", ["-v", "error", ...extra, "-show_entries", campos, "-of", "default=nw=1:nk=1", entrada]).toString().trim();
const duracao = Number(sonda("format=duration"));

// Recorte automático de letterbox (o Veo às vezes entrega com tarja preta).
const corte = spawnSync("ffmpeg", ["-hide_banner", "-i", entrada, "-vf", "cropdetect=24:16:0", "-frames:v", "60", "-f", "null", "-"])
  .stderr.toString()
  .match(/crop=\d+:\d+:\d+:\d+/g)
  ?.at(-1);
const larguraFonte = corte ? Number(corte.split("=")[1].split(":")[0]) : Number(sonda("stream=width", ["-select_streams", "v:0"]));
const LARGURA = Math.min(1920, larguraFonte); // nunca amplia
const pre = corte ? `${corte},` : "";

// 1. Quadros do desktop
const dirQuadros = "public/midia/hero/quadros";
rmSync(dirQuadros, { recursive: true, force: true });
mkdirSync(dirQuadros, { recursive: true });
ff([
  "-i", entrada,
  "-vf", `${pre}fps=${(QUADROS / duracao).toFixed(6)},scale=${LARGURA}:-2:flags=lanczos`,
  "-c:v", "libwebp", "-quality", "90", "-compression_level", "6",
  "-frames:v", String(QUADROS),
  `${dirQuadros}/jv-%03d.webp`,
]);
const gerados = readdirSync(dirQuadros).filter((f) => f.endsWith(".webp")).length;

// 2. Posters (import estático → URL com hash)
mkdirSync("src/assets/midia", { recursive: true });
ff(["-i", entrada, "-vf", `${pre}scale=${LARGURA}:-2`, "-frames:v", "1", "-q:v", "1", "src/assets/midia/hero-poster.jpg"]);
ff(["-sseof", "-0.2", "-i", entrada, "-vf", `${pre}scale=${LARGURA}:-2`, "-frames:v", "1", "-q:v", "1", "src/assets/midia/hero-poster-final.jpg"]);

// 3. Vídeo do celular: 16:9 inteiro, qualidade alta
mkdirSync("public/midia/hero", { recursive: true });
const filtro = boomerang
  ? `[0:v]${pre}scale=${LARGURA}:-2,fps=30,split[a][b];[b]reverse,trim=start_frame=1[r];[a][r]concat=n=2:v=1[v]`
  : `[0:v]${pre}scale=${LARGURA}:-2,fps=30[v]`;
ff([
  "-i", entrada,
  "-filter_complex", filtro,
  "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "public/midia/hero/hero-mobile.mp4",
]);

// Versão = hash do vídeo de origem: muda a URL dos quadros e do mp4 quando o vídeo muda.
const versao = createHash("sha1").update(readFileSync(entrada)).digest("hex").slice(0, 10);
writeFileSync(
  "src/content/hero-midia.json",
  JSON.stringify({ quadros: gerados, largura: LARGURA, videoMobile: true, loopMobile: boomerang, versao }, null, 2) + "\n",
);
console.log(`pronto: ${gerados} quadros de ${LARGURA}px, vídeo mobile 16:9 ${boomerang ? "em boomerang" : "de uma passada"}, versão ${versao}.`);
