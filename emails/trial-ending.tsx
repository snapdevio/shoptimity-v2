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
  Link,
} from "@react-email/components"
import {
  body,
  container,
  logoContainer,
  logoImage,
  contentSection,
  heading,
  paragraph,
  infoBox,
  tableStyle,
  divider,
  footer,
  footerText,
  smallText,
  colors,
} from "@/emails/styles"

interface TrialEndingEmailProps {
  contactName: string
  trialEndsAt: string
  daysRemaining?: string
}

export function TrialEndingEmail({
  contactName,
  trialEndsAt,
  daysRemaining,
}: TrialEndingEmailProps) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

  return (
    <Html>
      <Head />
      <Preview>
        {daysRemaining
          ? `Your Shoptimity trial is ending in ${daysRemaining}`
          : `Your Shoptimity trial is ending on ${trialEndsAt}`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg`}
              height="32"
              alt="Shoptimity Logo"
              style={logoImage}
            />
          </Section>

          <Section style={contentSection}>
            <Text style={heading}>Trial Ending Soon</Text>
            <Text style={paragraph}>
              Hi {contactName}, just a heads-up that your session trial with
              Shoptimity is ending{" "}
              {daysRemaining ? (
                <>
                  in <strong>{daysRemaining}</strong>
                </>
              ) : (
                <>
                  on <strong>{trialEndsAt}</strong>
                </>
              )}
              .
            </Text>

            <Text style={paragraph}>
              To avoid any service interruption and keep access to your premium
              templates and domain assignments, please ensure your payment
              method is up to date in your dashboard.
            </Text>

            <Section style={infoBox}>
              <table style={tableStyle} cellPadding="0" cellSpacing="0">
                <tbody>
                  <tr>
                    <td style={infoLabel}>Status</td>
                    <td style={infoValue}>Trial Active</td>
                  </tr>
                  <tr>
                    <td style={{ ...infoLabel, borderBottom: "none" }}>
                      Ends At
                    </td>
                    <td style={{ ...infoValue, borderBottom: "none" }}>
                      {trialEndsAt}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Link href={dashboardUrl} style={button}>
                Manage Subscription
              </Link>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              If you have any questions or need help choosing the right plan,
              don't hesitate to reach out to our team.
            </Text>

            <Text style={smallText}>We're excited to have you on board!</Text>
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

export default TrialEndingEmail

const infoLabel: React.CSSProperties = {
  color: colors.mutedForeground,
  fontSize: "13px",
  fontWeight: 500,
  padding: "10px 0",
  borderBottom: `1px solid ${colors.border}`,
  verticalAlign: "top",
}

const infoValue: React.CSSProperties = {
  color: colors.foreground,
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 0",
  textAlign: "right" as const,
  borderBottom: `1px solid ${colors.border}`,
  verticalAlign: "top",
}

const button: React.CSSProperties = {
  backgroundColor: colors.primary,
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "0 auto",
}
