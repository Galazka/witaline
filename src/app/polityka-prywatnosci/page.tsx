import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polityka prywatności — WitaLine",
  description: "Polityka prywatności WitaLine — jak przetwarzamy Twoje dane osobowe, RODO, prawo do bycia zapomnianym.",
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <Link href="/" className="text-sm text-brand-400 hover:underline mb-8 inline-block">&larr; Powrót do strony głównej</Link>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-8">Polityka prywatności</h1>

        <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">1. Administrator danych</h2>
            <p>Administratorem Twoich danych osobowych jest WitaLine. Kontakt we wszystkich sprawach związanych z przetwarzaniem danych osobowych:</p>
            <p className="mt-1">E-mail: <a href="mailto:rodo@witaline.pl" className="text-brand-400 hover:underline">rodo@witaline.pl</a></p>
            <p>Telefon: +48 732 125 752</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">2. Jakie dane zbieramy i w jakim celu?</h2>

            <p className="font-semibold mt-4">2.1. Dane rejestracyjne (podstawa: art. 6 ust. 1 lit. b RODO — wykonanie umowy)</p>
            <ul className="list-disc pl-6 mt-1">
              <li>Adres e-mail</li>
              <li>Nazwa firmy</li>
              <li>Adres strony www (do automatycznego skanowania oferty)</li>
            </ul>

            <p className="font-semibold mt-4">2.2. Dane telekomunikacyjne (podstawa: art. 6 ust. 1 lit. b RODO — wykonanie umowy oraz art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes)</p>
            <ul className="list-disc pl-6 mt-1">
              <li>Numer telefonu dzwoniącego (Caller ID)</li>
              <li>Nagrania rozmów — przechowywane maksymalnie 30 dni</li>
              <li>Transkrypcje rozmów — przechowywane maksymalnie 30 dni</li>
              <li>Data, godzina i czas trwania połączenia</li>
            </ul>

            <p className="font-semibold mt-4">2.3. Dane płatnicze (podstawa: art. 6 ust. 1 lit. c RODO — obowiązek prawny)</p>
            <ul className="list-disc pl-6 mt-1">
              <li>Dane do faktury (NIP, adres firmy)</li>
              <li>Historia transakcji</li>
            </ul>
            <p className="mt-1">Uwaga: pełne numery kart kredytowych nie są przechowywane przez WitaLine. Płatności są przetwarzane przez Stripe — zobacz <a href="https://stripe.com/privacy" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">Politykę prywatności Stripe</a>.</p>

            <p className="font-semibold mt-4">2.4. Głos jako dana biometryczna</p>
            <p className="mt-1">Głos osoby dzwoniącej jest przetwarzany wyłącznie w celu prowadzenia rozmowy przez asystenta AI. Przed rozpoczęciem rozmowy odtwarzany jest komunikat o nagrywaniu, a kontynuacja połączenia stanowi dobrowolną zgodę (art. 6 ust. 1 lit. a RODO). Nie wykorzystujemy głosu do identyfikacji biometrycznej (wyjątek: funkcja autoryzacji głosem, wymagająca osobnej, wyraźnej zgody).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">3. Okres przechowywania danych</h2>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="border border-zinc-200 px-3 py-2 text-left font-semibold">Rodzaj danych</th>
                    <th className="border border-zinc-200 px-3 py-2 text-left font-semibold">Okres przechowywania</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Nagrania rozmów</td>
                    <td className="border border-zinc-200 px-3 py-2">30 dni (automatyczne usunięcie)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Transkrypcje rozmów</td>
                    <td className="border border-zinc-200 px-3 py-2">30 dni (automatyczne usunięcie)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Dane konta (e-mail, firma)</td>
                    <td className="border border-zinc-200 px-3 py-2">Przez czas trwania umowy + 3 lata</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Dane płatnicze (faktury)</td>
                    <td className="border border-zinc-200 px-3 py-2">5 lat (wymóg podatkowy)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Logi połączeń (Caller ID, czas)</td>
                    <td className="border border-zinc-200 px-3 py-2">30 dni</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-zinc-400">Automatyczne czyszczenie danych odbywa się codziennie o godzinie 3:00 czasu polskiego.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">4. Odbiorcy danych (podprocesory)</h2>
            <p>Twoje dane mogą być przekazywane do następujących podmiotów przetwarzających:</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="border border-zinc-200 px-3 py-2 text-left font-semibold">Podmiot</th>
                    <th className="border border-zinc-200 px-3 py-2 text-left font-semibold">Cel</th>
                    <th className="border border-zinc-200 px-3 py-2 text-left font-semibold">Lokalizacja</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Supabase</td>
                    <td className="border border-zinc-200 px-3 py-2">Hosting bazy danych PostgreSQL</td>
                    <td className="border border-zinc-200 px-3 py-2">UE (Niemcy/Frankfurt)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Stripe</td>
                    <td className="border border-zinc-200 px-3 py-2">Przetwarzanie płatności</td>
                    <td className="border border-zinc-200 px-3 py-2">Globalnie (EU-US Data Framework)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Twilio</td>
                    <td className="border border-zinc-200 px-3 py-2">Routing połączeń telefonicznych</td>
                    <td className="border border-zinc-200 px-3 py-2">EOG (domyślnie UE)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">ElevenLabs</td>
                    <td className="border border-zinc-200 px-3 py-2">Synteza mowy (TTS) i rozpoznawanie mowy (STT)</td>
                    <td className="border border-zinc-200 px-3 py-2">USA (standardowe klauzule umowne)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">OpenRouter</td>
                    <td className="border border-zinc-200 px-3 py-2">Model AI do prowadzenia konwersacji</td>
                    <td className="border border-zinc-200 px-3 py-2">Globalnie (anonimowe zapytania)</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 px-3 py-2">Cloudflare</td>
                    <td className="border border-zinc-200 px-3 py-2">Tunel i CDN</td>
                    <td className="border border-zinc-200 px-3 py-2">Globalnie</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">5. Twoje prawa (RODO)</h2>
            <p>Na podstawie RODO przysługują Ci następujące prawa:</p>
            <div className="mt-2 space-y-3">
              <div>
                <p className="font-semibold">5.1. Prawo dostępu do danych (art. 15 RODO)</p>
                <p>Możesz pobrać wszystkie swoje dane z poziomu panelu zarządzania. Obejmuje to: dane konta, transkrypcje, nagrania (jeśli istnieją), historię połączeń.</p>
              </div>
              <div>
                <p className="font-semibold">5.2. Prawo do sprostowania danych (art. 16 RODO)</p>
                <p>Możesz edytować swoje dane w panelu zarządzania w każdej chwili.</p>
              </div>
              <div>
                <p className="font-semibold">5.3. Prawo do usunięcia danych — "prawo do bycia zapomnianym" (art. 17 RODO)</p>
                <p>Masz prawo zażądać usunięcia wszystkich danych powiązanych z Twoim numerem telefonu. W panelu administracyjnym (zakładka RODO) administrator może jednym kliknięciem usunąć wszystkie nagrania, transkrypcje i logi powiązane z danym numerem. Możesz też usunąć całe konto z panelu zarządzania (Ustawienia konta → Usuń konto).</p>
              </div>
              <div>
                <p className="font-semibold">5.4. Prawo do ograniczenia przetwarzania (art. 18 RODO)</p>
                <p>Możesz zażądać ograniczenia przetwarzania swoich danych, wysyłając e-mail na adres <a href="mailto:rodo@witaline.pl" className="text-brand-400 hover:underline">rodo@witaline.pl</a>.</p>
              </div>
              <div>
                <p className="font-semibold">5.5. Prawo do przenoszenia danych (art. 20 RODO)</p>
                <p>Masz prawo otrzymać swoje dane w ustrukturyzowanym, powszechnie używanym formacie (JSON) i żądać przesłania ich innemu administratorowi.</p>
              </div>
              <div>
                <p className="font-semibold">5.6. Prawo wniesienia sprzeciwu (art. 21 RODO)</p>
                <p>Masz prawo wnieść sprzeciw wobec przetwarzania danych w celach marketingowych.</p>
              </div>
              <div>
                <p className="font-semibold">5.7. Prawo wniesienia skargi do organu nadzorczego</p>
                <p>Masz prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">6. Pliki cookies i technologie śledzące</h2>
            <p>6.1. Używamy niezbędnych plików cookies do działania panelu zarządzania i uwierzytelniania użytkowników (ciasteczka sesyjne Supabase).</p>
            <p>6.2. Nie używamy plików cookies reklamowych ani śledzących bez Twojej wyraźnej zgody.</p>
            <p>6.3. Możesz zarządzać ustawieniami cookies w swojej przeglądarce. Wyłączenie niezbędnych cookies może uniemożliwić korzystanie z panelu.</p>
            <p>6.4. Korzystamy z usługi Cloudflare, która może wykorzystywać pliki cookies niezbędne do zapewnienia bezpieczeństwa i wydajności strony.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">7. Bezpieczeństwo danych</h2>
            <p>7.1. Wszystkie połączenia są szyfrowane protokołem TLS/SSL.</p>
            <p>7.2. Dane przechowywane są na serwerach w Unii Europejskiej (Supabase — Frankfurt, Niemcy).</p>
            <p>7.3. Dostęp do danych mają wyłącznie upoważnieni administratorzy z uwierzytelnianiem dwuskładnikowym.</p>
            <p>7.4. Regularnie wykonujemy kopie zapasowe bazy danych.</p>
            <p>7.5. Automatyczny skrypt czyści dane starsze niż 30 dni (nagrania, transkrypcje, logi).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">8. Zmiany w Polityce prywatności</h2>
            <p>8.1. Zastrzegamy sobie prawo do wprowadzania zmian w Polityce prywatności.</p>
            <p>8.2. O każdej zmianie poinformujemy Cię e-mailem na adres powiązany z kontem.</p>
            <p>8.3. Zmiany wchodzą w życie po 14 dniach od powiadomienia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">9. Kontakt w sprawach RODO</h2>
            <p>We wszystkich sprawach związanych z ochroną danych osobowych:</p>
            <p className="mt-1">E-mail: <a href="mailto:rodo@witaline.pl" className="text-brand-400 hover:underline">rodo@witaline.pl</a></p>
            <p>Telefon: +48 732 125 752</p>
            <p>Administrator: WitaLine</p>
            <p className="mt-6 text-zinc-400 text-xs">Data ostatniej aktualizacji: 8 czerwca 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
