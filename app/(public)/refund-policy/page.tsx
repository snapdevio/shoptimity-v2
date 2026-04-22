import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Refund Policy | Shoptimity",
  description:
    "Learn about Shoptimity's refund policy and our commitment to customer satisfaction.",
  alternates: {
    canonical: "https://shoptimity.com/refund-policy",
  },
}
import { Separator } from "@/components/ui/separator"

export default function RefundPolicyPage() {
  return (
    <div className="bg-base-100 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Refund Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: April 2, 2026
        </p>

        <Separator className="my-8" />

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold">
              1. No Refund Policy
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              All purchases made through the Shoptimity platform are final and
              non-refundable. By completing a purchase, you acknowledge and
              agree that no refunds will be issued under any circumstances,
              including but not limited to dissatisfaction with the product,
              change of mind, or failure to use the purchased license(s).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              2. Pre-Purchase Evaluation
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We encourage all prospective buyers to thoroughly evaluate our
              offerings before making a purchase. The following resources are
              available to help you make an informed decision:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Product Descriptions:
                </strong>{" "}
                Detailed information about each plan, including features, domain
                slots, and pricing, is available on our pricing page.
              </li>
              <li>
                <strong className="text-foreground">Theme Previews:</strong>{" "}
                Live demos and previews of our Shopify themes are available so
                you can assess compatibility with your store before purchasing.
              </li>
              <li>
                <strong className="text-foreground">Customer Support:</strong>{" "}
                Our support team is available to answer any questions or address
                concerns prior to purchase.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              3. Digital Product Nature
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Shoptimity provides digital products in the form of software
              licenses for Shopify themes. Due to the nature of digital goods,
              once a license key is issued and access to the product is granted,
              the transaction is considered complete. Digital products cannot be
              &quot;returned&quot; in the traditional sense, and as such, all
              sales are final.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              4. Chargebacks and Disputes
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Filing a chargeback or payment dispute with your bank or payment
              provider in violation of this Refund Policy may result in
              immediate termination of your account and revocation of all
              associated licenses. We reserve the right to pursue any available
              legal remedies in such cases.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              5. Exceptions
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              In the event of a technical billing error caused by our system,
              such as a duplicate charge, we will work with you to correct the
              error. Such corrections are limited to verifiable technical errors
              and do not constitute a refund of the product itself. To report a
              billing error, please contact us promptly with your order details.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              6. Updates to the Refund Policy
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              We reserve the right to update or modify this Refund Policy at any
              time without prior notice. Changes will be effective immediately
              upon posting to this page. Your continued use of the Service after
              any modifications constitutes your acceptance of the revised
              policy. We encourage you to review this page periodically for
              updates.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold">
              7. Contact Us
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              If you have any questions about this Refund Policy or believe you
              have been charged in error, please contact us through our live
              chat,{" "}
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
