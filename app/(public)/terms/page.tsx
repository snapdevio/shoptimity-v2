import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Shoptimity",
  description:
    "Review the terms and conditions for using Shoptimity Shopify theme and our services.",
  alternates: {
    canonical: "https://shoptimity.com/terms",
  },
}
import { Separator } from "@/components/ui/separator"

export default function TermsPage() {
  return (
    <div className="bg-base-100 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 26, 2026
        </p>

        <Separator className="my-8" />

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold">
              1. Agreement to Terms
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              By accessing or using the Shoptimity platform
              (&quot;Service&quot;), you agree to be bound by these Terms and
              Conditions (&quot;Terms&quot;). If you do not agree to these
              Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              2. Description of Service
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Shoptimity provides a license management platform for Shopify
              theme developers and agencies. The Service allows users to
              purchase, manage, and assign theme licenses to specific Shopify
              store domains.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              3. License Terms
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Upon purchasing a plan, you are granted a limited, non-exclusive,
              non-transferable license to use the Shopify themes associated with
              your plan according to the following terms:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                Each license slot may be assigned to one Shopify store domain at
                a time.
              </li>
              <li>
                Licenses are valid for the duration of your active subscription,
                subject to the terms of your purchased plan.
              </li>
              <li>
                You may not sublicense, resell, or distribute the licensed
                themes to third parties.
              </li>
              <li>
                You may not reverse engineer, decompile, or attempt to extract
                the source code of the themes beyond what is provided.
              </li>
              <li>
                Domain reassignment is permitted within the limits of your plan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              4. Account Responsibilities
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              You are responsible for maintaining the confidentiality of your
              account access credentials and for all activities that occur under
              your account. You agree to notify us immediately of any
              unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              5. Payment and Billing
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                All prices are listed in US dollars unless otherwise stated.
              </li>
              <li>
                Payment is processed securely through Stripe. By making a
                purchase, you agree to Stripe&apos;s terms of service.
              </li>
              <li>
                Payments are made on a recurring subscription basis (monthly or
                yearly) for access to the Service and included features.
              </li>
              <li>
                You authorize us to charge your payment method for all fees
                incurred under your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              6. Refund Policy
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              All purchases made through the Shoptimity platform are final and
              non-refundable. We do not provide refunds for any products or
              services under any circumstances. For further details, please
              review our{" "}
              <Link
                href="/refund-policy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Refund Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              7. Usage Restrictions
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              You agree not to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Use the Service for any illegal or unauthorized purpose.</li>
              <li>Attempt to circumvent license verification mechanisms.</li>
              <li>
                Share, redistribute, or make licensed themes available to
                unauthorized parties.
              </li>
              <li>
                Use automated systems or bots to access the Service in a manner
                that could damage, disable, or impair the platform.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              8. Termination
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We reserve the right to suspend or terminate your account at any
              time if you violate these Terms. Upon termination, your right to
              use the Service will immediately cease, and any licenses
              associated with your account will be deactivated.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              9. Disclaimer of Warranties
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, either express or
              implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              10. Updates to the Terms
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will
              provide notice of significant changes by posting the updated Terms
              on this page. Your continued use of the Service after changes are
              posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              11. Governing Law
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which Shoptimity operates, without
              regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">12. Contact</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              If you have any questions about these Terms, please contact us
              through our live chat,{" "}
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
