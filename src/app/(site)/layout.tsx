import { MetaPixel } from "@/components/MetaPixel";
import { SmoothScroll } from "@/components/SmoothScroll";

/** Páginas públicas: rolagem suave, Pixel da Meta e o atalho de teclado para o conteúdo. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only-focusable fixed left-4 top-4 z-[60] rounded-full bg-gold px-5 py-3 font-semibold text-stage"
      >
        Pular para o conteúdo
      </a>
      {children}
      <SmoothScroll />
      <MetaPixel />
    </>
  );
}
