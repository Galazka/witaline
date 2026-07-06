const GUS_API_KEY = process.env.GUS_API_KEY;
const GUS_URL = "https://api.stat.gov.pl/BIR/PobierzDane.svc";

function buildSoap(action: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:ns="http://CIS/BIR/PUBL/2014/07"
  xmlns:wsa="http://www.w3.org/2005/08/addressing">
  <soap:Header>
    <wsa:To>${GUS_URL}</wsa:To>
    <wsa:Action>http://CIS/BIR/PUBL/2014/07/IUslugaBIR/${action}</wsa:Action>
  </soap:Header>
  <soap:Body>${body}</soap:Body>
</soap:Envelope>`;
}

async function soapCall(action: string, body: string, sid?: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/soap+xml; charset=utf-8" };
  if (sid) headers["sid"] = sid;
  const res = await fetch(GUS_URL, { method: "POST", headers, body: buildSoap(action, body) });
  const text = await res.text();
  return text;
}

function extractXml(text: string, tag: string): string {
  const m = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : "";
}

export interface GusCompanyData {
  regon: string;
  nip: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  status: string;
}

export async function verifyNipByGus(nip: string): Promise<GusCompanyData | null> {
  if (!GUS_API_KEY || nip.length !== 10 || !/^\d{10}$/.test(nip)) return null;

  try {
    const loginXml = await soapCall("Zaloguj", `<ns:Zaloguj><ns:pKluczUzytkownika>${GUS_API_KEY}</ns:pKluczUzytkownika></ns:Zaloguj>`);
    const sid = extractXml(loginXml, "ZalogujResult");
    if (!sid) return null;

    try {
      const searchXml = await soapCall("DaneSzukaj", `<ns:DaneSzukaj><ns:pParametrySzukania><ns:Nip>${nip}</ns:Nip></ns:pParametrySzukania></ns:DaneSzukaj>`, sid);
      const regon = extractXml(searchXml, "Regon");
      if (!regon) return null;

      const name = extractXml(searchXml, "Nazwa") || extractXml(searchXml, "NazwaPelna");
      const street = extractXml(searchXml, "Ulica");
      const city = extractXml(searchXml, "Miejscowosc");
      const postalCode = extractXml(searchXml, "KodPocztowy");

      let status = "active";
      const statusRaw = extractXml(searchXml, "Status");
      if (statusRaw) status = statusRaw;

      return { regon, nip, name, street, city, postalCode, status };
    } finally {
      await soapCall("Wyloguj", "<ns:Wyloguj />", sid).catch(() => {});
    }
  } catch {
    return null;
  }
}
