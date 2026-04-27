import { MedusaService } from "@medusajs/framework/utils"
import FanSubscriber from "./models/fan-subscriber"

class FanSubscribersModuleService extends MedusaService({
  FanSubscriber,
}) {}

export default FanSubscribersModuleService
