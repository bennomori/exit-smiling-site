import Stripe from "stripe"

type StripeClient = InstanceType<typeof Stripe>

let stripeClient: StripeClient | null = null

export const POS_LOCATION_DISPLAY_NAME = "Exit Smiling POS"
export const POS_LOCATION_METADATA_KEY = "pos_mode"
export const POS_LOCATION_METADATA_VALUE = "ipad_terminal"

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient
  }

  const apiKey = process.env.STRIPE_API_KEY

  if (!apiKey) {
    throw new Error("STRIPE_API_KEY is not configured.")
  }

  stripeClient = new Stripe(apiKey)
  return stripeClient
}

export async function getOrCreatePosLocation() {
  const stripe = getStripeClient()
  const locations = await stripe.terminal.locations.list({ limit: 100 })

  const existingLocation = locations.data.find(
    (location) =>
      location.metadata?.[POS_LOCATION_METADATA_KEY] === POS_LOCATION_METADATA_VALUE ||
      location.display_name === POS_LOCATION_DISPLAY_NAME
  )

  if (existingLocation) {
    return existingLocation
  }

  return stripe.terminal.locations.create({
    display_name: POS_LOCATION_DISPLAY_NAME,
    metadata: {
      [POS_LOCATION_METADATA_KEY]: POS_LOCATION_METADATA_VALUE,
    },
    address: {
      country: "AU",
      line1: "Exit Smiling Merch Stand",
      city: "Batemans Bay",
      state: "NSW",
      postal_code: "2536",
    },
  })
}
