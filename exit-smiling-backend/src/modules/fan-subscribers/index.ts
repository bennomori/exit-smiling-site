import { Module } from "@medusajs/framework/utils"
import FanSubscribersModuleService from "./service"

export const FAN_SUBSCRIBERS_MODULE = "fan_subscribers"

export default Module(FAN_SUBSCRIBERS_MODULE, {
  service: FanSubscribersModuleService,
})
