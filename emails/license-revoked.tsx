import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
  Img,
} from "@react-email/components"
import {
  body,
  container,
  logoContainer,
  logoImage,
  logoText,
  contentSection,
  heading,
  paragraph,
  alertBox,
  tableStyle,
  divider,
  footer,
  footerText,
  smallText,
  colors,
} from "@/emails/styles"

interface LicenseRevokedEmailProps {
  email: string
  reason: "refund" | "dispute" | "admin_action"
  planName: string
  domainCount: number
}

const reasonMessages: Record<
  LicenseRevokedEmailProps["reason"],
  { title: string; explanation: string }
> = {
  refund: {
    title: "License Revoked &mdash; Refund Processed",
    explanation:
      "Your license has been revoked because a refund was processed for the associated payment. Access for all connected domains has been removed.",
  },
  dispute: {
    title: "License Revoked &mdash; Payment Dispute",
    explanation:
      "Your license has been revoked because a payment dispute was filed for the associated transaction. Access for all connected domains has been removed.",
  },
  admin_action: {
    title: "License Revoked by Administrator",
    explanation:
      "Your license has been revoked by a Shoptimity administrator. Access for all connected domains has been removed.",
  },
}

export function LicenseRevokedEmail({
  email,
  reason,
  planName,
  domainCount,
}: LicenseRevokedEmailProps) {
  const { title, explanation } = reasonMessages[reason]

  return (
    <Html>
      <Head />
      <Preview>{title.replace("&mdash;", "—")}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg`}
              height="32"
              alt="Shoptimity Logo"
              style={logoImage}
            />
            {/* <Text style={logoText}>Shoptimity</Text> */}
          </Section>

          <Section style={contentSection}>
            <Text style={heading}>{title}</Text>
            <Text style={paragraph}>{explanation}</Text>

            <Section style={alertBox}>
              <table style={tableStyle} cellPadding="0" cellSpacing="0">
                <tbody>
                  <tr>
                    <td style={alertLabel}>Account</td>
                    <td style={alertValue}>{email}</td>
                  </tr>
                  <tr>
                    <td style={alertLabel}>Plan</td>
                    <td style={alertValue}>{planName}</td>
                  </tr>
                  <tr>
                    <td style={{ ...alertLabel, borderBottom: "none" }}>
                      Domains Affected
                    </td>
                    <td style={{ ...alertValue, borderBottom: "none" }}>
                      {domainCount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              If you believe this was done in error, please contact our support
              team and we will be happy to assist.
            </Text>

            <Text style={smallText}>
              We understand this may be inconvenient and appreciate your
              patience.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Shoptimity. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default LicenseRevokedEmail

const alertLabel: React.CSSProperties = {
  color: colors.mutedForeground,
  fontSize: "13px",
  fontWeight: 500,
  padding: "10px 0",
  borderBottom: `1px solid ${colors.destructiveBorder}`,
  verticalAlign: "top",
}

const alertValue: React.CSSProperties = {
  color: colors.foreground,
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 0",
  textAlign: "right" as const,
  borderBottom: `1px solid ${colors.destructiveBorder}`,
  verticalAlign: "top",
}
