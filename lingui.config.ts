import { defineConfig } from "@lingui/conf";

export default defineConfig({
  locales: ["en"],
  sourceLocale: "en",
  catalogs: [{ path: "locales/{locale}/messages", include: ["./components"] }],
});
