import { formatBDT } from "@/lib/catalog";

type Day = { day: string; revenue_bdt: number; orders: number };

/** Lightweight SVG bar chart (no chart library). */
export function SalesChart({ data }: { data: Day[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue_bdt));
  const W = 720, H = 200, pad = 24, bw = (W - pad) / Math.max(1, data.length);
  const total = data.reduce((a, d) => a + d.revenue_bdt, 0);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" role="img" aria-label={`Revenue over the last ${data.length} days, total ${formatBDT(total)}`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} x2={W} y1={H - H * f + 4} y2={H - H * f + 4} stroke="#e2d8c8" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const h = Math.max(d.revenue_bdt > 0 ? 2 : 0, (d.revenue_bdt / max) * (H - 8));
          return (
            <g key={d.day}>
              <rect x={pad + i * bw + bw * 0.18} y={H - h + 4} width={bw * 0.64} height={h} rx="2" fill={d.revenue_bdt > 0 ? "#2e2b27" : "#e2d8c8"}>
                <title>{`${d.day}: ${formatBDT(d.revenue_bdt)} · ${d.orders} orders`}</title>
              </rect>
              {((i % 7 === 0 && data.length - 1 - i >= 4) || i === data.length - 1) && (
                <text x={pad + i * bw + bw / 2} y={H + 20} textAnchor="middle" fontSize="10" fill="#6f675d">
                  {new Date(d.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </text>
              )}
            </g>
          );
        })}
        <text x="0" y="12" fontSize="10" fill="#6f675d">{formatBDT(max)}</text>
      </svg>
    </figure>
  );
}
