interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = "", ...props }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: "100%",
          padding: "12px 14px",
          border: error ? "1px solid #EF4444" : "1px solid #E2E8F0",
          borderRadius: 8,
          fontSize: 14,
          color: "#0F172A",
          background: "white",
          outline: "none",
          transition: "border-color 150ms",
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#38A3C7"
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "#EF4444" : "#E2E8F0"
          props.onBlur?.(e)
        }}
      />
      {error && (
        <span style={{ fontSize: 12, color: "#EF4444" }}>{error}</span>
      )}
    </div>
  )
}
