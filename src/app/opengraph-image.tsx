import { imagemCompartilhamento, tamanhoCompartilhamento } from "@/lib/imagem-compartilhamento";

export const alt = "JusVértice — Seu imóvel pode estar irregular sem você saber.";
export const size = tamanhoCompartilhamento;
export const contentType = "image/png";

export default function Image() {
  return imagemCompartilhamento(
    "Seu imóvel pode estar irregular sem você saber.",
    "Engenharia e consultoria jurídica · Maringá e Ponta Grossa",
  );
}
