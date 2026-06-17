export const t = (key: string, locale: string = "pl") => ({
  en: { title: "WitaLine AI Reception" },
  pl: { title: "WitaLine – Recepcja AI" }
}[locale][key]);
