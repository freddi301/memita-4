import { useLocales } from "expo-localization";

type SupportedLanguages = "en" | "it";

export function useTranslate() {
  const locales = useLocales();
  const translate = (labels: Record<SupportedLanguages, string>) => {
    const lang = locales.find(
      (locale) => locale.languageCode ?? "" in labels
    )?.languageCode;
    const label = labels[lang as SupportedLanguages] || labels["en"];
    return label;
  };
  return { translate };
}
