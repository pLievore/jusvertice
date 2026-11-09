// Prepara as imagens originais (midia-fonte/) para a página (src/assets/midia/).
//
// As imagens entram no código por import estático: o Next gera URL com hash do conteúdo,
// então trocar uma imagem nunca mais esbarra em cache antigo (servidor ou navegador).
// Aqui só reduzimos ao tamanho útil e salvamos com qualidade alta — a compressão final
// (AVIF/WebP) é feita UMA vez pelo next/image. Comprimir forte aqui e de novo lá borra a foto.
//
// Uso: node scripts/otimizar-midia.mjs [pasta-origem]
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";

const ORIGEM = process.argv[2] ?? "midia-fonte";
const DESTINO = "src/assets/midia";
mkdirSync(DESTINO, { recursive: true });

// [arquivo de origem, largura máxima, nome de saída opcional] — cobre a maior exibição em tela retina.
const IMAGENS = [
  ["antes-depois.jpg", 2400],
  ["situacao-venda.jpg", 1800],
  ["situacao-financiamento.jpg", 1800],
  ["situacao-heranca.jpg", 1800],
  ["situacao-gaveta.jpg", 1800],
  // Quando chegar: trocar imgCapGeo por esta no item georreferenciamento de site.ts
  ["situacao-georreferenciamento.jpg", 1800],
  ["capacidade-topografia.jpg", 1400],
  ["capacidade-georreferenciamento.jpg", 1400],
  ["capacidade-projetos.jpg", 1400],
  ["cta-final.jpg", 3000],
  // Página /georreferenciamento: o campo iluminado do vídeo do topo (último quadro em alta)
  ["quadro-final.png.jpg", 1800, "georref-campo.jpg"],
  ["quadro-final2.png.jpg", 3000, "georref-campo-penumbra.jpg"],
];

for (const [arquivo, largura, saida = arquivo] of IMAGENS) {
  const fonte = `${ORIGEM}/${arquivo}`;
  if (!existsSync(fonte)) {
    console.log("pulado (sem original)", arquivo);
    continue;
  }
  const info = await sharp(fonte)
    .rotate()
    .resize({ width: largura, withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg({ quality: 93, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(`${DESTINO}/${saida}`);
  console.log(`ok ${saida.padEnd(36)} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
}
