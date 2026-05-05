export const languagesDict = {
  en: "English",
  zh: "Chinese",
  es: "Spanish",
  hi: "Hindi",
  bn: "Bengali",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  vi: "Vietnamese",
  tr: "Turkish",
  mr: "Marathi",
  te: "Telugu",
  ko: "Korean",
  fr: "French",
  ta: "Tamil",
  ar: "Arabic",
  de: "German",
  ur: "Urdu",
  jv: "Javanese",
  it: "Italian",
  th: "Thai",
  gu: "Gujarati",
  ha: "Hausa",
  kn: "Kannada",
  fa: "Persian",
  pl: "Polish",
  id: "Indonesian",
  sw: "Swahili",
  // till here languages were ranked by number of speakers
  sk: "Slovak",
};

export const languages = Object.keys(languagesDict) as Array<
  keyof typeof languagesDict
>;
