// Crew languages (2026-09-30, Fausto). Fixed list so the filter is reliable
// ("German" vs "Deutsch" vs "DE" can't split one language). Crew leaders pick
// one or more; the Crews filter only shows languages at least one listed crew
// uses. Codes = ISO 639-1; the DB check constraint (crews.languages) must list
// the same codes -- add a language in BOTH places.
export const crewLanguages: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ar: 'Arabic',
  bg: 'Bulgarian',
  zh: 'Chinese',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  et: 'Estonian',
  tl: 'Filipino',
  fi: 'Finnish',
  el: 'Greek',
  he: 'Hebrew',
  hi: 'Hindi',
  hu: 'Hungarian',
  id: 'Indonesian',
  ja: 'Japanese',
  ko: 'Korean',
  lv: 'Latvian',
  lt: 'Lithuanian',
  ms: 'Malay',
  no: 'Norwegian',
  fa: 'Persian',
  pl: 'Polish',
  ro: 'Romanian',
  ru: 'Russian',
  sr: 'Serbian',
  sk: 'Slovak',
  sl: 'Slovenian',
  sv: 'Swedish',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
};

/** Shown first (as plain checkboxes) in the crew editor; the rest sits behind "More languages". */
export const mainCrewLanguages = ['en', 'es', 'pt', 'fr', 'de', 'it'];

export const languageLabel = (code: string) => crewLanguages[code] ?? code;
