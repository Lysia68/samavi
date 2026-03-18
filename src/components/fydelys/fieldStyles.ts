import type { CSSProperties } from "react"

export function getFieldStyle(opts: {
  error?: string
  border: string
  text: string
  surfaceWarm: string
  height?: number
}): CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${opts.error ? "#C43A3A" : opts.border}`,
    borderRadius: 8,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    color: opts.text,
    background: opts.error ? "#FFF5F5" : opts.surfaceWarm,
    transition: "border-color .15s",
    ...(opts.height ? { height: opts.height } : {}),
  }
}
