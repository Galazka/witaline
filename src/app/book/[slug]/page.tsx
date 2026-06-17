import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PublicBookingWidget from "@/components/PublicBookingWidget";
import type { Service } from "@/types/database";

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name, services")
    .eq("slug", slug)
    .single();

  if (!business) notFound();

  return (
    <main className="min-h-screen bg-white py-8 md:py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-brand-600 mb-1">WitaLine</div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Rezerwacja wizyty &mdash; {business.name}
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Wybierz usługę, termin i zostaw swoje dane. Potwierdzenie otrzymasz SMS-em.
          </p>
        </div>

        <PublicBookingWidget
          businessId={business.id}
          businessName={business.name}
          services={(business.services || []) as Service[]}
        />
      </div>
    </main>
  );
}
