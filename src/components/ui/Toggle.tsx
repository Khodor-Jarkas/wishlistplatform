"use client"

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}

export default function Toggle({ checked, onChange, label, description }: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
      {(label || description) && (
        <div>
          {label && <p style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", margin: 0 }}>{label}</p>}
          {description && <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: 48,
          height: 26,
          borderRadius: 9999,
          background: checked ? "#38A3C7" : "#CBD5E1",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 200ms",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 25 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "white",
            transition: "left 200ms",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </button>
    </div>
  )
}
