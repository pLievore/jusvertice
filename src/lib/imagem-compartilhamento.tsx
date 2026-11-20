import { ImageResponse } from "next/og";

export const tamanhoCompartilhamento = { width: 1200, height: 630 };

/** Imagem que aparece ao compartilhar o link (WhatsApp, redes). Cada página passa seu título. */
export function imagemCompartilhamento(titulo: string, linha: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#002448",
          color: "#F4F2EC",
          position: "relative",
        }}
      >
        {/* Arco dourado da marca */}
        <svg width="460" height="460" viewBox="0 0 200 200" style={{ position: "absolute", right: -90, bottom: -150 }}>
          <path d="M12 200A188 188 0 0 1 200 12" fill="none" stroke="#CCA85E" strokeWidth="14" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="74" height="78" viewBox="0 0 200 210">
            <path
              fill="#D6B26A"
              d="M12 52H84V58.5H67.5V158C67.5 182 52 198 30 198C17 198 7 192 2.5 183L8.5 179C13 186 20.5 190.5 29.5 190.5C41.5 190.5 49 180 49 160V58.5H12Z"
            />
            <path fill="#D6B26A" d="M87 45 96.5 38.5V100H87Z" />
            <path fill="#C9CED6" d="M103.5 16 116 7.5V120H103.5ZM120 31 131 24V140H120ZM135 47 145 41V130H135Z" />
            <path fill="#C9CED6" d="M76 90H101L125 156 172 82H198L125 200Z" />
          </svg>
          <div style={{ display: "flex", fontSize: 40 }}>
            <span style={{ color: "#CCA85E" }}>Jus</span>
            <span style={{ color: "#F4F2EC", fontWeight: 700 }}>Vértice</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1, maxWidth: 940, textTransform: "uppercase" }}>
            {titulo}
          </div>
          <div style={{ fontSize: 30, color: "#AFBCD1" }}>{linha}</div>
        </div>
      </div>
    ),
    tamanhoCompartilhamento,
  );
}
