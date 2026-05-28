"use client"

import { useState } from "react"

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { label: string; value: string }[]
  placeholder?: string
}

export default function Select({ label, error, options, placeholder, className = "", onChange, ...props }: Props) {
  // Track whether a real option has been chosen (needed for uncontrolled usage)
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

  const isSelected = hasValue || !!props.value

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          {...props}
          onChange={(e) => {
            setHasValue(!!e.target.value)
            onChange?.(e)
          }}
          style={{
            width: "100%",
            padding: "12px 36px 12px 14px",
            border: error ? "1px solid #EF4444" : "1px solid #E2E8F0",
            borderRadius: 8,
            fontSize: 16, // 16px prevents Android Chrome auto-zoom on focus
            color: isSelected ? "#0F172A" : "#94A3B8",
            background: "white",
            appearance: "none",
            cursor: "pointer",
            outline: "none",
            ...props.style,
          }}
        >
          {placeholder && (
            <option value="" disabled style={{ color: "#94A3B8" }}>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} style={{ color: "#0F172A" }}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && <span style={{ fontSize: 12, color: "#EF4444" }}>{error}</span>}
    </div>
  )
}
