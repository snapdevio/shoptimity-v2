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
  logoText,
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

interface MagicLinkEmailProps {
  magicLinkUrl: string
  expiresInMinutes?: number
}

export function MagicLinkEmail({
  magicLinkUrl,
  expiresInMinutes = 15,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Shoptimity sign-in link</Preview>
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
            <Text style={heading}>Sign in to your account</Text>
            <Text style={paragraph}>
              Click the button below to securely sign in to your Shoptimity
              dashboard. You can manage your licenses, domains, and access your
              premium templates.
            </Text>

            <Section style={ctaButtonContainer}>
              <Button style={ctaButton} href={magicLinkUrl}>
                Sign in to Shoptimity
              </Button>
            </Section>

            <Text style={smallText}>
              This link expires in <strong>{expiresInMinutes} minutes</strong>{" "}
              and can only be used once. If you did not request this email, you
              can safely ignore it.
            </Text>

            <Hr style={divider} />

            <Text style={smallText}>
              If the button above does not work, copy and paste this URL into
              your browser:
            </Text>
            <Link href={magicLinkUrl} style={linkStyle}>
              {magicLinkUrl}
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

export default MagicLinkEmail
