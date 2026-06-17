import { supabaseAdmin } from "./supabase-admin";
import { createBooking, checkAvailability } from "./calendar";

type ToolContext = {
  businessId: string;
  businessName?: string;
};

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolContext
) => Promise<string>;

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_services",
      description: "Pobiera listę usług oferowanych przez firmę z cenami i czasem trwania",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Sprawdza dostępne terminy dla podanej daty. Jeśli brak, zwraca najbliższe wolne dni.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Data w formacie YYYY-MM-DD" },
          service_type: { type: "string", description: "Opcjonalnie — typ usługi" },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reservation",
      description: "Tworzy nową rezerwację — sprawdza dostępność i rezerwuje atomowo (zabezpieczone przed double-booking)",
      parameters: {
        type: "object",
        properties: {
          reserved_at: { type: "string", description: "Data i czas w formacie ISO 8601 (np. 2026-06-10T14:00:00Z)" },
          service_type: { type: "string", description: "Rodzaj usługi" },
          caller_name: { type: "string", description: "Imię i nazwisko klienta" },
          caller_phone: { type: "string", description: "Numer telefonu klienta" },
          notes: { type: "string", description: "Dodatkowe uwagi" },
        },
        required: ["reserved_at", "service_type", "caller_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_business_hours",
      description: "Sprawdza godziny otwarcia firmy w poszczególne dni tygodnia",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_menu",
      description: "Pobiera menu lub katalog produktów, opcjonalnie filtrując po kategorii",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Opcjonalna kategoria" },
        },
        required: [],
      },
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async get_services(_args, ctx) {
    const { data } = await supabaseAdmin
      .from("businesses")
      .select("services, name")
      .eq("id", ctx.businessId)
      .single();
    if (!data?.services || !Array.isArray(data.services) || data.services.length === 0) {
      return "Brak zdefiniowanych usług. Poproś klienta o kontakt z firmą.";
    }
    return JSON.stringify(data.services, null, 2);
  },

  async check_availability(args, ctx) {
    const date = args.date as string;
    if (!date) return "Nie podano daty.";

    const result = await checkAvailability(ctx.businessId, date);

    if (!result.available && !result.slots.length) {
      if (result.nextDates && result.nextDates.length > 0) {
        return `Brak terminów w dniu ${date}. Najbliższe dostępne dni: ${result.nextDates.join(", ")}. Zachęć klienta do wyboru innego dnia.`;
      }
      return `Brak dostępnych terminów w dniu ${date}. Firma jest nieczynna.`;
    }

    if (!result.available || result.slots.length === 0) {
      if (result.nextDates && result.nextDates.length > 0) {
        return `Brak wolnych terminów w dniu ${date}. Najbliższe dostępne dni: ${result.nextDates.join(", ")}. Zaproponuj klientowi jeden z tych dni.`;
      }
      return `Brak wolnych terminów w dniu ${date}.`;
    }

    return JSON.stringify({
      date,
      available_slots: result.slots,
      message: "NIGDY nie mów klientowi kto i kiedy ma już zarezerwowaną wizytę. Nie podawaj żadnych informacji o innych klientach.",
    }, null, 2);
  },

  async create_reservation(args, ctx) {
    const reservedAt = args.reserved_at as string;
    const serviceType = args.service_type as string;
    const callerName = args.caller_name as string;
    const callerPhone = (args.caller_phone as string) || "";
    const notes = (args.notes as string) || "";

    if (!reservedAt || !serviceType || !callerName) {
      return "Brak wymaganych pól: reserved_at, service_type, caller_name.";
    }

    const result = await createBooking({
      businessId: ctx.businessId,
      reservedAt,
      serviceType,
      callerName,
      callerPhone,
      notes,
    });

    if (!result.ok) {
      return result.error;
    }

    return JSON.stringify({
      success: true,
      message: `Rezerwacja potwierdzona. Klient dostanie SMS z potwierdzeniem.`,
      reservation: result.reservation,
    }, null, 2);
  },

  async get_business_hours(_args, ctx) {
    const { data } = await supabaseAdmin
      .from("businesses")
      .select("calendar_settings, name")
      .eq("id", ctx.businessId)
      .single();
    if (!data?.calendar_settings) {
      return "Brak skonfigurowanych godzin pracy.";
    }

    const settings = data.calendar_settings as Record<string, { enabled?: boolean; start?: string; end?: string }>;
    const hours: Record<string, string> = {};
    const dayNames = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];
    for (const day of dayNames) {
      const cfg = settings[day];
      if (cfg?.enabled) {
        hours[day] = `${cfg.start || "09:00"} - ${cfg.end || "17:00"}`;
      } else {
        hours[day] = "nieczynne";
      }
    }
    return JSON.stringify({ business: data.name, hours }, null, 2);
  },

  async get_menu(args, ctx) {
    const category = args.category as string | undefined;
    const { data } = await supabaseAdmin
      .from("businesses")
      .select("menu_catalog, name")
      .eq("id", ctx.businessId)
      .single();
    if (!data?.menu_catalog) {
      return "Brak menu w systemie.";
    }

    const catalog = data.menu_catalog as Record<string, unknown> | Record<string, unknown>[];
    let items = Array.isArray(catalog) ? catalog : [catalog];

    if (category) {
      const cat = category.toLowerCase();
      items = items.filter((item: Record<string, unknown>) =>
        String(item.category || item.kategoria || "").toLowerCase().includes(cat)
      );
      if (items.length === 0) {
        return `Brak pozycji w kategorii "${category}".`;
      }
    }

    return JSON.stringify({ business: data.name, items }, null, 2);
  },
};

export function getToolContext(businessId: string, businessName?: string): ToolContext {
  return { businessId, businessName };
}
