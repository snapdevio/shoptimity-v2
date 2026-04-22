/**
 * Shared email styles matching the Shoptimity olive brand.
 *
 * The app uses an olive/earth-tone palette:
 *   --primary:            oklch(0.228 0.013 107.4)  ≈ #33302a (dark olive)
 *   --primary-foreground: oklch(0.988 0.003 106.5)  ≈ #fafaf8 (warm white)
 *   --muted-foreground:   oklch(0.58  0.031 107.3)  ≈ #8a8470 (muted olive)
 *   --muted:              oklch(0.966 0.005 106.5)  ≈ #f5f5f2 (light bg)
 *   --border:             oklch(0.93  0.007 106.5)  ≈ #e8e6e1 (border)
 *   --destructive:        oklch(0.577 0.245 27.3)   ≈ #dc2626 (red)
 */

// Brand colors
export const colors = {
  primary: "#33302a",
  primaryForeground: "#fafaf8",
  foreground: "#1c1a16",
  mutedForeground: "#8a8470",
  muted: "#f5f5f2",
  border: "#e8e6e1",
  background: "#fafaf8",
  pageBackground: "#f5f3ef",
  accent: "#4a4639",
  destructive: "#dc2626",
  destructiveBg: "#fef2f2",
  destructiveBorder: "#fecaca",
  link: "#5c7c3a",
} as const

// Shared layout styles
export const body: React.CSSProperties = {
  backgroundColor: colors.pageBackground,
  fontFamily:
    '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  margin: 0,
  padding: "40px 0",
}

export const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "560px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
}

export const logoContainer: React.CSSProperties = {
  backgroundColor: colors.background,
  padding: "24px 32px",
  borderRadius: "12px 12px 0 0",
  textAlign: "center",
  borderBottom: `1px solid ${colors.border}`,
}

export const logoImage: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
}

export const logoText: React.CSSProperties = {
  color: colors.primaryForeground,
  fontSize: "24px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: "0 0 0 8px",
  display: "inline-block",
  verticalAlign: "middle",
}

export const contentSection: React.CSSProperties = {
  padding: "32px 32px 24px",
}

export const heading: React.CSSProperties = {
  color: colors.foreground,
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "30px",
  margin: "0 0 16px",
}

export const paragraph: React.CSSProperties = {
  color: colors.foreground,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
}

export const ctaButtonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0",
}

export const ctaButton: React.CSSProperties = {
  backgroundColor: colors.primary,
  borderRadius: "8px",
  color: colors.primaryForeground,
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 36px",
  display: "inline-block",
}

export const divider: React.CSSProperties = {
  borderColor: colors.border,
  borderTop: "none",
  margin: "24px 0",
}

export const linkStyle: React.CSSProperties = {
  color: colors.link,
  fontSize: "13px",
  wordBreak: "break-all" as const,
  textDecoration: "underline",
}

export const infoBox: React.CSSProperties = {
  backgroundColor: colors.muted,
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "20px 0",
}

export const alertBox: React.CSSProperties = {
  backgroundColor: colors.destructiveBg,
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "20px 0",
  border: `1px solid ${colors.destructiveBorder}`,
}

export const tableStyle: React.CSSProperties = {
  width: "100%",
}

export const tableLabel: React.CSSProperties = {
  color: colors.mutedForeground,
  fontSize: "13px",
  fontWeight: 500,
  padding: "12px 0",
  borderBottom: `1px solid ${colors.border}`,
  verticalAlign: "top",
}

export const tableValue: React.CSSProperties = {
  color: colors.foreground,
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 0",
  textAlign: "right" as const,
  borderBottom: `1px solid ${colors.border}`,
  verticalAlign: "top",
}

export const footer: React.CSSProperties = {
  padding: "20px 32px",
  borderTop: `1px solid ${colors.border}`,
}

export const footerText: React.CSSProperties = {
  color: colors.mutedForeground,
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
  textAlign: "center" as const,
}

export const smallText: React.CSSProperties = {
  color: colors.mutedForeground,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
}
