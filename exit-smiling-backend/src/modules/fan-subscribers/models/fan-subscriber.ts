import { model } from "@medusajs/framework/utils"

const FanSubscriber = model.define("fan_subscriber", {
  id: model.id().primaryKey(),
  email: model.text(),
  email_normalized: model.text(),
  consent_given: model.boolean(),
  consent_text_version: model.text(),
  source: model.text(),
  status: model.text(),
  consent_at: model.dateTime(),
  last_unlocked_at: model.dateTime().nullable(),
})

export default FanSubscriber
