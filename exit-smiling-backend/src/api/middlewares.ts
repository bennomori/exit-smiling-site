import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/media-admin/replace",
      methods: ["POST"],
      bodyParser: {
        sizeLimit: process.env.MEDIA_ADMIN_UPLOAD_BODY_LIMIT || "35mb",
      },
    },
  ],
})
