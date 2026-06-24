import type { Metadata } from "next";
import Link from "next/link";
import { ELASTIC_TIERS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Regulamin — WitaLine",
  description: "Regulamin świadczenia usług WitaLine — asystent AI, SMS, pakiety minut.",
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
            <p>1.1. Niniejszy regulamin określa zasady świadczenia usług asystenta AI oraz komunikacji SMS przez WitaLine (zwaną dalej &bdquo;Usługodawc&abreve;").</p>
            <p>1.2. Usługodawc&abreve; jest firma WitaLine. Kontakt: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a>, telefon: +48 732 125 752.</p>
            <p>1.3. Usługa polega na udostępnieniu Klientowi automatycznej recepcji (asystenta głosowego AI), który odbiera połączenia telefoniczne, prowadzi rozmowy, umawia wizyty, przyjmuje zamówienia, wysyła powiadomienia SMS oraz udostępnia transkrypcje, nagrania i statystyki w panelu zarządzania.</p>
            <p>1.4. Przed rozpoczęciem korzystania z usługi Klient zobowi&abreve;zany jest zapoznać się z treścią Regulaminu oraz Polityk&abreve; prywatności.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">2. Definicje</h2>
            <p>2.1. <strong>Klient</strong> &mdash; osoba fizyczna prowadz&abreve;ca działalność gospodarcz&abreve;, osoba prawna lub jednostka organizacyjna nieposiadaj&abreve;ca osobowości prawnej, kt&oacute;ra zawarła umowę z Usługodawc&abreve;.</p>
            <p>2.2. <strong>Okres rozliczeniowy</strong> &mdash; jeden miesi&abreve;c kalendarzowy.</p>
            <p>2.3. <strong>Pakiet minut</strong> &mdash; jednorazowy zakup minut rozmowy przez Stripe, doliczany do salda prepaid Klienta. Minuty ważne bezterminowo.</p>
            <p>2.4. <strong>Pakiet SMS</strong> &mdash; jednorazowy zakup wiadomości SMS przez Stripe, doliczany do salda SMS Klienta.</p>
            <p>2.5. <strong>Numer dedykowany</strong> &mdash; polski numer telefonu (+48) przypisany do konta Klienta.</p>
            <p>2.6. <strong>Wiadomość SMS</strong> &mdash; wiadomość tekstowa wysłana za pośrednictwem Twilio API na numer telefonu kom&oacute;rkowego.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">3. Rodzaje plan&oacute;w i cennik</h2>
            <p>3.1. WitaLine oferuje model elastyczny (pay-as-you-go) rozliczeń za minutę rozmowy asystenta AI:</p>

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
            <p className="mt-2">Klient może w każdej chwili dokupić pakiety minut przez Stripe (płatność jednorazowa). Minuty nie przepadaj&abreve; i s&abreve; ważne bezterminowo.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">B. Dodatki opcjonalne (ceny brutto/mies)</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Własny numer +48:</strong> 36 PLN</li>
              <li><strong>Google Calendar:</strong> 23 PLN</li>
              <li><strong>Integracja CRM:</strong> 60 PLN (HubSpot, Livespace, Pipedrive)</li>
              <li><strong>Klon głosu:</strong> 60 PLN</li>
              <li><strong>Nielimitowani konsultanci:</strong> 60 PLN</li>
              <li><strong>Priorytetowe wsparcie:</strong> 36 PLN</li>
              <li><strong>SLA 24/7:</strong> 122 PLN</li>
            </ul>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">D. Usługa SMS</h3>
            <p>WitaLine umożliwia wysyłkę wiadomości SMS za pośrednictwem Twilio API. Cena SMS zależy od stawki za minutę (niższa stawka = niższa cena SMS):</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>0,50 PLN netto / 0,62 PLN brutto SMS (przy stawce 1,20 PLN/min)</li>
              <li>0,46 PLN netto / 0,57 PLN brutto SMS (przy stawce 1,10 PLN/min)</li>
              <li>0,42 PLN netto / 0,52 PLN brutto SMS (przy stawce 1,00 PLN/min)</li>
              <li>Pakiety SMS (jednorazowy zakup przez Stripe, ceny brutto):
                <ul className="list-disc pl-6 mt-1 space-y-0.5">
                  <li>50 SMS &mdash; 31 PLN</li>
                  <li>100 SMS &mdash; 56 PLN</li>
                  <li>200 SMS &mdash; 99 PLN</li>
                  <li>500 SMS &mdash; 217 PLN</li>
                  <li>1 000 SMS &mdash; 371 PLN</li>
                </ul>
              </li>
            </ul>
            <p className="mt-2">Cena SMS dotyczy wyłącznie wiadomości wysłanych przez asystenta AI (automatycznie po rozmowie). Niewykorzystane SMS-y z pakietu nie przepadaj&abreve;.</p>

            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">E. Płatności wielowalutowe</h3>
            <p>WitaLine akceptuje płatności w walutach PLN, EUR i USD. Ceny w EUR i USD s&abreve; przeliczane według kursu: 1 EUR = 4,35 PLN, 1 USD = 3,85 PLN. Kursy mog&abreve; ulegać zmianie &mdash; aktualny kurs widoczny w panelu płatności Stripe.</p>

            <p className="mt-4 text-xs text-zinc-400">Wszystkie ceny podane s&abreve; w PLN brutto (z VAT 23%), chyba że wskazano inaczej. Dla firm UE z ważnym VAT-UE stosuje się 0% (odwrotne obci&abreve;żenie).</p>
            <p className="mt-2">3.2. Klient może zmienić plan lub dokupić pakiet w dowolnym momencie z poziomu panelu zarządzania.</p>
            <p>3.3. Połączenie na numer WitaLine (+48 732 125 752) jest standardowym połączeniem na numer kom&oacute;rkowy. Koszt połączenia zależy od taryfy operatora dzwoni&abreve;cego &mdash; WitaLine nie pobiera opłat za samo połączenie.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">4. System prepaid i pakiety</h2>
            <p>4.1. Klient może dokupić pakiety minut oraz pakiety SMS przez Stripe (karta kredytowa/debetowa, Blik). Minimalna kwota jednorazowej transakcji: 25 PLN.</p>
            <p>4.2. Pakiety minut s&abreve; doliczane do salda prepaid Klienta. Minuty s&abreve; potrącane z salda przy każdym połączeniu.</p>
            <p>4.3. Pakiety SMS s&abreve; doliczane do salda SMS. Wiadomości s&abreve; potrącane z salda przy każdej wysyłce.</p>
            <p>4.4. Niewykorzystane minuty i SMS-y z pakiet&oacute;w nie przepadaj&abreve; i s&abreve; ważne bezterminowo. Można je sumować z nowymi zakupami.</p>
            <p>4.5. W przypadku braku środk&oacute;w na saldzie, rozmowy s&abreve; blokowane. Wiadomości SMS nie s&abreve; wysyłane. System wyświetla alerty przy saldzie poniżej 50 minut i 20 SMS.</p>
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
            <p>6.1. Płatność za pakiety minut oraz SMS realizowana jest przez Stripe &mdash; kart&abreve; kredytow&abreve;/debetow&abreve; lub Blik. Płatność jednorazowa przy zakupie pakietu.</p>
            <p>6.2. Pakiety minut i SMS s&abreve; płatne jednorazowo przy zakupie. Brak abonament&oacute;w i płatności cyklicznych.</p>
            <p>6.3. W przypadku braku środk&oacute;w na saldzie prepaid rozmowy s&abreve; blokowane. Po 30 dniach braku aktywności konto zostaje usunięte wraz z danymi.</p>
            <p>6.4. Wszystkie ceny podane na stronie witaline.pl s&abreve; cenami brutto (z VAT 23%).</p>
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
            <p>8.1. Usługodawca udziela 30-dniowej gwarancji satysfakcji: jeśli w ciągu pierwszych 30 dni korzystania z usługi asystent nie zapisze ani jednego poprawnego kontaktu (leada) &mdash; Usługodawca zwraca 100% pierwszej wpłaty.</p>
            <p>8.2. Aby skorzystać z gwarancji, Klient zgłasza to przez panel lub e-mail: <a href="mailto:kontakt@witaline.pl" className="text-brand-400 hover:underline">kontakt@witaline.pl</a>.</p>
            <p>8.3. Gwarancja nie obejmuje przypadk&oacute;w, w kt&oacute;rych Klient nie skonfigurował poprawnie promptu lub bazy wiedzy.</p>
            <p>8.4. Zwrot realizowany jest na konto Stripe Klienta w ciągu 14 dni od potwierdzenia spełnienia warunk&oacute;w gwarancji.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">9. Zasady korzystania z usługi</h2>
            <p>9.1. Klient zobowi&abreve;zuje się do niestosowania usługi w spos&oacute;b sprzeczny z prawem.</p>
            <p>9.2. W przypadku stwierdzenia nadużycia Usługodawca ma prawo natychmiastowo zablokować konto bez zwrotu środk&oacute;w.</p>
            <p>9.3. Klient ponosi odpowiedzialność za treść promptu systemowego oraz bazy wiedzy.</p>
            <p>9.4. Wiadomości SMS wysyłane s&abreve; wyłącznie za zgod&abreve; odbiorcy. Klient zobowi&abreve;zuje się do przestrzegania przepis&oacute;w RODO oraz ustawy o świadczeniu usług drogą elektroniczn&abreve;.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">10. Odpowiedzialność</h2>
            <p>10.1. Usługodawca dołoży wszelkich starań, aby usługa działała bez przerw, jednak nie gwarantuje 100% dostępności.</p>
            <p>10.2. Ł&abreve;czna odpowiedzialność Usługodawcy ograniczona jest do wysokości opłaty za bieżący okres rozliczeniowy.</p>
            <p>10.3. Usługodawca nie ponosi odpowiedzialności za treść rozm&oacute;w wynikaj&abreve;c&abreve; z błędnie skonfigurowanego promptu lub bazy wiedzy.</p>
            <p>10.4. Usługodawca nie ponosi odpowiedzialności za utratę danych spowodowan&abreve; działaniem siły wyższej, błędem Klienta lub awari&abreve; dostawc&oacute;w zewnętrznych (Twilio, ElevenLabs, Stripe).</p>
            <p>10.5. Usługodawca nie ponosi odpowiedzialności za niedostarczenie wiadomości SMS spowodowane blokad&abreve; operatora, brakiem zasięgu lub błędem w numerze adresata.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">11. Ochrona danych i okres przechowywania</h2>
            <p>11.1. Administratorem danych osobowych jest WitaLine. Szczeg&oacute;łowe informacje w <Link href="/polityka-prywatnosci" className="text-brand-400 hover:underline">Polityce prywatności</Link>.</p>
            <p>11.2. Nagrania rozm&oacute;w i transkrypcje przechowywane maksymalnie 30 dni, po czym s&abreve; automatycznie usuwane.</p>
            <p>11.3. Historia wysłanych wiadomości SMS przechowywana przez okres 12 miesięcy.</p>
            <p>11.4. Klient ma prawo w każdej chwili zażądać usunięcia danych przez panel (zakładka RODO).</p>
            <p>11.5. W przypadku usunięcia konta wszystkie dane s&abreve; trwale usuwane w ciągu 30 dni.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">12. Narzędzia systemowe (MCP) i automatyzacja</h2>
            <p>12.1. Asystent może korzystać z narzędzi MCP: wyszukiwanie firm, zapis danych kontaktowych, sprawdzanie termin&oacute;w, tworzenie rezerwacji, wysyłka wiadomości SMS oraz przekazywanie rozm&oacute;w do konsultant&oacute;w.</p>
            <p>12.2. Każde użycie narzędzia jest logowane i widoczne w panelu zarządzania.</p>
            <p>12.3. Wiadomości SMS wysyłane s&abreve; wyłącznie na wyraźne żądanie Klienta lub rozm&oacute;wcy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">13. Rozwi&abreve;zanie umowy i usunięcie konta</h2>
            <p>13.1. Umowa na czas nieokreślony. Klient może wypowiedzieć w dowolnym momencie z poziomu panelu.</p>
            <p>13.2. Usunięcie konta skutkuje anulowaniem integracji Stripe, usunięciem numeru telefonu oraz trwałym usunięciem danych.</p>
            <p>13.3. Niewykorzystane środki z pakiet&oacute;w podlegaj&abreve; zwrotowi w 14 dni od zamknięcia konta.</p>
            <p>13.4. Usługodawca może rozwiązać umowę z 30-dniowym okresem wypowiedzenia w przypadku naruszenia Regulaminu.</p>
            <p>13.5. Po 30 dniach braku aktywności konto zostaje automatycznie usunięte wraz z danymi.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">14. Postanowienia końcowe</h2>
            <p>14.1. Usługodawca zastrzega sobie prawo do zmiany Regulaminu. Klient powiadomiony e-mailem 14 dni przed zmian&abreve;.</p>
            <p>14.2. W przypadku braku akceptacji zmian Klient ma prawo wypowiedzieć umowę przed dniem wejścia w życie zmian.</p>
            <p>14.3. Spory rozstrzygane przez sąd właściwy dla siedziby Usługodawcy.</p>
            <p>14.4. Regulamin wchodzi w życie z dniem 1 lipca 2026 roku.</p>
            <p className="mt-6 text-zinc-400 text-xs">Data ostatniej aktualizacji: 24 czerwca 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
