import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Hr,
  Preview,
  Img,
} from "@react-email/components"
import {
  body,
  container,
  logoContainer,
  logoImage,
  contentSection,
  heading,
  paragraph,
  ctaButtonContainer,
  ctaButton,
  divider,
  linkStyle,
  footer,
  footerText,
  smallText,
} from "@/emails/styles"

interface ResetPasswordEmailProps {
  resetPasswordUrl: string
  name: string
}

export function ResetPasswordEmail({
  resetPasswordUrl,
  name,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Shoptimity password</Preview>
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
            <Text style={heading}>Reset your password</Text>
            <Text style={paragraph}>
              Hi {name}, we received a request to reset your Shoptimity
              password. Click the button below to choose a new one.
            </Text>

            <Section style={ctaButtonContainer}>
              <Button style={ctaButton} href={resetPasswordUrl}>
                Reset Password
              </Button>
            </Section>

            <Text style={smallText}>
              This link will expire shortly. If you did not request a password
              reset, you can safely ignore this email.
            </Text>

            <Hr style={divider} />

            <Text style={smallText}>
              If the button above does not work, copy and paste this URL into
              your browser:
            </Text>
            <Link href={resetPasswordUrl} style={linkStyle}>
              {resetPasswordUrl}
            </Link>
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

export default ResetPasswordEmail
