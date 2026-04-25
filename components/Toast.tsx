import { CheckCircle2, AlertCircle } from "lucide-react";
import { C, T } from "@/lib/iosTokens";

interface Props { message: string; type: "success" | "error"; }

/*
 * iOS system notification pill.
 * Frosted dark glass, entrance from top, pill shape.
 */
export default function Toast({ message, type }: Props) {
  return (
    <div
      className="toast-enter"
      style={{
        position:        "fixed",
        top:             "env(safe-area-inset-top, 16px)",
        left:            "50%",
        transform:       "translateX(-50%)",
        zIndex:          300,
        display:         "flex",
        alignItems:      "center",
        gap:             "8px",
        padding:         "10px 18px",
        borderRadius:    "999px",
        backgroundColor: type === "success" ? "rgba(28,28,30,0.90)" : "rgba(255,59,48,0.90)",
        backdropFilter:        "saturate(180%) blur(20px)",
        WebkitBackdropFilter:  "saturate(180%) blur(20px)",
        boxShadow:       "0 4px 16px rgba(0,0,0,0.25)",
        whiteSpace:      "nowrap",
        maxWidth:        "calc(100vw - 32px)",
      }}
    >
      {type === "success" ? (
        <CheckCircle2 style={{ width: "15px", height: "15px", color: C.green, flexShrink: 0 }} />
      ) : (
        <AlertCircle  style={{ width: "15px", height: "15px", color: "#fff", flexShrink: 0 }} />
      )}
      <span style={{ ...T.subhead, fontWeight: 500, color: "#fff" }}>{message}</span>
    </div>
  );
}
