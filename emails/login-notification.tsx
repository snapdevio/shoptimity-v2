import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
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
  ctaButtonContainer,
  ctaButton,
  divider,
  footer,
  footerText,
  smallText,
} from "@/emails/styles"

interface LoginNotificationEmailProps {
  loginUrl: string
}

export function LoginNotificationEmail({
  loginUrl,
}: LoginNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to your Shoptimity account</Preview>
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
            <Text style={heading}>Your account is ready</Text>
            <Text style={paragraph}>
              A Shoptimity administrator has requested that you receive a
              sign-in link. Click the button below to access your dashboard
              where you can manage your licenses, domains, and templates.
            </Text>

            <Section style={ctaButtonContainer}>
              <Button style={ctaButton} href={loginUrl}>
                Go to Shoptimity Login
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={smallText}>
              If you did not expect this email, you can safely ignore it. No
              action is required on your part.
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

export default LoginNotificationEmail
