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
  infoBox,
  tableStyle,
  tableLabel,
  tableValue,
  divider,
  footer,
  footerText,
  smallText,
  colors,
} from "@/emails/styles"

interface ConversionConfirmationEmailProps {
  contactName: string
  email: string
  planName: string
  licenseQuantity: number
  totalAmount: number
  currency: string
  domains?: string[]
}

function formatCurrency(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function ConversionConfirmationEmail({
  contactName,
  email,
  planName,
  licenseQuantity,
  totalAmount,
  currency,
  domains,
}: ConversionConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Conversion confirmed &mdash; {formatCurrency(totalAmount, currency)}
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
            <Text style={heading}>Conversion Confirmed</Text>
            <Text style={paragraph}>
              Hi {contactName}, your trial has officially ended and been
              converted to an active Pro subscription. Welcome to the Shoptimity
              family!
            </Text>

            <Section style={infoBox}>
              <table style={tableStyle} cellPadding="0" cellSpacing="0">
                <tbody>
                  <tr>
                    <td style={tableLabel}>Plan</td>
                    <td style={tableValue}>{planName}</td>
                  </tr>
                  <tr>
                    <td style={tableLabel}>Licenses</td>
                    <td style={tableValue}>{licenseQuantity}</td>
                  </tr>
                  <tr>
                    <td style={tableLabel}>Account</td>
                    <td style={tableValue}>{email}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableLabel, borderBottom: "none" }}>
                      Total Paid
                    </td>
                    <td
                      style={{
                        ...tableValue,
                        borderBottom: "none",
                        fontWeight: 700,
                        fontSize: "16px",
                      }}
                    >
                      {formatCurrency(totalAmount, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {domains && domains.length > 0 && (
              <>
                <Hr style={divider} />
                <Text style={{ ...paragraph, fontWeight: 600 }}>
                  Active Domains
                </Text>
                <Text style={smallText}>
                  Your license continues to be active for the following domains:
                </Text>
                <Section style={infoBox}>
                  {domains.map((domain) => (
                    <Text key={domain} style={domainItem}>
                      {domain}
                    </Text>
                  ))}
                </Section>
              </>
            )}

            <Hr style={divider} />

            <Text style={paragraph}>
              You now have full access to your {planName} features, premium
              templates, and updates. Thank you for choosing Shoptimity!
            </Text>

            <Text style={smallText}>
              If you have any questions about your conversion, please contact
              our support team.
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

export default ConversionConfirmationEmail

const domainItem: React.CSSProperties = {
  color: colors.foreground,
  fontSize: "13px",
  fontFamily:
    '"SF Mono", SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
  margin: "4px 0",
  padding: "2px 0",
}
