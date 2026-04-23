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

interface VerificationEmailProps {
  verificationUrl: string
  name: string
}

export function VerificationEmail({
  verificationUrl,
  name,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Shoptimity account</Preview>
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
            <Text style={heading}>Welcome to Shoptimity!</Text>
            <Text style={paragraph}>
              Hi {name}, thanks for joining Shoptimity. Please click the button
              below to verify your email address and activate your account.
            </Text>

            <Section style={ctaButtonContainer}>
              <Button style={ctaButton} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={smallText}>
              This link is for one-time use and will expire shortly. If you did
              not create an account on Shoptimity, you can safely ignore this
              email.
            </Text>

            <Hr style={divider} />

            <Text style={smallText}>
              If the button above does not work, copy and paste this URL into
              your browser:
            </Text>
            <Link href={verificationUrl} style={linkStyle}>
              {verificationUrl}
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

export default VerificationEmail
