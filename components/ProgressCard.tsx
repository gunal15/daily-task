import { C, R, T } from "@/lib/iosTokens";

interface Props {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

/*
 * iOS widget-style progress card.
 * systemBlue (#007AFF) filled card — mirrors a Home Screen widget.
 */
export default function ProgressCard({ total, completed, pending, percentage }: Props) {
  const statsRow = [
    { label: "Total",   value: total,     valueColor: "rgba(255,255,255,0.95)" },
    { label: "Done",    value: completed, valueColor: "#4AFF7E" },
    { label: "Pending", value: pending,   valueColor: "#FFD60A" },
  ];

  return (
    <div
      style={{
        margin:          "0 16px",
        borderRadius:    `${R.lg}px`,
        overflow:        "hidden",
        backgroundColor: C.blue,
        padding:         "20px 20px 16px",
      }}
    >
      {/* Top row: big % + fraction */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
        <div>
          <p style={{ ...T.caption2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)", margin: 0 }}>
            Daily Progress
          </p>
          <p style={{ fontSize: "44px", lineHeight: "50px", fontWeight: 700, letterSpacing: "-1px", color: "#fff", margin: 0, marginTop: "2px" }}>
            {percentage}
            <span style={{ fontSize: "22px", fontWeight: 500, opacity: 0.8 }}>%</span>
          </p>
        </div>
        <div style={{ textAlign: "right", marginTop: "4px" }}>
          <p style={{ ...T.subhead, color: "rgba(255,255,255,0.85)", margin: 0 }}>{completed} / {total}</p>
          <p style={{ ...T.caption1, color: "rgba(255,255,255,0.6)", margin: 0, marginTop: "2px" }}>completed</p>
        </div>
      </div>

      {/* Progress track */}
      <div style={{ height: "4px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.3)", marginTop: "12px", marginBottom: "16px" }}>
        <div style={{ height: "4px", borderRadius: "2px", backgroundColor: "#fff", width: `${percentage}%`, transition: "width 0.7s ease" }} />
      </div>

      {/* Stat chips */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {statsRow.map(({ label, value, valueColor }) => (
          <div key={label} style={{ borderRadius: `${R.md}px`, backgroundColor: "rgba(255,255,255,0.15)", padding: "10px 0", textAlign: "center" }}>
            <p style={{ ...T.title3, color: valueColor, margin: 0, fontWeight: 700 }}>{value}</p>
            <p style={{ ...T.caption2, color: "rgba(255,255,255,0.65)", margin: 0, marginTop: "2px" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
