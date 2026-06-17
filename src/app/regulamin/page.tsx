import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regulamin — WitaLine",
  description: "Regulamin świadczenia usług WitaLine — System Gwarantowanego Odbierania Klientów 24/7.",
};

export default function RegulaminPage() {
  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <Link href="/" className="text-sm text-brand-400 hover:underline mb-8 inline-block">&larr; Powrót do strony głównej</Link>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-8">Regulamin świadczenia usług</h1>

        <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">1. Postanowienia ogólne</h2>
            <p>1.1. Niniejszy regulamin określa zasady świadczenia usługi "System Gwarantowanego Odbierania Klientów 24/7" przez WitaLine (zwaną dalej "Usługodawcą").</p>
            <p>1.2. Usługodawcą jest firma WitaLine. Kontakt: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a>, telefon: +48 732 125 752.</p>
            <p>1.3. Usługa polega na udostępnieniu Klientowi automatycznej recepcji (asystenta głosowego), który odbiera połączenia telefoniczne, prowadzi rozmowy z klientami, umawia wizyty, przyjmuje zamówienia oraz udostępnia transkrypcje, nagrania i statystyki w panelu zarządzania.</p>
            <p>1.4. Przed rozpoczęciem korzystania z usługi Klient zobowiązany jest zapoznać się z treścią Regulaminu oraz Polityką prywatności.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">2. Definicje</h2>
            <p>2.1. <strong>Klient</strong> — osoba fizyczna prowadząca działalność gospodarczą, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, która zawarła umowę z Usługodawcą.</p>
            <p>2.2. <strong>Okres rozliczeniowy</strong> — jeden miesiąc kalendarzowy, za który naliczana jest opłata abonamentowa.</p>
            <p>2.3. <strong>Abonament</strong> — miesięczna opłata stała za wybrany plan taryfowy, płatna z góry.</p>
            <p>2.4. <strong>Saldo prepaid</strong> — środki pieniężne na koncie Klienta, z których potrącane są koszty zakupu numeru telefonu oraz minut rozmów powyżej limitu abonamentowego.</p>
            <p>2.5. <strong>Numer dedykowany</strong> — polski numer telefonu (+48) przypisany do konta Klienta, zakupiony przez Usługodawcę w Twilio.</p>
            <p>2.6. <strong>Limit minut</strong> — maksymalna liczba minut rozmów bota w ramach wybranego planu w okresie rozliczeniowym.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">3. Rodzaje planów i cennik</h2>
            <p>3.1. WitaLine oferuje dwa modele rozliczeń:</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">A. Suwak minut — cena progresywna</h3>
            <p>Klient wybiera liczbę minut od 50 do 5000 za pomocą suwaka. Cena za minutę spada z każdym progiem 500 minut:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs">
                <thead><tr className="text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                  <th className="text-left pb-2 pr-3">Próg minut</th>
                  <th className="text-right pb-2 pr-3">Cena/min netto</th>
                  <th className="text-right pb-2 pr-3">Cena/min brutto</th>
                  <th className="text-right pb-2 pr-3">Np. miesięcznie netto</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">0–50</td><td className="text-right py-1.5 pr-3">2,00 PLN</td><td className="text-right py-1.5 pr-3">2,46 PLN</td><td className="text-right py-1.5">100,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">51–500</td><td className="text-right py-1.5 pr-3">1,90 PLN</td><td className="text-right py-1.5 pr-3">2,34 PLN</td><td className="text-right py-1.5">950,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">501–1000</td><td className="text-right py-1.5 pr-3">1,80 PLN</td><td className="text-right py-1.5 pr-3">2,21 PLN</td><td className="text-right py-1.5">1 800,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">1001–1500</td><td className="text-right py-1.5 pr-3">1,70 PLN</td><td className="text-right py-1.5 pr-3">2,09 PLN</td><td className="text-right py-1.5">2 550,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">1501–2000</td><td className="text-right py-1.5 pr-3">1,60 PLN</td><td className="text-right py-1.5 pr-3">1,97 PLN</td><td className="text-right py-1.5">3 200,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">2001–2500</td><td className="text-right py-1.5 pr-3">1,50 PLN</td><td className="text-right py-1.5 pr-3">1,85 PLN</td><td className="text-right py-1.5">3 750,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">2501–3000</td><td className="text-right py-1.5 pr-3">1,40 PLN</td><td className="text-right py-1.5 pr-3">1,72 PLN</td><td className="text-right py-1.5">4 200,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">3001–3500</td><td className="text-right py-1.5 pr-3">1,30 PLN</td><td className="text-right py-1.5 pr-3">1,60 PLN</td><td className="text-right py-1.5">4 550,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">3501–4000</td><td className="text-right py-1.5 pr-3">1,20 PLN</td><td className="text-right py-1.5 pr-3">1,48 PLN</td><td className="text-right py-1.5">4 800,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">4001–4500</td><td className="text-right py-1.5 pr-3">1,10 PLN</td><td className="text-right py-1.5 pr-3">1,35 PLN</td><td className="text-right py-1.5">4 950,00 PLN</td></tr>
                  <tr className="border-b border-zinc-100"><td className="py-1.5 pr-3">4501–5000</td><td className="text-right py-1.5 pr-3">1,00 PLN</td><td className="text-right py-1.5 pr-3">1,23 PLN</td><td className="text-right py-1.5">5 000,00 PLN</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2">Dodatkowa minuta ponad wybrany limit liczona jest wg stawki kolejnego progu (np. dla 500 min nadwyżka po 1,80 PLN/min).</p>
            <p className="mt-2">Dodatki opcjonalne (doliczane do ceny miesięcznej):</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Własny numer +48:</strong> +49 PLN netto/mies</li>
              <li><strong>Google Calendar:</strong> +39 PLN netto/mies</li>
              <li><strong>Integracja CRM:</strong> +79 PLN netto/mies (HubSpot, Livespace, Pipedrive)</li>
              <li><strong>Klon głosu:</strong> +99 PLN netto/mies</li>
              <li><strong>Nielimitowani konsultanci:</strong> +149 PLN netto/mies</li>
              <li><strong>Priorytetowe wsparcie:</strong> +59 PLN netto/mies</li>
              <li><strong>SLA 24/7:</strong> +199 PLN netto/mies</li>
            </ul>
            <p className="mt-2">Wszystkie konfiguracje obejmują: asystenta 24/7, widget na stronie, czat tekstowy, transkrypcje i nagrania, panel zarządzania.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">B. Plany abonamentowe (ceny netto)</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>START:</strong> 299 PLN/mies — 250 min, 1 konsultant</li>
              <li><strong>GROWTH:</strong> 600 PLN/mies — 600 min, 5 konsultantów (najpopularniejszy)</li>
              <li><strong>PRO:</strong> 300 PLN/mies — 300 min, 3 konsultantów</li>
              <li><strong>LUX:</strong> 800 PLN/mies — 800 min, 10 konsultantów</li>
              <li><strong>ENTERPRISE:</strong> 1500 PLN/mies — 1500 min, nieograniczeni konsultanci</li>
              <li><strong>ELASTYCZNY:</strong> 0 PLN/mies + stawka wg suwaka (A) — pay-as-you-go</li>
            </ul>
            <p className="mt-2">Stawki za dodatkowe minuty po wykorzystaniu limitu abonamentowego: START 1,80 PLN/min, GROWTH 1,50 PLN/min, PRO 1,48 PLN/min, LUX 1,23 PLN/min, ENTERPRISE 1,20 PLN/min.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">C. Plan Enterprise (indywidualny)</h3>
            <p>Dla firm wymagających dedykowanego podejścia. Cena ustalana indywidualnie na podstawie:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Szacowanej liczby minut rozmów (od 1500 PLN netto/mies)</li>
              <li>Zakresu integracji (CRM, ERP, API)</li>
              <li>Profesjonalnego klonu głosu</li>
              <li>Dedykowanego onboardingu i szkolenia zespołu</li>
              <li>SLA 24/7 z gwarantowanym czasem reakcji</li>
            </ul>
            <p className="mt-2">Opłata wdrożeniowa (one-time): od 299 PLN netto. Wycena na podstawie formularza kontaktowego lub rozmowy.</p>

            <p className="mt-4 text-xs text-zinc-400">Wszystkie ceny podane są w PLN. Do cen doliczany jest podatek VAT zgodnie z obowiązującymi przepisami: 23% dla firm polskich, 0% (odwrotne obciążenie) dla firm z UE z ważnym VAT-UE, 23% dla konsumentów.</p>
            <p className="mt-2">3.2. Klient może zmienić konfigurację w dowolnym momencie z poziomu panelu zarządzania. Zmiana naliczana jest proporcjonalnie.</p>
            <p>3.3. Dla konfiguratora Self-Service: płatność z góry za dany miesiąc. Niewykorzystane minuty przechodzą na kolejny miesiąc i kumulują się (rollover). Maksymalny stan rollover wynosi 2× miesięcznego limitu minut — nadwyżka przepada. Rollover jest naliczany automatycznie na koniec każdego okresu rozliczeniowego. Stan rollover widoczny w panelu zarządzania.</p>
            <p>3.4. Dla planu Enterprise: płatność z góry za dany miesiąc + opłata wdrożeniowa jednorazowo. Rollover minut ustalany indywidualnie w umowie. Warunki SLA określone w umowie indywidualnej.</p>
            <p>3.5. Połączenie na numer WitaLine (+48 732 125 752) jest standardowym połączeniem na numer komórkowy w Polsce. Koszt połączenia zależy wyłącznie od taryfy operatora dzwoniącego — WitaLine nie pobiera żadnych dodatkowych opłat za samo połączenie. Opłaty abonamentowe dotyczą wyłącznie korzystania z usługi asystenta głosowego.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">4. System prepaid i numer telefonu</h2>
            <p>4.1. Każde nowe konto otrzymuje 50 PLN bonusu powitalnego na saldo prepaid.</p>
            <p>4.2. Zakup dedykowanego polskiego numeru telefonu (+48) kosztuje 30 PLN i jest potrącany z salda prepaid Klienta.</p>
            <p>4.3. Koszt 30 PLN obejmuje opłatę za aktywację numeru w Twilio (~4 USD) oraz bufor na wahania kursu walutowego. Kwota ta jest ostateczna i nie podlega zwrotowi po aktywacji numeru.</p>
            <p>4.4. Klient może doładować saldo prepaid w panelu zarządzania przez Stripe (karta kredytowa/debetowa, Blik) — minimalna kwota doładowania: 50 PLN.</p>
            <p>4.5. W przypadku braku środków na saldzie, rozmowy są blokowane do czasu doładowania konta.</p>
            <p>4.6. Po rozwiązaniu umowy, niewykorzystane środki z salda prepaid podlegają zwrotowi na wniosek Klienta, pomniejszone o koszty już zrealizowanych usług.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">5. Rejestracja i konto</h2>
            <p>5.1. Rejestracja odbywa się przez formularz na stronie witaline.pl. Klient podaje adres e-mail i ustanawia hasło.</p>
            <p>5.2. Klient zobowiązuje się do podania prawdziwych danych oraz aktualizowania ich w przypadku zmian.</p>
            <p>5.3. Klient może posiadać tylko jedno konto. Każde konto może zarządzać wieloma firmami (oddziałami).</p>
            <p>5.4. Klient zobowiązuje się do zachowania poufności hasła i nieudostępniania konta osobom trzecim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">6. Płatności</h2>
            <p>6.1. Opłaty abonamentowe pobierane są z góry za każdy okres rozliczeniowy. Płatność realizowana jest przez Stripe — kartą kredytową/debetową lub Blik.</p>
            <p>6.2. W przypadku braku płatności Usługodawca zawiesza świadczenie usług po 7 dniach od terminu płatności. Po 30 dniach od terminu konto zostaje usunięte wraz z danymi.</p>
            <p>6.3. Po przekroczeniu limitu minut w planie abonamentowym obowiązują stawki za dodatkowe minuty (zgodnie z pkt 3.2), potrącane z salda prepaid. W planie Enterprise stawka dodatkowa: 1,20 PLN/min.</p>
            <p>6.4. Wszystkie ceny są cenami netto. Do cen doliczany jest podatek VAT zgodnie z obowiązującymi przepisami.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">7. Prawo odstąpienia od umowy</h2>
            <p>7.1. Klient będący konsumentem ma prawo odstąpić od niniejszej umowy w terminie 14 dni od daty jej zawarcia bez podawania przyczyny.</p>
            <p>7.2. Aby skorzystać z prawa odstąpienia, Klient powinien wysłać jednoznaczne oświadczenie na adres e-mail: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a> lub za pośrednictwem panelu zarządzania (zakładka Ustawienia konta → Usuń konto).</p>
            <p>7.3. W przypadku odstąpienia od umowy, Usługodawca zwraca wszystkie otrzymane od Klienta płatności niezwłocznie, nie później niż 14 dni od dnia otrzymania oświadczenia o odstąpieniu.</p>
            <p>7.4. Klient ponosi koszt za usługi faktycznie wykonane do momentu odstąpienia. Koszt ten wynosi tyle, ile wynosi opłata abonamentowa proporcjonalnie do liczby dni korzystania z usługi.</p>
            <p>7.5. Prawo odstąpienia nie przysługuje Klientowi będącemu przedsiębiorcą.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">8. 30-dniowa gwarancja satysfakcji</h2>
            <p>8.1. Usługodawca udziela 30-dniowej gwarancji satysfakcji: jeśli w ciągu pierwszych 30 dni korzystania z usługi bot nie zapisze ani jednego poprawnego kontaktu do klienta, Usługodawca zwraca 100% kwoty abonamentu.</p>
            <p>8.2. Aby skorzystać z gwarancji, Klient zgłasza to za pośrednictwem panelu lub e-mail: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a>.</p>
            <p>8.3. Gwarancja nie obejmuje przypadków, w których Klient nie skonfigurował poprawnie promptu lub bazy wiedzy zgodnie z instrukcją.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">9. Zasady korzystania z usługi</h2>
            <p>9.1. Klient zobowiązuje się do niestosowania usługi w sposób sprzeczny z prawem, w tym do niedokonywania celowych prób obciążenia systemu (asymetria tokenów ElevenLabs vs minut Twilio).</p>
            <p>9.2. W przypadku stwierdzenia nadużycia, Usługodawca ma prawo natychmiastowo zablokować konto Klienta bez zwrotu środków.</p>
            <p>9.3. Klient ponosi odpowiedzialność za treść promptu systemowego oraz bazy wiedzy skonfigurowanej dla bota.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">10. Odpowiedzialność</h2>
            <p>10.1. Usługodawca dołoży wszelkich starań, aby usługa działała bez przerw, jednak nie gwarantuje 100% dostępności ze względu na planowane przerwy techniczne i czynniki zewnętrzne.</p>
            <p>10.2. Łączna odpowiedzialność Usługodawcy wobec Klienta z tytułu niewykonania lub nienależytego wykonania usługi ograniczona jest do wysokości opłaty abonamentowej za bieżący okres rozliczeniowy.</p>
            <p>10.3. Usługodawca nie ponosi odpowiedzialności za treść rozmów prowadzonych przez asystenta głosowego, która wynika z błędnie skonfigurowanego promptu lub bazy wiedzy przez Klienta.</p>
            <p>10.4. Usługodawca nie ponosi odpowiedzialności za utratę danych spowodowaną działaniem siły wyższej, błędem Klienta lub awarią infrastruktury zewnętrznych dostawców (Twilio, ElevenLabs, Stripe).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">11. Ochrona danych i okres przechowywania</h2>
            <p>11.1. Administratorem danych osobowych jest WitaLine. Szczegółowe informacje znajdują się w <Link href="/polityka-prywatnosci" className="text-brand-400 hover:underline">Polityce prywatności</Link>.</p>
            <p>11.2. Nagrania rozmów i transkrypcje są przechowywane przez okres maksymalnie 30 dni, po czym są automatycznie i trwale usuwane.</p>
            <p>11.3. Klient ma prawo w każdej chwili zażądać usunięcia wszystkich danych powiązanych z danym numerem telefonu za pośrednictwem panelu administracyjnego (zakładka RODO).</p>
            <p>11.4. W przypadku usunięcia konta, wszystkie dane Klienta są trwale usuwane w ciągu 30 dni od momentu zamknięcia konta.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">12. Narzędzia systemowe (MCP) i automatyzacja</h2>
            <p>12.1. Asystent głosowy WitaLine może korzystać z narzędzi systemowych (MCP — Model Context Protocol) w celu realizacji zadań takich jak: wyszukiwanie firm, zapis danych kontaktowych, sprawdzanie terminów, tworzenie rezerwacji, wysyłka wiadomości WhatsApp oraz przekazywanie rozmów do konsultantów.</p>
            <p>12.2. Każde użycie narzędzia jest logowane i widoczne w panelu zarządzania. Klient ma wgląd w historię wywołań narzędzi wraz z przekazanymi parametrami.</p>
            <p>12.3. Narzędzia są uruchamiane wyłącznie w kontekście bieżącej rozmowy i wyłącznie na wyraźne żądanie Klienta lub rozmówcy. Asystent nie używa narzędzi bez potrzeby.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">13. Rollover minut — szczegóły</h2>
            <p>13.1. Niewykorzystane minuty z miesięcznego limitu przechodzą na kolejny miesiąc (rollover). Stan rollover jest widoczny w panelu zarządzania.</p>
            <p>13.2. Maksymalny stan rollover wynosi 2× miesięcznego limitu minut (np. przy limicie 300 min można zgromadzić max 600 min rollover). Nadwyżka ponad cap przepada z końcem okresu rozliczeniowego.</p>
            <p>13.3. Rollover naliczany jest automatycznie na koniec każdego okresu rozliczeniowego. Historia rollover dostępna w panelu (zakładka Historia).</p>
            <p>13.4. W przypadku zmiany konfiguracji w trakcie okresu, rollover jest przeliczany proporcjonalnie. W przypadku przejścia na niższy limit, nadmiarowe minuty rollover (powyżej nowego capu) przepadają.</p>
            <p>13.5. Rollover nie dotyczy modelu Enterprise, chyba że umowa indywidualna stanowi inaczej.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">14. Rozwiązanie umowy i usunięcie konta</h2>
            <p>14.1. Umowa zawierana jest na czas nieokreślony. Klient może wypowiedzieć umowę w dowolnym momencie z poziomu panelu zarządzania (zakładka Ustawienia konta → Usuń konto).</p>
            <p>14.2. Usunięcie konta skutkuje natychmiastowym anulowaniem subskrypcji Stripe, usunięciem numeru telefonu z Twilio oraz trwałym usunięciem wszystkich danych Klienta (call logs, transkrypcje, nagrania, ustawienia).</p>
            <p>14.3. Niewykorzystane środki z salda prepaid podlegają zwrotowi na wskazany rachunek bankowy w terminie 14 dni od zamknięcia konta, pomniejszone o koszty już zrealizowanych usług.</p>
            <p>14.4. Usługodawca może rozwiązać umowę z 30-dniowym okresem wypowiedzenia w przypadku naruszenia przez Klienta postanowień Regulaminu.</p>
            <p>14.5. W przypadku braku płatności przez okres 30 dni, konto Klienta zostaje automatycznie usunięte wraz ze wszystkimi danymi.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">15. Postanowienia końcowe</h2>
            <p>15.1. Usługodawca zastrzega sobie prawo do zmiany Regulaminu. Klient zostanie powiadomiony o zmianach e-mailem na 14 dni przed ich wejściem w życie.</p>
            <p>15.2. W przypadku braku akceptacji zmian, Klient ma prawo wypowiedzieć umowę przed dniem wejścia w życie zmian.</p>
            <p>15.3. Wszelkie spory rozstrzygane będą przez sąd właściwy dla siedziby Usługodawcy.</p>
            <p>15.4. Regulamin wchodzi w życie z dniem 15 czerwca 2026 roku.</p>
            <p className="mt-6 text-zinc-400 text-xs">Data ostatniej aktualizacji: 15 czerwca 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
