import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel JusVértice" },
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
};

export const viewport: Viewport = {
  themeColor: "#002448",
};

/** Painel administrativo: fora do Google, sem Pixel, sem rolagem suave e sem o rastreamento do site. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="painel min-h-dvh bg-[#eef1f6] text-[#0a1f3f]">{children}</div>;
}
