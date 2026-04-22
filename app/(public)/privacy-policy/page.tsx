import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | Shoptimity",
  description:
    "Read Shoptimity's privacy policy to understand how we collect, use, and protect your personal information.",
  alternates: {
    canonical: "https://shoptimity.com/privacy-policy",
  },
}
import { Separator } from "@/components/ui/separator"

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-base-100 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 26, 2026
        </p>

        <Separator className="my-8" />

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold">
              1. Introduction
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Shoptimity (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              operates the Shoptimity platform, a software-as-a-service
              application for Shopify theme license management. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              2. Information We Collect
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We collect information you provide directly to us, including:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Account Information:
                </strong>{" "}
                Name and email address when you create an account or make a
                purchase.
              </li>
              <li>
                <strong className="text-foreground">
                  Payment Information:
                </strong>{" "}
                Payment details are processed securely through Stripe. We do not
                store your credit card numbers on our servers.
              </li>
              <li>
                <strong className="text-foreground">Domain Information:</strong>{" "}
                Shopify store domain names that you associate with your
                licenses.
              </li>
              <li>
                <strong className="text-foreground">Usage Data:</strong>{" "}
                Information about how you interact with our platform, including
                pages visited, features used, and actions taken.
              </li>
              <li>
                <strong className="text-foreground">Communication Data:</strong>{" "}
                Messages and inquiries you send through our{" "}
                <Link
                  href="/contact"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  contact form
                </Link>{" "}
                or{" "}
                <a
                  href="mailto:support@shoptimity.com"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  email
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              3. How We Use Your Information
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Provide, maintain, and improve our services.</li>
              <li>Process transactions and send related notifications.</li>
              <li>Manage license activations and domain verifications.</li>
              <li>
                Respond to your comments, questions, and support requests.
              </li>
              <li>
                Send you technical notices, updates, security alerts, and
                administrative messages.
              </li>
              <li>
                Detect, investigate, and prevent fraudulent transactions and
                unauthorized access.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              4. Information Sharing
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We do not sell your personal information. We may share your
              information in the following circumstances:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">Service Providers:</strong>{" "}
                With third-party vendors who perform services on our behalf,
                such as payment processing (Stripe), email delivery, and
                hosting.
              </li>
              <li>
                <strong className="text-foreground">Legal Requirements:</strong>{" "}
                When required by law, regulation, or legal process, or to
                protect the rights, property, or safety of Shoptimity, our
                users, or others.
              </li>
              <li>
                <strong className="text-foreground">Business Transfers:</strong>{" "}
                In connection with a merger, acquisition, or sale of all or a
                portion of our assets.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              5. Data Security
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We implement appropriate technical and organizational security
              measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction. However, no method
              of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              6. Data Retention
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We retain your personal information for as long as your account is
              active or as needed to provide you services. We may also retain
              and use your information to comply with legal obligations, resolve
              disputes, and enforce our agreements.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              7. Your Rights
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Depending on your location, you may have the right to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Access, correct, or delete your personal information.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Request data portability.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              To exercise any of these rights, please contact us at the email
              address provided in the Contact section.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">8. Cookies</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We use essential cookies to maintain your session and preferences.
              We do not use third-party advertising cookies. By using our
              platform, you consent to the use of essential cookies necessary
              for the operation of our services.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              9. Changes to This Policy
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the &quot;Last updated&quot; date. Your
              continued use of the platform after any changes constitutes your
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              10. Contact Us
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              If you have any questions about this Privacy Policy, please
              contact us through our live chat,{" "}
              <Link
                href="/contact"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                contact page
              </Link>{" "}
              or email us at{" "}
              <a
                href="mailto:support@shoptimity.com"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                support@shoptimity.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
