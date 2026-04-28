import { defineConfig } from "@lingui/conf";
import { languages } from "./components/store/languages";

export default defineConfig({
  locales: languages,
  sourceLocale: "en",
  catalogs: [{ path: "locales/{locale}/messages", include: ["./components"] }],
});
