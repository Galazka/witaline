import { z } from "zod";

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
}

export const TOOL_DEFINITIONS: ToolDef[] = [
  {
    name: "business_lookup",
    description:
      "Search for a business registered with WitaLine by name or DTMF code. Returns business details and system prompt if found. Use this when a caller wants to connect to a specific business.",
    inputSchema: {
      query: z.string().describe("Nazwa firmy albo kod DTMF"),
    },
  },
  {
    name: "save_lead",
    description:
      "Zapisuje dane kontaktowe potencjalnego klienta (leada). Uzyj gdy klient poda swoje dane (imie, telefon, email, zainteresowanie).",
    inputSchema: {
      name: z.string().describe("Imie i nazwisko klienta"),
      phone: z.string().describe("Numer telefonu klienta"),
      email: z.string().optional().describe("Adres email (opcjonalnie)"),
      interest: z.string().optional().describe("Zainteresowanie"),
      notes: z.string().optional().describe("Dodatkowe uwagi"),
      business_id: z.string().optional().describe("ID firmy jesli dotyczy"),
    },
  },
  {
    name: "check_availability",
    description:
      "Sprawdza dostepne terminy dla podanej daty. Jesli brak, zwraca najblizsze wolne dni.",
    inputSchema: {
      business_id: z.string().describe("ID firmy"),
      date: z.string().describe("Data w formacie YYYY-MM-DD"),
    },
  },
  {
    name: "create_reservation",
    description:
      "Tworzy nowa rezerwacje wizyty. Zabezpieczone przed double-booking.",
    inputSchema: {
      business_id: z.string().describe("ID firmy"),
      reserved_at: z.string().describe("Data i godzina w formacie ISO 8601"),
      service_type: z.string().describe("Rodzaj uslugi"),
      caller_name: z.string().describe("Imie i nazwisko klienta"),
      caller_phone: z.string().optional().describe("Numer telefonu klienta"),
      notes: z.string().optional().describe("Dodatkowe uwagi"),
    },
  },
  {
    name: "get_services",
    description:
      "Pobiera liste uslug oferowanych przez firme z cenami i czasem trwania.",
    inputSchema: {
      business_id: z.string().describe("ID firmy"),
    },
  },
  {
    name: "get_business_hours",
    description:
      "Sprawdza godziny otwarcia firmy w poszczegolne dni tygodnia.",
    inputSchema: {
      business_id: z.string().describe("ID firmy"),
    },
  },
  {
    name: "send_whatsapp",
    description:
      "Wysyla wiadomosc WhatsApp do klienta. Uzyj gdy klient wyrazil zgode na kontakt przez WhatsApp.",
    inputSchema: {
      phone: z.string().describe("Numer telefonu klienta z kierunkowym"),
      message: z.string().optional().describe("Tresc wiadomosci"),
      template: z
        .enum(["booking", "order", "offer", "payment_reminder", "default"])
        .optional()
        .describe("Szablon wiadomosci"),
      name: z.string().optional().describe("Imie klienta"),
      date: z.string().optional(),
      time: z.string().optional(),
      service: z.string().optional(),
      summary: z.string().optional(),
      plan_name: z.string().optional(),
      price: z.string().optional(),
      payment_link: z.string().optional(),
      amount: z.string().optional(),
      business_id: z.string().optional(),
    },
  },
  {
    name: "transfer_to_human",
    description:
      "Przekazuje polaczenie do czlowieka/konsultanta firmy, gdy klient wyraznie poprosi o rozmowe z osoba. Uzyj tylko wtedy, gdy klient powiedzial np. poprosze czlowieka, konsultant, nie bot, polacz z wlascicielem.",
    inputSchema: {
      business_id: z.string().describe("ID firmy z dynamic_vars.business_id"),
      caller_phone: z.string().optional().describe("Numer telefonu klienta z kierunkowym (opcjonalny)"),
      to_number: z.string().optional().describe("Numer Twilio na ktory klient dzwonil (opcjonalny)"),
      reason: z.string().optional().describe("Powod przekazania"),
    },
  },
  {
    name: "create_checkout",
    description:
      "Tworzy sesje platnosci Stripe dla wybranego planu. Uzyj gdy klient chce Zaplacic/aktywowac ktorys z planow: Elastyczny, Pro, Lux.",
    inputSchema: {
      plan: z.enum(["elastic_0", "pro_249", "lux_599", "start_100", "pro_500", "enterprise_2000"]).describe("Klucz planu"),
      business_id: z.string().describe("ID firmy klienta"),
      customer_email: z.string().optional().describe("Email klienta do sesji"),
    },
  },
];

export type ToolName = (typeof TOOL_DEFINITIONS)[number]["name"];
