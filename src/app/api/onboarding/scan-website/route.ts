import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { url, businessName, industry, templatePrompt } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WitaLineBot/1.0; +https://witaline.pl)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pl-PL,pl;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    const html = await res.text();

    // === META TAGS ===
    const meta = extractMetaTags(html);

    // === STRUCTURED DATA (JSON-LD) ===
    const structured = extractJsonLd(html);

    // === SOCIAL MEDIA ===
    const social = extractSocialLinks(html);

    // === CONTACT INFO ===
    const contact = extractContact(html);

    // === OPENING HOURS ===
    const hours = extractHours(html);

    // === PRICES ===
    const prices = extractPrices(html);

    // === SERVICES ===
    const services = extractServices(html);

    // === TEAM ===
    const team = extractTeam(html);

    // === REVIEWS ===
    const reviews = extractReviews(html);

    // === IMAGES ===
    const images = extractImages(html);

    // === NAV SECTIONS ===
    const navSections = extractNavSections(html);

    // === CLEAN TEXT (for description) ===
    const text = cleanHtml(html);

    if (text.length < 50) {
      return NextResponse.json({ error: "Could not extract content from URL" }, { status: 422 });
    }

    // Build knowledge object
    const knowledge = {
      businessName,
      industry,
      extractedUrl: url,
      meta,
      structured,
      social,
      contact,
      hours,
      prices,
      services,
      team,
      reviews,
      images,
      navSections,
      description: meta.description || text.slice(0, 600),
      fullText: text.slice(0, 12000),
    };

    const appendix = buildAppendix(knowledge);
    const systemPrompt = templatePrompt
      ? `${templatePrompt}\n\n## Informacje pobrane ze strony internetowej\n${appendix}`
      : generatePrompt(knowledge);

    return NextResponse.json({
      knowledge,
      systemPrompt,
      preview: text.slice(0, 1500),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Could not fetch URL: ${msg}` }, { status: 422 });
  }
}

// ─── EXTRACTION HELPERS ───────────────────────────────────────

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) meta.title = decodeEntities(titleMatch[1].trim());

  // Standard meta tags
  const metaPatterns: [string, string][] = [
    ["description", 'name="description"'],
    ["keywords", 'name="keywords"'],
    ["author", 'name="author"'],
    ["og:title", 'property="og:title"'],
    ["og:description", 'property="og:description"'],
    ["og:image", 'property="og:image"'],
    ["og:url", 'property="og:url"'],
    ["og:type", 'property="og:type"'],
    ["og:site_name", 'property="og:site_name"'],
    ["twitter:title", 'name="twitter:title"'],
    ["twitter:description", 'name="twitter:description"'],
    ["twitter:image", 'name="twitter:image"'],
  ];

  for (const [key, attr] of metaPatterns) {
    const re = new RegExp(`<meta[^>]*${attr}[^>]*content="([^"]*)"`, "i");
    const m = html.match(re);
    if (m) meta[key] = decodeEntities(m[1].trim());
  }

  return meta;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      if (data["@type"]) results.push(data);
    } catch { /* skip invalid JSON-LD */ }
  }
  return results;
}

function extractSocialLinks(html: string): string[] {
  const patterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?twitter\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?x\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?pinterest\.[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?tripadvisor\.[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?opiniagугл\.[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?maps\.google\.[^\s"'<>]+/gi,
  ];

  const links = new Set<string>();
  for (const p of patterns) {
    const matches = html.match(p);
    if (matches) matches.forEach(l => links.add(l.split(/["'<>\s]/)[0]));
  }
  return [...links];
}

function extractContact(html: string): {
  phones: string[];
  emails: string[];
  addresses: string[];
} {
  const text = cleanHtml(html);

  // Phones (Polish formats)
  const phonePatterns = [
    /(?:\+48\s?)?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g,
    /(?:\+48\s?)?12[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g,
    /\d{3}[\s-]\d{3}[\s-]\d{3}/g,
  ];
  const phones = new Set<string>();
  for (const p of phonePatterns) {
    const m = text.match(p);
    if (m) m.forEach(ph => {
      const cleaned = ph.replace(/\s/g, "");
      if (cleaned.length >= 9) phones.add(ph.trim());
    });
  }

  // Emails
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = (text.match(emailRe) || []) as string[];
  const emails = [...new Set(emailMatches.filter(e => !e.endsWith(".png") && !e.endsWith(".jpg")))];

  // Addresses (Polish patterns)
  const addressPatterns = [
    /ul\.\s*[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s*\d{1,5}[a-zA-Z]?(?:\/\d{1,3})?/gi,
    /al\.\s*[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s*\d{1,5}/gi,
    /pl\.\s*[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s*\d{1,5}/gi,
    /os\.\s*[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s*\d{1,5}/gi,
  ];
  const addresses = new Set<string>();
  for (const p of addressPatterns) {
    const m = html.match(p);
    if (m) m.forEach(a => addresses.add(a.trim()));
  }

  return {
    phones: [...phones].slice(0, 5),
    emails: [...emails].slice(0, 5),
    addresses: [...addresses].slice(0, 3),
  };
}

function extractHours(html: string): Record<string, string> | string | null {
  // Try schema.org openingHours first
  const ldBlocks = extractJsonLd(html);
  for (const block of ldBlocks) {
    const hours = block.openingHours || block.openingHoursSpecification;
    if (hours && typeof hours === "string") {
      return { schema: hours };
    }
    if (Array.isArray(hours)) {
      const parsed: Record<string, string> = {};
      for (const spec of hours) {
        if (spec.dayOfWeek && spec.opens && spec.closes) {
          const day = Array.isArray(spec.dayOfWeek) ? spec.dayOfWeek[0] : spec.dayOfWeek;
          parsed[day] = `${spec.opens}-${spec.closes}`;
        }
      }
      if (Object.keys(parsed).length) return parsed;
    }
  }

  // Try regex on text
  const text = cleanHtml(html);
  const dayMap: Record<string, string> = {
    poniedziałek: "Pn", pt: "Pt", pon: "Pn",
    wtorek: "Wt", wt: "Wt",
    środa: "Śr", sr: "Śr",
    czwartek: "Cz", czw: "Cz",
    piątek: "Pt",
    sobota: "Sb", sob: "Sb",
    niedziela: "Nd", ndz: "Nd",
  };

  const hoursRe = /(poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela|pn|wt|śr|cz|pt|sb|nd|ndz|pon|czw|sob|ndz)[\s:.-]*(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})/gi;
  const found: Record<string, string> = {};
  let m;
  while ((m = hoursRe.exec(text)) !== null) {
    const key = dayMap[m[1].toLowerCase()] || m[1];
    found[`${key}:`] = `${m[2]}-${m[3]}`;
  }
  if (Object.keys(found).length) return found;

  // Try generic "godziny otwarcia" section
  const godzMatch = text.match(/godziny\s*otwarcia[:\s]*(.{10,200})/i);
  if (godzMatch) return { raw: godzMatch[1].trim() };

  return null;
}

function extractPrices(html: string): { item: string; price: string }[] {
  const text = cleanHtml(html);
  const prices: { item: string; price: string }[] = [];

  // Pattern: "Nazwa usługi ... XX zł" or "od XX zł"
  const priceRe = /([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]{3,40})\s*[:\s—\-]*\s*(?:od\s+)?(\d{1,5}(?:[.,]\d{2})?)\s*(?:zł|PLN)/gi;
  let m;
  while ((m = priceRe.exec(text)) !== null) {
    const item = m[1].trim().replace(/\s+/g, " ");
    if (item.length > 2 && item.length < 50) {
      prices.push({ item, price: `${m[2]} zł` });
    }
  }

  // Also look for "cennik" sections
  const cennikMatch = text.match(/cennik[:\s]*(.{50,500})/i);
  if (cennikMatch && prices.length === 0) {
    const chunk = cennikMatch[1];
    const innerPrices = chunk.match(/(\d{1,5}(?:[.,]\d{2})?)\s*(?:zł|PLN)/g);
    if (innerPrices) {
      prices.push({ item: "Cennik (z tekstu)", price: innerPrices.join(", ") });
    }
  }

  return prices.slice(0, 20);
}

function extractServices(html: string): string[] {
  const text = cleanHtml(html);
  const services = new Set<string>();

  // Look for service-like patterns near keywords
  const serviceKeywords = /(?:usługi|oferta|zakres|specjalizacje|co\s+oferujemy|nasza\s+oferta)[:\s]*([\s\S]{20,800}?)(?:\n\n|kontakt|telefon|adres|mapa|stopka)/i;
  const sectionMatch = text.match(serviceKeywords);
  if (sectionMatch) {
    const lines = sectionMatch[1].split(/[.\n]/).filter(l => l.trim().length > 3 && l.trim().length < 80);
    lines.forEach(l => services.add(l.trim()));
  }

  // Look for list items with service-like names
  const listRe = /[•\-\*]\s*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż\s]{5,60})/g;
  let m;
  while ((m = listRe.exec(text)) !== null) {
    const s = m[1].trim();
    if (s.length > 5 && s.length < 70 && !s.match(/^\d/)) {
      services.add(s);
    }
  }

  return [...services].slice(0, 15);
}

function extractTeam(html: string): { name: string; role?: string }[] {
  const text = cleanHtml(html);
  const team: { name: string; role?: string }[] = [];

  // Look for team section
  const teamRe = /(?:zespół|pracownicy|kadra|o\s+nas|team)[:\s]*([\s\S]{20,600}?)(?:\n\n|kontakt|stopka)/i;
  const teamMatch = text.match(teamRe);
  if (teamMatch) {
    // Look for name-role patterns
    const nameRoleRe = /([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)[\s,:\-]*(?:specjalista|lekarz|dietetyk|trener|manager|dyrektor|właściciel|asystent|recepcjonistka|fryzjer|stylistka|kosmetyczka|fotograf|prawnik|adwokat|radca|architekt|inżynier|technik)/gi;
    let m;
    while ((m = nameRoleRe.exec(teamMatch[1])) !== null) {
      team.push({ name: m[1].trim() });
    }
  }

  return team.slice(0, 10);
}

function extractReviews(html: string): { text: string; rating?: number }[] {
  const text = cleanHtml(html);
  const reviews: { text: string; rating?: number }[] = [];

  // Schema.org reviews
  const ldBlocks = extractJsonLd(html);
  for (const block of ldBlocks) {
    if (block.review) {
      const rArray = Array.isArray(block.review) ? block.review : [block.review];
      for (const r of rArray) {
        if (r.reviewBody || r.description) {
          reviews.push({
            text: String(r.reviewBody || r.description).slice(0, 300),
            rating: r.reviewRating?.ratingValue,
          });
        }
      }
    }
  }

  // Regex on text for review patterns
  if (reviews.length === 0) {
    const reviewRe = /(?:opinia|recenzja|review|referencje)[:\s]*(.{20,300}?)(?:\n|$)/gi;
    let m;
    while ((m = reviewRe.exec(text)) !== null) {
      const t = m[1].trim();
      if (t.length > 15) reviews.push({ text: t.slice(0, 300) });
    }
  }

  return reviews.slice(0, 5);
}

function extractImages(html: string): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = [];
  const imgRe = /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi;
  let m;
  while ((m = imgRe.exec(html)) !== null) {
    const src = m[1];
    const alt = m[2] || "";
    if (src && !src.includes("data:") && !src.includes("pixel") && !src.includes("track")) {
      images.push({ src, alt });
    }
  }
  return images.slice(0, 20);
}

function extractNavSections(html: string): string[] {
  const sections = new Set<string>();

  // Extract from nav links
  const navRe = /<nav[\s\S]*?<\/nav>/gi;
  const navMatch = html.match(navRe);
  if (navMatch) {
    const linkRe = /<a[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRe.exec(navMatch[0])) !== null) {
      const text = m[1].replace(/<[^>]+>/g, "").trim();
      if (text.length > 1 && text.length < 50) sections.add(text);
    }
  }

  return [...sections].slice(0, 15);
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// ─── PROMPT & APPENDIX BUILDERS ──────────────────────────────

function buildAppendix(k: Record<string, unknown>): string {
  const parts: string[] = [];

  const meta = k.meta as Record<string, string> | undefined;
  if (meta?.title) parts.push(`Tytuł strony: ${meta.title}`);
  if (meta?.description) parts.push(`Opis meta: ${meta.description}`);
  if (meta?.["og:description"]) parts.push(`Opis OG: ${meta["og:description"]}`);

  const structured = k.structured as Record<string, unknown>[] | undefined;
  if (structured?.length) {
    for (const s of structured) {
      if (s["@type"]) parts.push(`Typ strukturalny: ${s["@type"]}`);
      if (s.telephone) parts.push(`Tel (schema): ${s.telephone}`);
      if (s.email) parts.push(`Email (schema): ${s.email}`);
      if (s.address) {
        const a = s.address as Record<string, string>;
        parts.push(`Adres (schema): ${[a.streetAddress, a.addressLocality, a.postalCode].filter(Boolean).join(", ")}`);
      }
    }
  }

  const contact = k.contact as { phones: string[]; emails: string[]; addresses: string[] } | undefined;
  if (contact?.phones?.length) parts.push(`Telefon: ${contact.phones.join(", ")}`);
  if (contact?.emails?.length) parts.push(`Email: ${contact.emails.join(", ")}`);
  if (contact?.addresses?.length) parts.push(`Adres: ${contact.addresses.join(", ")}`);

  const hours = k.hours;
  if (hours) {
    if (typeof hours === "string") parts.push(`Godziny: ${hours}`);
    else if (typeof hours === "object" && !Array.isArray(hours)) {
      const h = hours as Record<string, string>;
      if (h.schema) parts.push(`Godziny: ${h.schema}`);
      else if (h.raw) parts.push(`Godziny: ${h.raw}`);
      else {
        const entries = Object.entries(h).map(([k, v]) => `  ${k} ${v}`).join("\n");
        parts.push(`Godziny:\n${entries}`);
      }
    }
  }

  const prices = k.prices as { item: string; price: string }[] | undefined;
  if (prices?.length) {
    parts.push("Cennik:");
    for (const p of prices) parts.push(`  ${p.item}: ${p.price}`);
  }

  const services = k.services as string[] | undefined;
  if (services?.length) parts.push(`Usługi: ${services.join(", ")}`);

  const social = k.social as string[] | undefined;
  if (social?.length) parts.push(`Social media:\n${social.map(s => `  ${s}`).join("\n")}`);

  const team = k.team as { name: string; role?: string }[] | undefined;
  if (team?.length) parts.push(`Zespół: ${team.map(t => t.name).join(", ")}`);

  const reviews = k.reviews as { text: string; rating?: number }[] | undefined;
  if (reviews?.length) {
    parts.push("Opinie klientów:");
    for (const r of reviews) parts.push(`  "${r.text.slice(0, 150)}"`);
  }

  const desc = String(k.description || "");
  if (desc) parts.push(`Opis firmy: ${desc.slice(0, 500)}`);

  return parts.length ? parts.join("\n") : "Brak dodatkowych informacji ze strony.";
}

function generatePrompt(k: Record<string, unknown>): string {
  const b = String(k.businessName || "Firma");
  const ind = String(k.industry || "usługowej");

  const meta = k.meta as Record<string, string> | undefined;
  const contact = k.contact as { phones: string[]; emails: string[]; addresses: string[] } | undefined;
  const hours = k.hours;
  const prices = k.prices as { item: string; price: string }[] | undefined;
  const services = k.services as string[] | undefined;

  let hoursStr = "standardowe godziny pracy";
  if (hours) {
    if (typeof hours === "string") hoursStr = hours;
    else if (typeof hours === "object" && !Array.isArray(hours)) {
      const h = hours as Record<string, string>;
      if (h.schema) hoursStr = h.schema;
      else if (h.raw) hoursStr = h.raw;
      else hoursStr = Object.entries(h).map(([k, v]) => `${k} ${v}`).join(", ");
    }
  }

  const phones = contact?.phones?.join(", ") || "—";
  const emails = contact?.emails?.join(", ") || "—";
  const addresses = contact?.addresses?.join(", ") || "—";
  const desc = meta?.description || meta?.["og:description"] || "";

  let servicesBlock = "";
  if (prices?.length) {
    servicesBlock = "\n## Cennik\n" + prices.map(p => `- ${p.item}: ${p.price}`).join("\n");
  } else if (services?.length) {
    servicesBlock = "\n## Usługi\n" + services.map(s => `- ${s}`).join("\n");
  }

  return `Jesteś asystentem głosowym AI dla firmy "${b}" — działa w branży ${ind}.

Twoja rola: odbieraj telefony od klientów, przyjmuj zamówienia, umawiaj rezerwacje, odpowiadaj na pytania. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku. Mów naturalnym i uprzejmym tonem.

## Informacje o firmie
${desc ? desc.slice(0, 400) : `Firma ${b} działa w branży ${ind}.`}

## Godziny otwarcia
${hoursStr}

## Kontakt
Telefon: ${phones}
Email: ${emails}
Adres: ${addresses}
${servicesBlock}
## Zasady rozmowy
1. Przywitaj się i przedstaw: "Dzień dobry, asystent AI z ${b}, w czym mogę pomóc?"
2. Jeśli klient chce złożyć zamówienie — przyjmij szczegóły: co, ile, dane do kontaktu
3. Jeśli klient chce zarezerwować termin — zapytaj o datę, godzinę, imię i telefon
4. Podaj informacje z cennika jeśli klient pyta o cenę
5. Na koniec podsumuj ustalenia i pożegnaj się
6. Jeśli nie znasz odpowiedzi — powiedz że przekażesz informację dalej
7. Mów naturalnie, nie czytaj z listy, nie używaj gwiazdek ani formatowania`;
}
