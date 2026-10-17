import { empresa } from "@/content/site";

export function JsonLd({ faq }: { faq: { pergunta: string; resposta: string }[] }) {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: empresa.nome,
      legalName: empresa.razaoSocial,
      url: empresa.url,
      description:
        "Engenharia e advocacia para regularização imobiliária, topografia, georreferenciamento e projetos técnicos.",
      areaServed: empresa.cidades.map((c) => ({ "@type": "City", name: `${c} - ${empresa.uf}` })),
      address: {
        "@type": "PostalAddress",
        addressLocality: empresa.cidade,
        addressRegion: empresa.uf,
        addressCountry: "BR",
      },
      geo: { "@type": "GeoCoordinates", latitude: empresa.geo.lat, longitude: empresa.geo.lng },
      sameAs: [empresa.instagram],
      knowsAbout: ["Regularização imobiliária", "Topografia", "Georreferenciamento", "Projetos técnicos"],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.pergunta,
        acceptedAnswer: { "@type": "Answer", text: f.resposta },
      })),
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
