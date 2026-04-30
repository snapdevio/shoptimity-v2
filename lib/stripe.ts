import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
    _stripe = new Stripe(key)
  }
  return _stripe
}

export type ResolvedCouponDetails = {
  couponId: string
  percentOff: number | null
  amountOff: number | null
  durationType: "forever" | "once" | "repeating" | null
  durationInMonths: number | null
}

// Resolve a configured plan coupon code (promotion code OR raw coupon ID)
// to its actual terms in Stripe. Returns null when the code can't be found.
// Use this anywhere the UI promises a discount: the offer must reflect what
// Stripe will actually apply, not a stale value cached on the plan record.
export async function resolveCouponDetails(
  stripe: Stripe,
  couponCode: string | null | undefined
): Promise<ResolvedCouponDetails | null> {
  if (!couponCode) return null
  const code = couponCode.trim()
  if (!code) return null

  let coupon: Stripe.Coupon | null = null

  try {
    const promos = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.coupon"],
    })
    const promo = promos.data[0] as any
    if (promo) {
      const promoCoupon = promo.coupon as Stripe.Coupon | undefined
      if (promoCoupon && !(promoCoupon as any).deleted) {
        coupon = promoCoupon
      }
    }
  } catch (err) {
    console.error("[resolveCouponDetails] promotionCodes.list failed:", err)
  }

  if (!coupon) {
    try {
      const direct = await stripe.coupons.retrieve(code)
      if (direct && !(direct as any).deleted) coupon = direct
    } catch (err) {
      console.error("[resolveCouponDetails] coupons.retrieve failed:", err)
    }
  }

  if (!coupon) return null

  return {
    couponId: coupon.id,
    percentOff: coupon.percent_off ?? null,
    amountOff: coupon.amount_off ?? null,
    durationType:
      (coupon.duration as ResolvedCouponDetails["durationType"]) ?? null,
    durationInMonths: coupon.duration_in_months ?? null,
  }
}
