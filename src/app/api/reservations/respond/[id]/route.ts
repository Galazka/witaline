import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const token = searchParams.get("token");

  if (!action || !token || !["accept", "reject"].includes(action)) {
    return htmlResponse("Nieprawidłowy link.", false);
  }

  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (!reservation) {
    return htmlResponse("Rezerwacja nie istnieje.", false);
  }

  if (reservation.change_token !== token) {
    return htmlResponse("Link wygasł lub jest nieprawidłowy.", false);
  }

  if (!reservation.pending_changes) {
    return htmlResponse("Brak oczekujących zmian.", false);
  }

  const changes = reservation.pending_changes as Record<string, string>;

  if (action === "accept") {
    await supabaseAdmin
      .from("reservations")
      .update({
        reserved_at: changes.reserved_at,
        duration_minutes: changes.duration_minutes
          ? Number(changes.duration_minutes)
          : reservation.duration_minutes,
        notes: reservation.notes
          ? `${reservation.notes}\n--- Zmiana zaakceptowana: ${new Date().toLocaleString("pl-PL")}`
          : `Zmiana zaakceptowana: ${new Date().toLocaleString("pl-PL")}`,
        pending_changes: null,
        change_token: "",
        status: "confirmed",
      })
      .eq("id", id);

    return htmlResponse(
      `Zmiana terminu zaakceptowana! Nowy termin: ${formatDate(changes.reserved_at)}. Dziękujemy.`,
      true
    );
  }

  if (action === "reject") {
    await supabaseAdmin
      .from("reservations")
      .update({
        pending_changes: null,
        change_token: "",
        status: "confirmed",
        notes: reservation.notes
          ? `${reservation.notes}\n--- Zmiana odrzucona: ${new Date().toLocaleString("pl-PL")}`
          : `Zmiana odrzucona: ${new Date().toLocaleString("pl-PL")}`,
      })
      .eq("id", id);

    return htmlResponse(
      "Zmiana terminu odrzucona. Twoja pierwotna rezerwacja pozostaje aktualna.",
      true
    );
  }

  return htmlResponse("Nieprawidłowe żądanie.", false);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function htmlResponse(message: string, success: boolean): Response {
  const color = success ? "#0f766e" : "#dc2626";
  const icon = success
    ? `<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
    : `<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;

  return new Response(
    `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WitaLine - Potwierdzenie zmiany</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f4;color:#1c1917}
.card{background:white;border-radius:16px;padding:40px;max-width:420px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.icon{color:${color};margin-bottom:16px}
h2{font-size:1.25rem;margin:0 0 8px}
p{color:#71717a;font-size:.875rem;line-height:1.5;margin:0}
.logo{color:#0f766e;font-weight:700;font-size:1.5rem;margin-bottom:24px}
</style>
</head>
<body>
<div class="card">
<div class="logo">WitaLine</div>
<div class="icon">${icon}</div>
<h2>${success ? "Potwierdzone" : "Błąd"}</h2>
<p>${message}</p>
</div>
</body>
</html>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: success ? 200 : 400,
    }
  );
}
