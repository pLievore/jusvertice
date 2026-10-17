// Gera o "projeto da casa" (estilo blueprint) a partir da própria foto do antes/depois:
// as linhas vêm da foto, então o desenho coincide traço a traço com ela no comparador.
// Uso: node scripts/gerar-planta.mjs [entrada] [saida]
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const entrada = process.argv[2] ?? "midia-fonte/antes-depois.jpg";
const saida = process.argv[3] ?? "src/assets/midia/antes-depois-planta.jpg";
const LARGURA = 2400;
const tmp = `${process.env.TEMP ?? "/tmp"}/jv-bordas.png`;

// 1. Bordas (Canny do ffmpeg). Um leve desfoque antes tira a textura do concreto e da grama,
//    deixando só as arestas da arquitetura.
execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-i", entrada,
  "-vf", `scale=${LARGURA}:-2,format=gray,gblur=sigma=1.6,edgedetect=low=0.06:high=0.16,format=gray`,
  "-frames:v", "1", tmp,
]);

const meta = await sharp(tmp).metadata();
const { width, height } = meta;

// 2. Linha um pouco mais grossa e suave (cara de traço a nanquim, não de pixel)
const mascara = await sharp(tmp).blur(0.7).linear(1.9, 0).toColourspace("b-w").raw().toBuffer();

// 3. Azul de prancheta + traço claro usando a máscara como alfa
const traco = await sharp({ create: { width, height, channels: 3, background: "#e9eef6" } })
  .joinChannel(mascara, { raw: { width, height, channels: 1 } })
  .png()
  .toBuffer();

await sharp({ create: { width, height, channels: 3, background: "#123764" } })
  .composite([
    // vinheta suave para dar profundidade de papel
    {
      input: Buffer.from(
        `<svg width="${width}" height="${height}"><defs><radialGradient id="v" cx="50%" cy="45%" r="75%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`,
      ),
    },
    { input: traco },
  ])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(saida);

console.log("ok", saida, `${width}x${height}`);
