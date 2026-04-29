import { getStripe } from "@/lib/stripe"
import Stripe from "stripe"

const stripe = getStripe()

/**
 * Lists the most recent customers and their subscriptions
 */
async function listCustomers(limit: number = 20) {
  const customers = await stripe.customers.list({ limit })

  console.log(`\nFound ${customers.data.length} customers:`)
  console.log("=========================================")

  for (const c of customers.data) {
    console.log(`Name: ${c.name || "N/A"}`)
    console.log(`Email: ${c.email}`)
    console.log(`ID: ${c.id}`)
    console.log(`Created: ${new Date(c.created * 1000).toISOString()}`)

    // Fetch subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: c.id,
      status: "all",
    })

    if (subscriptions.data.length === 0) {
      console.log(`Subscriptions: None`)
    } else {
      console.log(`Subscriptions (${subscriptions.data.length}):`)
      let subIndex = 1
      for (const sub of subscriptions.data) {
        console.log(`  [${subIndex++}] Subscription ID: ${sub.id}`)
        console.log(`      Status: ${sub.status}`)
        console.log(`      Status: ${JSON.stringify(sub)}`)
        console.log(`   Cancel at : ${sub.cancel_at}`)
        const currentPeriodEnd = (sub as any).current_period_end
        if (currentPeriodEnd) {
          console.log(
            `      Current Period End: ${new Date(currentPeriodEnd * 1000).toISOString()}`
          )
        }

        for (const item of sub.items.data) {
          const productId =
            typeof item.price.product === "string"
              ? item.price.product
              : (item.price.product as Stripe.Product).id

          const product = await stripe.products.retrieve(productId)
          console.log(
            `      Product: ${product.name} (${(item.price.unit_amount! / 100).toFixed(2)} ${item.price.currency.toUpperCase()}/${item.price.recurring?.interval})`
          )
        }
      }
    }
    console.log("=========================================")
  }
}

/**
 * Deletes all customers matching a specific email
 */
async function deleteCustomersByEmail(email: string) {
  if (!email) {
    console.log("No email provided for deletion.")
    return
  }

  console.log(`\nSearching for customers with email: ${email}...`)
  const customers = await stripe.customers.list({ email, limit: 100 })

  if (customers.data.length === 0) {
    console.log("No customers found with that email.")
    return
  }

  console.log(`Found ${customers.data.length} customers to remove.`)
  for (const customer of customers.data) {
    try {
      console.log(
        `Deleting customer: ${customer.id} (${customer.name || "No Name"})...`
      )
      await stripe.customers.del(customer.id)
      console.log(`Successfully deleted ${customer.id}`)
    } catch (error: any) {
      console.error(
        `Failed to delete customer ${customer.id}: ${error.message}`
      )
    }
  }
}

/**
 * Creates a test customer
 */
async function createTestCustomer(email: string, name: string) {
  try {
    console.log(`\nCreating test customer: ${name} (${email})...`)
    const customer = await stripe.customers.create({
      email,
      name,
      description: "Test customer created via script",
    })
    console.log(`Successfully created customer: ${customer.id}`)
    return customer
  } catch (error: any) {
    console.error(`Failed to create customer: ${error.message}`)
  }
}

/**
 * Creates a demo 25% discount coupon and promotion code
 */
async function createDemoCoupon() {
  const couponId = "SAVE20"
  const promoCodeText = "WELCOME20"

  console.log(
    `Creating premium demo coupon '${couponId}' and promotion code '${promoCodeText}'...`
  )

  try {
    // Delete existing coupon if it exists to allow re-running the script
    try {
      await stripe.coupons.del(couponId)
      console.log(`- Cleaned up existing coupon '${couponId}'`)
    } catch (e) {}

    const coupon = await stripe.coupons.create({
      id: couponId,
      percent_off: 20,
      duration: "once",
      name: "20% Off First Purchase",
      max_redemptions: 100,
      redeem_by: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    })
    console.log(`- Coupon created: ${coupon.id}`)

    const promoCode = await stripe.promotionCodes.create({
      promotion: {
        type: "coupon",
        coupon: coupon.id,
      },
      code: promoCodeText,
      active: true,
    } as any)
    console.log(`- Promotion code created: ${promoCode.id}`)

    console.log(`\nSuccess!`)
    console.log(`Code to use at checkout: ${promoCodeText}`)
  } catch (error: any) {
    console.error("\nError during creation:")
    console.error(`- Message: ${error.message}`)
    console.error(`- Param: ${error.param}`)
    console.error(`- Type: ${error.type}`)
  }
}

/**
 * Creates a custom discount coupon and promotion code
 */
async function createCustomCoupon(code: string, percent: number) {
  console.log(`\nCreating custom coupon '${code}' with ${percent}% off...`)

  try {
    // Delete existing coupon if it exists
    try {
      await stripe.coupons.del(code)
      console.log(`- Cleaned up existing coupon '${code}'`)
    } catch (e) {}

    const coupon = await stripe.coupons.create({
      id: code,
      percent_off: percent,
      duration: "once",
      name: `${percent}% Discount (${code})`,
      // duration: "repeating",
      // duration_in_months: 3,
    })

    const promoCode = await stripe.promotionCodes.create({
      promotion: {
        type: "coupon",
        coupon: coupon.id,
      },
      code: code,
      active: true,
    } as any)
    console.log(`- Promotion code created: ${promoCode.id}`)

    console.log(`\nSuccess!`)
    console.log(`Code to use at checkout: ${code}`)
  } catch (error: any) {
    console.error("\nError during creation:")
    console.error(`- Message: ${error.message}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || "list"
  const param1 = args[1]
  const param2 = args[2]

  switch (command) {
    case "list":
      await listCustomers()
      break
    case "delete":
      await deleteCustomersByEmail(param1)
      break
    case "create":
      await createTestCustomer(
        param1 || "test@example.com",
        param2 || "Test User"
      )
      break
    case "coupon":
      await createDemoCoupon()
      break
    case "custom-coupon":
      if (!param1 || !param2) {
        console.log("Usage: custom-coupon <code> <percentage>")
        return
      }
      await createCustomCoupon(param1, parseInt(param2))
      break
    default:
      console.log(
        "Unknown command. Use 'list', 'delete <email>', 'create <email> <name>', 'coupon', or 'custom-coupon <code> <percentage>'."
      )
  }
}

main().catch(console.error)

// npx tsx --env-file=.env scripts/test-stripe-customers.ts list
// npx tsx --env-file=.env scripts/test-stripe-customers.ts create admin@gmail.com "Test User"
// npx tsx --env-file=.env scripts/test-stripe-customers.ts delete admin@gmail.com
// npx tsx --env-file=.env scripts/test-stripe-customers.ts coupon
// npx tsx --env-file=.env scripts/test-stripe-customers.ts custom-coupon STAY50 50
