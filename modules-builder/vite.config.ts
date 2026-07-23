import { defineConfig } from "vite";

/** Dev-server config only. Production builds use scripts/build.mjs. */
export default defineConfig({
  root: ".",
  server: {
    port: 5174,
  },
});
