import { ImageResponse } from "next/og";

export const alt = "JusVértice — Seu imóvel pode estar irregular sem você saber.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          background: "radial-gradient(circle at 85% 10%, rgba(214,178,106,0.28), transparent 55%), #071631",
          color: "#EEF1F5",
        }}
      >
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
            <span style={{ color: "#D6B26A" }}>Jus</span>
            <span style={{ color: "#C9CED6" }}>Vértice</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -2, maxWidth: 960 }}>
            Seu imóvel pode estar irregular sem você saber.
          </div>
          <div style={{ fontSize: 30, color: "#A9B4C6" }}>
            Engenharia e advocacia · Maringá e região · Diagnóstico pelo WhatsApp
          </div>
        </div>
      </div>
    ),
    size,
  );
}
