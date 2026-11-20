import { imagemCompartilhamento, tamanhoCompartilhamento } from "@/lib/imagem-compartilhamento";

export const alt = "JusVértice — Seu imóvel regularizado. Seu patrimônio protegido.";
export const size = tamanhoCompartilhamento;
export const contentType = "image/png";

export default function Image() {
  return imagemCompartilhamento(
    "Seu imóvel regularizado. Seu patrimônio protegido.",
    "Georreferenciamento, topografia e regularização · Maringá e Ponta Grossa",
  );
}
