import type { Metadata } from "next";
import Link from "next/link";
import { ELASTIC_TIERS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Regulamin — WitaLine",
  description: "Regulamin świadczenia usług WitaLine — asystent AI, SMS, WhatsApp, pakiety minut.",
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
            <p>1.1. Niniejszy regulamin określa zasady świadczenia usług asystenta AI, komunikacji SMS, WhatsApp oraz powiązanych usług przez WitaLine (zwaną dalej &bdquo;Usługodawc&abreve;").</p>
            <p>1.2. Usługodawc&abreve; jest firma WitaLine. Kontakt: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a>, telefon: +48 732 125 752.</p>
            <p>1.3. Usługa polega na udostępnieniu Klientowi automatycznej recepcji (asystenta głosowego AI), który odbiera połączenia telefoniczne, prowadzi rozmowy, umawia wizyty, przyjmuje zamówienia, wysyła wiadomości SMS i WhatsApp oraz udostępnia transkrypcje, nagrania i statystyki w panelu zarządzania.</p>
            <p>1.4. Przed rozpoczęciem korzystania z usługi Klient zobowi&abreve;zany jest zapoznać się z treścią Regulaminu oraz Polityk&abreve; prywatności.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">2. Definicje</h2>
            <p>2.1. <strong>Klient</strong> &mdash; osoba fizyczna prowadz&abreve;ca działalność gospodarcz&abreve;, osoba prawna lub jednostka organizacyjna nieposiadaj&abreve;ca osobowości prawnej, kt&oacute;ra zawarła umowę z Usługodawc&abreve;.</p>
            <p>2.2. <strong>Okres rozliczeniowy</strong> &mdash; jeden miesi&abreve;c kalendarzowy, za kt&oacute;ry naliczana jest opłata abonamentowa.</p>
            <p>2.3. <strong>Abonament</strong> &mdash; miesięczna opłata stała za wybrany plan taryfowy, płatna z g&oacute;ry.</p>
            <p>2.4. <strong>Pakiet minut</strong> &mdash; jednorazowy zakup minut rozmowy przez Stripe, doliczany do salda prepaid Klienta. Minuty ważne bezterminowo.</p>
            <p>2.5. <strong>Pakiet SMS</strong> &mdash; jednorazowy zakup SMS/wiadomości WhatsApp przez Stripe, doliczany do salda SMS Klienta.</p>
            <p>2.6. <strong>Numer dedykowany</strong> &mdash; polski numer telefonu (+48) przypisany do konta Klienta.</p>
            <p>2.7. <strong>Wiadomość SMS</strong> &mdash; wiadomość tekstowa wysłana za pośrednictwem Twilio API na numer telefonu kom&oacute;rkowego.</p>
            <p>2.8. <strong>WhatsApp Business API</strong> &mdash; kanał komunikacji wykorzystuj&abreve;cy platformę WhatsApp (Meta), dostępny po wyrażeniu zgody przez rozm&oacute;wcę.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">3. Rodzaje plan&oacute;w i cennik</h2>
            <p>3.1. WitaLine oferuje dwa modele rozliczeń za minutę rozmowy asystenta AI:</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">A. Model elastyczny (pay-as-you-go)</h3>
            <p>Brak opłaty stałej. Klient płaci tylko za wykorzystane minuty według progresji cenowej:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs">
                <thead><tr className="text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                  <th className="text-left pb-2 pr-3">Zakres minut/mies</th>
                  <th className="text-right pb-2 pr-3">Cena/min netto</th>
                  <th className="text-right pb-2 pr-3">Cena/min brutto</th>
                </tr></thead>
                <tbody>
                  {ELASTIC_TIERS.map((tier, i) => {
                    const range = tier.to === Infinity ? `${tier.from}+` : `${tier.from}–${tier.to}`;
                    const netto = tier.ratePerMin.toFixed(2).replace(".", ",");
                    const brutto = (tier.ratePerMin * 1.23).toFixed(2).replace(".", ",");
                    return (
                      <tr key={i} className="border-b border-zinc-100">
                        <td className="py-1.5 pr-3">{range}</td>
                        <td className="text-right py-1.5 pr-3">{netto} PLN</td>
                        <td className="text-right py-1.5">{brutto} PLN</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2">Klient może w każdej chwili dokupić pakiety minut przez Stripe (płatność jednorazowa). Minuty nie przepadaj&abreve;. Model elastyczny nie obejmuje rolloveru.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">B. Plany abonamentowe (ceny netto)</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Start:</strong> 199 PLN/mies &mdash; 250 min, do 3 konsultant&oacute;w</li>
              <li><strong>Pro:</strong> 249 PLN/mies &mdash; 300 min, do 3 konsultant&oacute;w</li>
              <li><strong>Growth:</strong> 399 PLN/mies &mdash; 600 min, do 5 konsultant&oacute;w (najpopularniejszy)</li>
              <li><strong>Lux:</strong> 599 PLN/mies &mdash; 800 min, do 10 konsultant&oacute;w</li>
              <li><strong>Enterprise:</strong> 999 PLN/mies &mdash; 1 500 min, nieograniczeni konsultanci. Dla większych wolumen&oacute;w &mdash; indywidualna wycena (jednorazowa opłata wdrożeniowa: 299 PLN netto).</li>
            </ul>
            <p className="mt-2">Nadwyżka ponad limit abonamentowy rozliczana według stawki modelu elastycznego (A). Niewykorzystane minuty przechodz&abreve; na kolejny miesi&abreve;c (rollover). Maksymalny stan rollover: 2× miesięcznego limitu.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">C. Dodatki opcjonalne (ceny netto/mies)</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Własny numer +48:</strong> 29 PLN</li>
              <li><strong>Google Calendar:</strong> 19 PLN</li>
              <li><strong>Integracja CRM:</strong> 49 PLN (HubSpot, Livespace, Pipedrive)</li>
              <li><strong>Klon głosu:</strong> 49 PLN</li>
              <li><strong>Nielimitowani konsultanci:</strong> 49 PLN</li>
              <li><strong>Priorytetowe wsparcie:</strong> 29 PLN</li>
              <li><strong>SLA 24/7:</strong> 99 PLN</li>
            </ul>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">D. Usługa SMS</h3>
            <p>WitaLine umożliwia wysyłkę wiadomości SMS za pośrednictwem Twilio API. Cennik:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Cena za pojedyncz&abreve; wiadomość SMS: <strong>0,50 PLN netto</strong></li>
              <li>Pakiety SMS (jednorazowy zakup przez Stripe):
                <ul className="list-disc pl-6 mt-1 space-y-0.5">
                  <li>50 SMS &mdash; 25 PLN</li>
                  <li>100 SMS &mdash; 45 PLN</li>
                  <li>200 SMS &mdash; 80 PLN</li>
                  <li>500 SMS &mdash; 175 PLN</li>
                  <li>1 000 SMS &mdash; 300 PLN</li>
                </ul>
              </li>
            </ul>
            <p className="mt-2">Ceny SMS dotycz&abreve; wyłącznie wiadomości wysłanych przez asystenta AI (automatycznie po rozmowie lub przez narzędzie send_sms). Niewykorzystane SMS-y z pakietu nie przepadaj&abreve;.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">E. Usługa WhatsApp</h3>
            <p>WitaLine umożliwia wysyłkę wiadomości przez WhatsApp Business API po wyrażeniu zgody przez rozm&oacute;wcę. Cennik:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Cena za pojedyncz&abreve; wiadomość WhatsApp: <strong>~0,54 PLN netto</strong></li>
              <li>Pakiety WhatsApp (jednorazowy zakup przez Stripe):
                <ul className="list-disc pl-6 mt-1 space-y-0.5">
                  <li>50 wiadomości &mdash; 30 PLN</li>
                  <li>100 wiadomości &mdash; 55 PLN</li>
                  <li>200 wiadomości &mdash; 100 PLN</li>
                  <li>500 wiadomości &mdash; 220 PLN</li>
                </ul>
              </li>
            </ul>
            <p className="mt-2">WhatsApp Continuity &mdash; automatyczne wysłanie wiadomości po rozmowie (jeśli Klient skonfigurował zgodę rozm&oacute;wcy). Wiadomości wysyłane s&abreve; tylko za zgod&abreve; rozm&oacute;wcy, wyrażon&abreve; podczas rozmowy z asystentem.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">F. Płatności wielowalutowe</h3>
            <p>WitaLine akceptuje płatności w walutach PLN, EUR i USD. Ceny w EUR i USD s&abreve; przeliczane według kursu: 1 EUR = 4,35 PLN, 1 USD = 3,85 PLN. Kursy mog&abreve; ulegać zmianie &mdash; aktualny kurs widoczny w panelu płatności Stripe.</p>

            <p className="mt-4 text-xs text-zinc-400">Wszystkie ceny podane s&abreve; w PLN netto, chyba że wskazano inaczej. Do cen doliczany jest podatek VAT: 23% dla firm polskich, 0% (odwrotne obci&abreve;żenie) dla firm z UE z ważnym VAT-UE, 23% dla konsument&oacute;w.</p>
            <p className="mt-2">3.2. Klient może zmienić plan lub dokupić pakiet w dowolnym momencie z poziomu panelu zarządzania.</p>
            <p>3.3. Połączenie na numer WitaLine (+48 732 125 752) jest standardowym połączeniem na numer kom&oacute;rkowy. Koszt połączenia zależy od taryfy operatora dzwoni&abreve;cego &mdash; WitaLine nie pobiera opłat za samo połączenie.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">4. System prepaid i pakiety</h2>
            <p>4.1. Klient może dokupić pakiety minut oraz pakiety SMS/WhatsApp przez Stripe (karta kredytowa/debetowa, Blik). Minimalna kwota jednorazowej transakcji: 25 PLN.</p>
            <p>4.2. Pakiety minut s&abreve; doliczane do salda prepaid Klienta. Minuty s&abreve; potrącane z salda przy każdym połączeniu (jeśli Klient nie ma aktywnego abonamentu z wliczonymi minutami).</p>
            <p>4.3. Pakiety SMS/WhatsApp s&abreve; doliczane do odpowiednich sald. Wiadomości s&abreve; potrącane z salda przy każdej wysyłce.</p>
            <p>4.4. Niewykorzystane minuty, SMS-y i wiadomości WhatsApp z pakiet&oacute;w nie przepadaj&abreve; i s&abreve; ważne bezterminowo.</p>
            <p>4.5. W przypadku braku środk&oacute;w na saldzie, rozmowy s&abreve; blokowane. Wiadomości SMS/WhatsApp nie s&abreve; wysyłane.</p>
            <p>4.6. Po rozwiązaniu umowy, niewykorzystane środki z pakiet&oacute;w podlegaj&abreve; zwrotowi na wniosek Klienta, pomniejszone o koszty już zrealizowanych usług.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">5. Rejestracja i konto</h2>
            <p>5.1. Rejestracja odbywa się przez formularz na stronie witaline.pl. Klient podaje adres e-mail i ustanawia hasło.</p>
            <p>5.2. Klient zobowi&abreve;zuje się do podania prawdziwych danych oraz aktualizowania ich w przypadku zmian.</p>
            <p>5.3. Klient może posiadać tylko jedno konto. Każde konto może zarządzać wieloma firmami (oddziałami).</p>
            <p>5.4. Klient zobowi&abreve;zuje się do zachowania poufności hasła i nieudostępniania konta osobom trzecim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">6. Płatności</h2>
            <p>6.1. Opłaty abonamentowe pobierane s&abreve; z g&oacute;ry za każdy okres rozliczeniowy. Płatność realizowana przez Stripe &mdash; kart&abreve; kredytow&abreve;/debetow&abreve; lub Blik.</p>
            <p>6.2. Pakiety minut i SMS/WhatsApp s&abreve; płatne jednorazowo przy zakupie.</p>
            <p>6.3. W przypadku braku płatności abonamentu Usługodawca zawiesza świadczenie usług po 7 dniach od terminu płatności. Po 30 dniach konto zostaje usunięte wraz z danymi.</p>
            <p>6.4. Wszystkie ceny s&abreve; cenami netto. Do cen doliczany jest podatek VAT zgodnie z obowiązuj&abreve;cymi przepisami.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">7. Prawo odst&abreve;pienia od umowy</h2>
            <p>7.1. Klient będ&abreve;cy konsumentem ma prawo odst&abreve;pić od niniejszej umowy w terminie 14 dni od daty jej zawarcia bez podawania przyczyny.</p>
            <p>7.2. Aby skorzystać z prawa odst&abreve;pienia, Klient powinien wysłać jednoznaczne oświadczenie na adres e-mail: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a> lub za pośrednictwem panelu zarządzania.</p>
            <p>7.3. W przypadku odst&abreve;pienia, Usługodawca zwraca wszystkie otrzymane płatności niezwłocznie, nie p&oacute;źniej niż 14 dni od dnia otrzymania oświadczenia.</p>
            <p>7.4. Klient ponosi koszt za usługi faktycznie wykonane do momentu odst&abreve;pienia, proporcjonalnie do liczby dni korzystania.</p>
            <p>7.5. Prawo odst&abreve;pienia nie przysługuje Klientowi będ&abreve;cemu przedsiębiorc&abreve;.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">8. 30-dniowa gwarancja satysfakcji</h2>
            <p>8.1. Usługodawca udziela 30-dniowej gwarancji satysfakcji: jeśli w ciągu pierwszych 30 dni korzystania z usługi asystent nie zapisze ani jednego poprawnego kontaktu (leada) &mdash; Usługodawca zwraca 100% kwoty pierwszego abonamentu.</p>
            <p>8.2. Aby skorzystać z gwarancji, Klient zgłasza to przez panel lub e-mail: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a>.</p>
            <p>8.3. Gwarancja nie obejmuje przypadk&oacute;w, w kt&oacute;rych Klient nie skonfigurował poprawnie promptu lub bazy wiedzy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">9. Zasady korzystania z usługi</h2>
            <p>9.1. Klient zobowi&abreve;zuje się do niestosowania usługi w spos&oacute;b sprzeczny z prawem.</p>
            <p>9.2. W przypadku stwierdzenia nadużycia Usługodawca ma prawo natychmiastowo zablokować konto bez zwrotu środk&oacute;w.</p>
            <p>9.3. Klient ponosi odpowiedzialność za treść promptu systemowego oraz bazy wiedzy.</p>
            <p>9.4. Wiadomości SMS i WhatsApp wysyłane s&abreve; wyłącznie za zgod&abreve; odbiorcy. Klient zobowi&abreve;zuje się do przestrzegania przepis&oacute;w RODO oraz ustawy o świadczeniu usług drogą elektroniczn&abreve;.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">10. Odpowiedzialność</h2>
            <p>10.1. Usługodawca dołoży wszelkich starań, aby usługa działała bez przerw, jednak nie gwarantuje 100% dostępności.</p>
            <p>10.2. Ł&abreve;czna odpowiedzialność Usługodawcy ograniczona jest do wysokości opłaty za bieżący okres rozliczeniowy.</p>
            <p>10.3. Usługodawca nie ponosi odpowiedzialności za treść rozm&oacute;w wynikaj&abreve;c&abreve; z błędnie skonfigurowanego promptu lub bazy wiedzy.</p>
            <p>10.4. Usługodawca nie ponosi odpowiedzialności za utratę danych spowodowan&abreve; działaniem siły wyższej, błędem Klienta lub awari&abreve; dostawc&oacute;w zewnętrznych (Twilio, ElevenLabs, Stripe, Meta/WhatsApp).</p>
            <p>10.5. Usługodawca nie ponosi odpowiedzialności za niedostarczenie wiadomości SMS/WhatsApp spowodowane blokad&abreve; operatora, brakiem zasięgu lub polityk&abreve; Meta/WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">11. Ochrona danych i okres przechowywania</h2>
            <p>11.1. Administratorem danych osobowych jest WitaLine. Szczeg&oacute;łowe informacje w <Link href="/polityka-prywatnosci" className="text-brand-400 hover:underline">Polityce prywatności</Link>.</p>
            <p>11.2. Nagrania rozm&oacute;w i transkrypcje przechowywane maksymalnie 30 dni, po czym s&abreve; automatycznie usuwane.</p>
            <p>11.3. Historia wysłanych wiadomości SMS i WhatsApp przechowywana przez okres 12 miesięcy.</p>
            <p>11.4. Klient ma prawo w każdej chwili zażądać usunięcia danych przez panel (zakładka RODO).</p>
            <p>11.5. W przypadku usunięcia konta wszystkie dane s&abreve; trwale usuwane w ciągu 30 dni.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">12. Narzędzia systemowe (MCP) i automatyzacja</h2>
            <p>12.1. Asystent może korzystać z narzędzi MCP: wyszukiwanie firm, zapis danych kontaktowych, sprawdzanie termin&oacute;w, tworzenie rezerwacji, wysyłka wiadomości WhatsApp/SMS oraz przekazywanie rozm&oacute;w do konsultant&oacute;w.</p>
            <p>12.2. Każde użycie narzędzia jest logowane i widoczne w panelu zarządzania.</p>
            <p>12.3. WhatsApp oraz SMS s&abreve; wysyłane wyłącznie na wyraźne żądanie Klienta lub rozm&oacute;wcy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">13. Rollover minut &mdash; szczeg&oacute;ły</h2>
            <p>13.1. Niewykorzystane minuty z abonamentu przechodz&abreve; na kolejny miesi&abreve;c (rollover). Stan widoczny w panelu.</p>
            <p>13.2. Maksymalny stan rollover: 2× miesięcznego limitu. Nadwyżka przepada.</p>
            <p>13.3. Rollover naliczany automatycznie na koniec każdego okresu rozliczeniowego.</p>
            <p>13.4. Rollover nie dotyczy modelu elastycznego (pay-as-you-go).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">14. Rozwi&abreve;zanie umowy i usunięcie konta</h2>
            <p>14.1. Umowa na czas nieokreślony. Klient może wypowiedzieć w dowolnym momencie z poziomu panelu.</p>
            <p>14.2. Usunięcie konta skutkuje anulowaniem subskrypcji Stripe, usunięciem numeru telefonu oraz trwałym usunięciem danych.</p>
            <p>14.3. Niewykorzystane środki z pakiet&oacute;w podlegaj&abreve; zwrotowi w 14 dni od zamknięcia konta.</p>
            <p>14.4. Usługodawca może rozwiązać umowę z 30-dniowym okresem wypowiedzenia w przypadku naruszenia Regulaminu.</p>
            <p>14.5. Po 30 dniach braku płatności konto zostaje automatycznie usunięte wraz z danymi.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">15. Postanowienia końcowe</h2>
            <p>15.1. Usługodawca zastrzega sobie prawo do zmiany Regulaminu. Klient powiadomiony e-mailem na 14 dni przed zmian&abreve;.</p>
            <p>15.2. W przypadku braku akceptacji zmian Klient ma prawo wypowiedzieć umowę przed dniem wejścia w życie zmian.</p>
            <p>15.3. Spory rozstrzygane przez sąd właściwy dla siedziby Usługodawcy.</p>
            <p>15.4. Regulamin wchodzi w życie z dniem 1 lipca 2026 roku.</p>
            <p className="mt-6 text-zinc-400 text-xs">Data ostatniej aktualizacji: 1 lipca 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
