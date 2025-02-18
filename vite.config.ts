import { UserConfig } from "vite"
import teevi from "@teeviapp/vite"

export default {
  plugins: [
    teevi({
      name: "StreamingCommunity",
      capabilities: ["metadata"],
    }),
  ],
} satisfies UserConfig
