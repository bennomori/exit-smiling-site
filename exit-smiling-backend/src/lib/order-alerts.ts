import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type OrderAlertOptions = {
  source?: string
  force?: boolean
}

function getOrderAlertEmails() {
  return String(process.env.ORDER_ALERT_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}

function formatCurrency(amount: unknown, currencyCode = "AUD") {
  const value = Number(amount || 0)

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: String(currencyCode || "AUD").toUpperCase(),
  }).format(Number.isFinite(value) ? value : 0)
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function getPublicAssetBaseUrl() {
  return String(process.env.ORDER_ALERT_PUBLIC_ASSET_BASE_URL || process.env.STORE_PUBLIC_URL || "")
    .trim()
    .replace(/\/+$/, "")
}

function normalizeImageUrl(url: unknown) {
  const value = String(url || "").trim()

  if (!value) return ""
  if (/^https?:\/\//i.test(value)) return value

  const publicBaseUrl = getPublicAssetBaseUrl()

  if (publicBaseUrl && value.startsWith("/")) {
    return `${publicBaseUrl}${value}`
  }

  return ""
}

function getAddressLines(order: any) {
  const address = order?.shipping_address || order?.metadata?.delivery_address || {}
  const name = [address?.first_name, address?.last_name].filter(Boolean).join(" ").trim()
  const lineOne = [address?.address_1, address?.address_2].filter(Boolean).join(", ").trim()
  const lineTwo = [address?.city, address?.province, address?.postal_code]
    .filter(Boolean)
    .join(", ")
    .trim()
  const country = String(address?.country_code || "").trim().toUpperCase()
  const phone = String(address?.phone || "").trim()

  return [name, lineOne, lineTwo, country, phone ? `Phone: ${phone}` : ""].filter(Boolean)
}

function getItemQuantity(item: any) {
  return Number(item?.detail?.quantity || item?.quantity || 0)
}

function getItemVariantLabel(item: any) {
  return String(item?.variant_title || item?.metadata?.variant_title || "").trim()
}

function getItemVariantId(item: any) {
  return String(item?.variant_id || item?.variant?.id || item?.metadata?.variant_id || "").trim()
}

function getItemImageUrl(item: any) {
  return normalizeImageUrl(item?.thumbnail || item?.metadata?.thumbnail)
}

function getShippingMethodLines(order: any) {
  const methods = order?.shipping_methods || []

  if (!methods.length) {
    return []
  }

  return methods.map((method: any) => {
    const name = String(
      method?.name ||
        method?.shipping_option?.name ||
        method?.shipping_option?.type?.label ||
        method?.shipping_option_id ||
        "Shipping"
    )
      .replace(/\s*-\s*(light merch|bulky merch|default shipping profile)\s*$/i, "")
      .trim()

    const amount = method?.amount != null ? ` - ${formatCurrency(method.amount, order?.currency_code)}` : ""

    return `${name}${amount}`
  })
}

function getNumber(value: unknown) {
  const numberValue = Number(value || 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function getItemTotal(item: any) {
  const directTotal =
    getNumber(item?.total) ||
    getNumber(item?.item_total) ||
    getNumber(item?.subtotal) - getNumber(item?.discount_total)

  if (directTotal > 0) {
    return directTotal
  }

  return getNumber(item?.unit_price || item?.detail?.unit_price) * getItemQuantity(item)
}

function getShippingTotal(order: any) {
  return (order?.shipping_methods || []).reduce(
    (sum: number, method: any) => sum + (getNumber(method?.total) || getNumber(method?.amount)),
    0
  )
}

function getOrderTotal(order: any) {
  const summaryTotal =
    getNumber(order?.summary?.current_order_total) ||
    getNumber(order?.summary?.totals?.current_order_total) ||
    getNumber(order?.summary?.paid_total) ||
    getNumber(order?.summary?.totals?.paid_total) ||
    getNumber(order?.summary?.transaction_total) ||
    getNumber(order?.summary?.totals?.transaction_total) ||
    getNumber(order?.summary?.original_order_total) ||
    getNumber(order?.summary?.totals?.original_order_total)

  const derivedTotal =
    (order?.items || []).reduce((sum: number, item: any) => sum + getItemTotal(item), 0) +
    getShippingTotal(order)

  const collected = (order?.payment_collections || []).reduce(
    (sum: number, collection: any) => sum + getNumber(collection?.amount),
    0
  )

  return summaryTotal || getNumber(order?.total) || derivedTotal || collected
}

function getVariantAvailableQuantity(variant: any) {
  let total = 0
  let foundLevel = false

  for (const link of variant?.inventory_items || []) {
    const requiredQuantity = Math.max(1, Number(link?.required_quantity || 1))

    for (const level of link?.inventory?.location_levels || []) {
      foundLevel = true
      const stocked = Number(level?.stocked_quantity || 0)
      const reserved = Number(level?.reserved_quantity || 0)
      total += Math.floor((stocked - reserved) / requiredQuantity)
    }
  }

  return foundLevel ? total : null
}

function getItemInventoryStatus(item: any, variantsById: Map<string, any>) {
  const variantId = getItemVariantId(item)
  const variant = variantId ? variantsById.get(variantId) : null

  if (!variant) {
    return "Inventory: unable to check"
  }

  if (!variant.manage_inventory) {
    return "Inventory: not tracked"
  }

  const available = getVariantAvailableQuantity(variant)

  if (available == null) {
    return variant.allow_backorder
      ? "Inventory: print on demand / custom print required"
      : "Inventory: unavailable"
  }

  if (available <= 0) {
    return variant.allow_backorder
      ? "Inventory: 0 available - print on demand / custom print required"
      : "Inventory: 0 available - urgent stock check required"
  }

  return `Inventory: ${available} available after this order`
}

function buildOrderAlertBodies(order: any, variantsById: Map<string, any>, source?: string) {
  const orderLabel = order?.display_id ? `#${order.display_id}` : order?.id
  const sourceLabel =
    source ||
    (order?.metadata?.pos_mode === "ipad_terminal"
      ? `POS ${order?.metadata?.pos_payment_method || "card"}`
      : "Website")
  const total = formatCurrency(getOrderTotal(order), order?.currency_code)
  const addressLines = getAddressLines(order)
  const shippingMethodLines = getShippingMethodLines(order)
  const items = order?.items || []

  const textLines = [
    `New Exit Smiling order ${orderLabel}`,
    `Source: ${sourceLabel}`,
    `Order ID: ${order?.id}`,
    `Customer email: ${order?.email || "No email"}`,
    `Payment status: ${order?.payment_status || "n/a"}`,
    `Total: ${total}`,
    `Shipping method: ${shippingMethodLines.length ? shippingMethodLines.join(" | ") : "No shipping method found"}`,
    "",
    "Items:",
    ...(items.length
      ? items.map((item: any) => {
          const variant = getItemVariantLabel(item)
          const variantText = variant ? ` (${variant})` : ""
          const inventoryStatus = getItemInventoryStatus(item, variantsById)
          return `- ${getItemQuantity(item)} x ${item?.title || "Item"}${variantText} - ${inventoryStatus}`
        })
      : ["- No line items found"]),
    "",
    "Shipping / delivery:",
    ...(addressLines.length ? addressLines : ["No shipping address found"]),
  ]

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">New Exit Smiling order ${escapeHtml(orderLabel)}</h2>
      <p><strong>Source:</strong> ${escapeHtml(sourceLabel)}</p>
      <p><strong>Order ID:</strong> ${escapeHtml(order?.id)}</p>
      <p><strong>Customer email:</strong> ${escapeHtml(order?.email || "No email")}</p>
      <p><strong>Payment status:</strong> ${escapeHtml(order?.payment_status || "n/a")}</p>
      <p><strong>Total:</strong> ${escapeHtml(total)}</p>
      <h3>Items</h3>
      <ul>
        ${
          items.length
            ? items
                .map((item: any) => {
                  const variant = getItemVariantLabel(item)
                  const inventoryStatus = getItemInventoryStatus(item, variantsById)
                  const imageUrl = getItemImageUrl(item)
                  return `<li style="margin-bottom: 14px; display: flex; gap: 12px; align-items: flex-start;">${
                    imageUrl
                      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(
                          item?.title || "Item"
                        )}" width="72" height="72" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #ddd;" />`
                      : ""
                  }<div>${escapeHtml(getItemQuantity(item))} x ${escapeHtml(
                    item?.title || "Item"
                  )}${variant ? ` (${escapeHtml(variant)})` : ""}<br /><strong>${escapeHtml(
                    inventoryStatus
                  )}</strong></div></li>`
                })
                .join("")
            : "<li>No line items found</li>"
        }
      </ul>
      <h3>Shipping method</h3>
      <p>${escapeHtml(shippingMethodLines.length ? shippingMethodLines.join(" | ") : "No shipping method found")}</p>
      <h3>Shipping / delivery</h3>
      ${
        addressLines.length
          ? `<p>${addressLines.map(escapeHtml).join("<br />")}</p>`
          : "<p>No shipping address found</p>"
      }
    </div>
  `

  return {
    subject: `Exit Smiling order ${orderLabel} - ${total}`,
    text: textLines.join("\n"),
    html,
  }
}

export async function sendOrderAlert(container: any, orderId: string, options: OrderAlertOptions = {}) {
  const postmarkToken = String(process.env.POSTMARK_SERVER_TOKEN || "").trim()
  const fromEmail = String(process.env.ORDER_ALERT_FROM_EMAIL || "").trim()
  const recipients = getOrderAlertEmails()

  if (!postmarkToken || !fromEmail || !recipients.length || !orderId) {
    return {
      skipped: true,
      reason: "missing_order_alert_config",
    }
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderService = container.resolve(Modules.ORDER)
  const orderFilters = orderId.startsWith("order_")
    ? { id: orderId }
    : { display_id: Number(orderId) }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "summary.current_order_total",
      "summary.paid_total",
      "summary.transaction_total",
      "summary.original_order_total",
      "payment_status",
      "metadata",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.country_code",
      "shipping_address.phone",
      "shipping_methods.name",
      "shipping_methods.amount",
      "shipping_methods.total",
      "items.title",
      "items.thumbnail",
      "items.variant_id",
      "items.variant_title",
      "items.quantity",
      "items.detail.quantity",
      "items.detail.unit_price",
      "items.unit_price",
      "items.subtotal",
      "items.discount_total",
      "items.item_total",
      "items.total",
      "items.metadata",
      "payment_collections.amount",
    ],
    filters: orderFilters,
    pagination: {
      take: 1,
    },
  })

  const order = orders?.[0]

  if (!order?.id) {
    return {
      skipped: true,
      reason: "order_not_found",
    }
  }

  if (order?.metadata?.order_alert_sent_at && !options.force) {
    return {
      skipped: true,
      reason: "already_sent",
    }
  }

  const variantIds = Array.from(
    new Set((order.items || []).map((item: any) => getItemVariantId(item)).filter(Boolean))
  )
  let variantsById = new Map<string, any>()

  if (variantIds.length) {
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "manage_inventory",
        "allow_backorder",
        "inventory_items.required_quantity",
        "inventory_items.inventory.location_levels.stocked_quantity",
        "inventory_items.inventory.location_levels.reserved_quantity",
      ],
      filters: {
        id: variantIds,
      },
      pagination: {
        take: variantIds.length,
      },
    })

    variantsById = new Map((variants || []).map((variant: any) => [variant.id, variant]))
  }

  const bodies = buildOrderAlertBodies(order, variantsById, options.source)

  await Promise.all(
    recipients.map(async (recipient) => {
      const response = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": postmarkToken,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: fromEmail,
          To: recipient,
          Subject: bodies.subject,
          TextBody: bodies.text,
          HtmlBody: bodies.html,
          MessageStream: "outbound",
        }),
      })

      if (!response.ok) {
        throw new Error(`Postmark order alert failed: ${await response.text()}`)
      }
    })
  )

  await orderService.updateOrders(order.id, {
    metadata: {
      ...(order.metadata || {}),
      order_alert_sent_at: new Date().toISOString(),
      order_alert_recipients: recipients,
    },
  })

  return {
    skipped: false,
    sent: true,
    recipients,
  }
}
