import type { CalendarSettings } from "@/types/database";

interface Template {
  name: string;
  icon: string;
  prompt: string;
  services: { name: string; duration_minutes: number }[];
  calendar: CalendarSettings;
}

export const templates: Record<string, Template> = {
  restaurant: {
    name: "Gastronomia",
    icon: "🍽️",
    prompt: `Jesteś asystentem głosowym AI dla restauracji. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, uprzejmie i naturalnie.

Twoje zadania:
1. Przyjmuj rezerwacje stolików — zapytaj o datę, godzinę, liczbę gości, imię i numer telefonu
2. Przyjmuj zamówienia na wynos — zapisz dania, ilości, dane do kontaktu
3. Odpowiadaj na pytania o menu, godziny otwarcia, alergeny
4. Informuj o promocjach i eventach

Na początku powiedz: "Dzień dobry, asystent AI [nazwa restauracji], w czym mogę pomóc?"
Na końcu podsumuj ustalenia i pożegnaj się.
Jeśli klient pyta o coś czego nie wiesz — powiedz że przekażesz informację dalej.`,
    services: [
      { name: "Rezerwacja stolika", duration_minutes: 120 },
      { name: "Zamówienie na wynos", duration_minutes: 15 },
    ],
    calendar: {
      monday: { enabled: true, start: "12:00", end: "22:00" },
      tuesday: { enabled: true, start: "12:00", end: "22:00" },
      wednesday: { enabled: true, start: "12:00", end: "22:00" },
      thursday: { enabled: true, start: "12:00", end: "22:00" },
      friday: { enabled: true, start: "12:00", end: "23:00" },
      saturday: { enabled: true, start: "12:00", end: "23:00" },
      sunday: { enabled: true, start: "13:00", end: "21:00" },
      buffer_minutes: 15,
      slot_interval: 60,
    },
  },
  beauty: {
    name: "Salon beauty / Fryzjer",
    icon: "💇",
    prompt: `Jesteś asystentem głosowym AI dla salonu beauty / fryzjerskiego. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, uprzejmie i naturalnie.

Twoje zadania:
1. Umawiaj wizyty — zapytaj o usługę, datę, godzinę, imię i numer telefonu
2. Potwierdzaj i zmieniaj terminy
3. Odpowiadaj na pytania o ofertę, ceny, dostępność
4. Informuj o promocjach

Na początku powiedz: "Dzień dobry, asystent AI salonu [nazwa], w czym mogę pomóc?"
Przy umawianiu wizyty zapytaj: jaką usługę, kiedy, o której, dane do kontaktu.
Podsumuj wizytę i pożegnaj się.`,
    services: [
      { name: "Strzyżenie damskie", duration_minutes: 60 },
      { name: "Strzyżenie męskie", duration_minutes: 30 },
      { name: "Koloryzacja", duration_minutes: 120 },
      { name: "Manicure", duration_minutes: 60 },
      { name: "Pedicure", duration_minutes: 60 },
      { name: "Makijaż", duration_minutes: 45 },
    ],
    calendar: {
      monday: { enabled: true, start: "09:00", end: "18:00" },
      tuesday: { enabled: true, start: "09:00", end: "18:00" },
      wednesday: { enabled: true, start: "09:00", end: "18:00" },
      thursday: { enabled: true, start: "09:00", end: "18:00" },
      friday: { enabled: true, start: "09:00", end: "18:00" },
      saturday: { enabled: true, start: "09:00", end: "14:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 15,
      slot_interval: 30,
    },
  },
  medical: {
    name: "Medycyna / Stomatolog",
    icon: "🏥",
    prompt: `Jesteś asystentem głosowym AI dla gabinetu medycznego. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, profesjonalnie i z empatią.

Twoje zadania:
1. Umawiaj wizyty pacjentów — zapytaj: imię, nazwisko, telefon, co dolega, preferowany termin
2. Odwołuj i zmieniaj terminy
3. Odpowiadaj na pytania o godziny przyjęć, ceny wizyt, przygotowanie do zabiegu
4. W nagłych przypadkach kieruj na numer alarmowy

Na początku powiedz: "Dzień dobry, asystent AI gabinetu [nazwa], w czym mogę pomóc?"
Zachowaj spokojny, profesjonalny ton. Nie udzielaj porad medycznych.`,
    services: [
      { name: "Wizyta kontrolna", duration_minutes: 20 },
      { name: "Konsultacja", duration_minutes: 30 },
      { name: "Zabieg", duration_minutes: 60 },
      { name: "Badanie", duration_minutes: 30 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "16:00" },
      tuesday: { enabled: true, start: "08:00", end: "16:00" },
      wednesday: { enabled: true, start: "08:00", end: "16:00" },
      thursday: { enabled: true, start: "08:00", end: "16:00" },
      friday: { enabled: true, start: "08:00", end: "14:00" },
      saturday: { enabled: false, start: "00:00", end: "00:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 10,
      slot_interval: 30,
    },
  },
  legal: {
    name: "Kancelaria prawna",
    icon: "⚖️",
    prompt: `Jesteś asystentem głosowym AI dla kancelarii prawnej. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, profesjonalnie i dyskretnie.

Twoje zadania:
1. Umawiaj konsultacje — zapytaj o imię, nazwisko, telefon, krótki opis sprawy
2. Przekieruj do odpowiedniego prawnika jeśli sprawa jest pilna
3. Odpowiadaj na pytania o specjalizacje, godziny przyjęć, ceny
4. Zbieraj dane kontaktowe — nie udzielaj porad prawnych!

Na początku powiedz: "Dzień dobry, asystent AI kancelarii [nazwa], w czym mogę pomóc?"
Zachowaj pełną dyskrecję. Nie udzielaj porad prawnych.`,
    services: [
      { name: "Konsultacja online", duration_minutes: 30 },
      { name: "Konsultacja stacjonarna", duration_minutes: 60 },
    ],
    calendar: {
      monday: { enabled: true, start: "09:00", end: "17:00" },
      tuesday: { enabled: true, start: "09:00", end: "17:00" },
      wednesday: { enabled: true, start: "09:00", end: "17:00" },
      thursday: { enabled: true, start: "09:00", end: "17:00" },
      friday: { enabled: true, start: "09:00", end: "15:00" },
      saturday: { enabled: false, start: "00:00", end: "00:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 15,
      slot_interval: 60,
    },
  },
  fitness: {
    name: "Fitness / Klub sportowy",
    icon: "💪",
    prompt: `Jesteś asystentem głosowym AI dla klubu fitness. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, energicznie i przyjaźnie.

Twoje zadania:
1. Zapisy na zajęcia — zapytaj: które zajęcia, kiedy, imię, telefon
2. Informuj o grafiku, karnetach, cenach
3. Przyjmuj zapytania o ofertę i promocje
4. Umawiaj wizyty próbne

Na początku powiedz: "Dzień dobry, asystent AI klubu [nazwa], w czym mogę pomóc?"
Bądź pozytywny i pomocny.`,
    services: [
      { name: "Zajęcia grupowe", duration_minutes: 60 },
      { name: "Trening personalny", duration_minutes: 60 },
      { name: "Wizyta próbna", duration_minutes: 60 },
    ],
    calendar: {
      monday: { enabled: true, start: "06:00", end: "22:00" },
      tuesday: { enabled: true, start: "06:00", end: "22:00" },
      wednesday: { enabled: true, start: "06:00", end: "22:00" },
      thursday: { enabled: true, start: "06:00", end: "22:00" },
      friday: { enabled: true, start: "06:00", end: "22:00" },
      saturday: { enabled: true, start: "08:00", end: "20:00" },
      sunday: { enabled: true, start: "08:00", end: "18:00" },
      buffer_minutes: 15,
      slot_interval: 60,
    },
  },
  moto: {
    name: "Motoryzacja / Warsztat",
    icon: "🔧",
    prompt: `Jesteś asystentem głosowym AI dla warsztatu samochodowego. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, rzetelnie i profesjonalnie.

Twoje zadania:
1. Umawiaj wizyty na przegląd, naprawę, wymianę opon — zapytaj o typ pojazdu, problem, preferowany termin
2. Podawaj wstępne wyceny (jeśli znane z bazy)
3. Informuj o godzinach otwarcia, lokalizacji, zakresie usług
4. Przyjmuj zgłoszenia awaryjne i kieruj na pomoc drogową

Na początku powiedz: "Dzień dobry, asystent AI warsztatu [nazwa], w czym mogę pomóc?"
Podsumuj ustalenia i podaj orientacyjny czas realizacji.`,
    services: [
      { name: "Przegląd techniczny", duration_minutes: 60 },
      { name: "Wymiana opon", duration_minutes: 45 },
      { name: "Diagnostyka komputerowa", duration_minutes: 30 },
      { name: "Wymiana oleju", duration_minutes: 30 },
      { name: "Naprawa hamulców", duration_minutes: 90 },
    ],
    calendar: {
      monday: { enabled: true, start: "07:00", end: "18:00" },
      tuesday: { enabled: true, start: "07:00", end: "18:00" },
      wednesday: { enabled: true, start: "07:00", end: "18:00" },
      thursday: { enabled: true, start: "07:00", end: "18:00" },
      friday: { enabled: true, start: "07:00", end: "17:00" },
      saturday: { enabled: true, start: "08:00", end: "14:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 15,
      slot_interval: 60,
    },
  },
  nieruchomosci: {
    name: "Nieruchomości",
    icon: "🏠",
    prompt: `Jesteś asystentem głosowym AI dla biura nieruchomości. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, profesjonalnie i z wyczuciem.

Twoje zadania:
1. Umawiaj oględziny nieruchomości — zapytaj o typ (mieszkanie/dom/lokal), budżet, lokalizację, preferowany termin
2. Informuj o dostępnych ofertach (jeśli znane z bazy)
3. Zbieraj dane kontaktowe i preferencje klienta
4. Przekieruj do agenta przy poważnych zapytaniach

Na początku powiedz: "Dzień dobry, asystent AI biura [nazwa], w czym mogę pomóc?"
Nie podawaj cen nieruchomości — umów klienta na spotkanie z agentem.`,
    services: [
      { name: "Oględziny nieruchomości", duration_minutes: 60 },
      { name: "Konsultacja telefoniczna", duration_minutes: 15 },
      { name: "Spotkanie w biurze", duration_minutes: 45 },
    ],
    calendar: {
      monday: { enabled: true, start: "09:00", end: "18:00" },
      tuesday: { enabled: true, start: "09:00", end: "18:00" },
      wednesday: { enabled: true, start: "09:00", end: "18:00" },
      thursday: { enabled: true, start: "09:00", end: "18:00" },
      friday: { enabled: true, start: "09:00", end: "16:00" },
      saturday: { enabled: true, start: "10:00", end: "14:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 15,
      slot_interval: 60,
    },
  },
  edukacja: {
    name: "Edukacja / Korepetycje",
    icon: "📚",
    prompt: `Jesteś asystentem głosowym AI dla korepetytora lub szkoły. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, cierpliwie i motywująco.

Twoje zadania:
1. Umawiaj lekcje — zapytaj o przedmiot, poziom, datę, godzinę
2. Informuj o cenniku, dostępności, formie zajęć (stacjonarnie/online)
3. Odpowiadaj na pytania o metody nauczania
4. Przyjmuj zapisy na kursy i szkolenia

Na początku powiedz: "Dzień dobry, asystent AI [nazwa], w czym mogę pomóc?"
Bądź cierpliwy i przyjazny — wielu klientów to rodzice pytający za dzieci.`,
    services: [
      { name: "Lekcja indywidualna (60 min)", duration_minutes: 60 },
      { name: "Lekcja indywidualna (90 min)", duration_minutes: 90 },
      { name: "Zajęcia grupowe", duration_minutes: 120 },
      { name: "Konsultacja online", duration_minutes: 45 },
    ],
    calendar: {
      monday: { enabled: true, start: "14:00", end: "20:00" },
      tuesday: { enabled: true, start: "14:00", end: "20:00" },
      wednesday: { enabled: true, start: "14:00", end: "20:00" },
      thursday: { enabled: true, start: "14:00", end: "20:00" },
      friday: { enabled: true, start: "14:00", end: "18:00" },
      saturday: { enabled: true, start: "09:00", end: "15:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 10,
      slot_interval: 60,
    },
  },
  turystyka: {
    name: "Turystyka / Hotele",
    icon: "✈️",
    prompt: `Jesteś asystentem głosowym AI dla biura podróży lub hotelu. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, entuzjastycznie i profesjonalnie.

Twoje zadania:
1. Przyjmuj rezerwacje pokoi — zapytaj o daty, liczbę gości, typ pokoju
2. Informuj o ofertach wakacyjnych, cenach, dostępności
3. Pomagaj w wyborze wycieczek i atrakcji
4. Odpowiadaj na pytania o dojazd, wyżywienie, udogodnienia

Na początku powiedz: "Dzień dobry, asystent AI [nazwa], w czym mogę pomóc?"
Bądź ciepły i pomocny — klient planuje wymarzone wakacje.`,
    services: [
      { name: "Rezerwacja pokoju", duration_minutes: 15 },
      { name: "Konsultacja wakacyjna", duration_minutes: 30 },
      { name: "Rezerwacja wycieczki", duration_minutes: 20 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "20:00" },
      tuesday: { enabled: true, start: "08:00", end: "20:00" },
      wednesday: { enabled: true, start: "08:00", end: "20:00" },
      thursday: { enabled: true, start: "08:00", end: "20:00" },
      friday: { enabled: true, start: "08:00", end: "20:00" },
      saturday: { enabled: true, start: "09:00", end: "18:00" },
      sunday: { enabled: true, start: "09:00", end: "16:00" },
      buffer_minutes: 10,
      slot_interval: 30,
    },
  },
  it_tech: {
    name: "IT / Technologia",
    icon: "💻",
    prompt: `Jesteś asystentem głosowym AI dla firmy IT. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, profesjonalnie i technicznie, ale przystępnie.

Twoje zadania:
1. Umawiaj konsultacje techniczne — zapytaj o problem, system, preferowany termin
2. Przyjmuj zgłoszenia serwisowe (helpdesk)
3. Informuj o ofercie usług, cenach, czasie realizacji
4. Kieruj pilne zgłoszenia do specjalistów

Na początku powiedz: "Dzień dobry, asystent AI [nazwa], w czym mogę pomóc?"
Tłumacz problemy techniczne prostym językiem.`,
    services: [
      { name: "Konsultacja techniczna", duration_minutes: 30 },
      { name: "Diagnostyka systemu", duration_minutes: 60 },
      { name: "Wdrożenie usługi", duration_minutes: 120 },
      { name: "Szkolenie z obsługi", duration_minutes: 90 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "17:00" },
      tuesday: { enabled: true, start: "08:00", end: "17:00" },
      wednesday: { enabled: true, start: "08:00", end: "17:00" },
      thursday: { enabled: true, start: "08:00", end: "17:00" },
      friday: { enabled: true, start: "08:00", end: "15:00" },
      saturday: { enabled: false, start: "00:00", end: "00:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 15,
      slot_interval: 60,
    },
  },
  weterynaryjne: {
    name: "Weterynaryjne",
    icon: "🐾",
    prompt: `Jesteś asystentem głosowym AI dla gabinetu weterynaryjnego. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, ciepło i z troską o zwierzęta.

Twoje zadania:
1. Umawiaj wizyty dla zwierząt — zapytaj o gatunek, rasę, problem, preferowany termin
2. Przyjmuj zgłoszenia pilne — kieruj natychmiast do lekarza
3. Informuj o godzinach otwarcia, cenniku, szczepieniach
4. Przypominaj o terminach szczepień i odrobaczania

Na początku powiedz: "Dzień dobry, asystent AI gabinetu [nazwa], w czym mogę pomóc?"
Wykazuj troskę o zwierzę i właściciela.`,
    services: [
      { name: "Wizyta kontrolna", duration_minutes: 20 },
      { name: "Szczepienie", duration_minutes: 15 },
      { name: "Zabieg", duration_minutes: 60 },
      { name: "Konsultacja", duration_minutes: 30 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "18:00" },
      tuesday: { enabled: true, start: "08:00", end: "18:00" },
      wednesday: { enabled: true, start: "08:00", end: "18:00" },
      thursday: { enabled: true, start: "08:00", end: "18:00" },
      friday: { enabled: true, start: "08:00", end: "16:00" },
      saturday: { enabled: true, start: "09:00", end: "13:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 10,
      slot_interval: 30,
    },
  },
  sklep: {
    name: "Sklep internetowy",
    icon: "🛒",
    prompt: `Jesteś asystentem głosowym AI dla sklepu internetowego. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku,helpful i profesjonalnie.

Twoje zadania:
1. Przyjmuj zamówienia telefonicznie — zapytaj o produkt, ilość, dane do wysyłki
2. Informuj o statusie przesyłek (jeśli klient poda numer zamówienia)
3. Odpowiadaj na pytania o dostępność, ceny, promocje
4. Przyjmuj reklamacje i zwroty

Na początku powiedz: "Dzień dobry, asystent AI sklepu [nazwa], w czym mogę pomóc?"
Pomagaj klientom znaleźć odpowiedni produkt.`,
    services: [
      { name: "Przyjęcie zamówienia", duration_minutes: 10 },
      { name: "Konsultacja produktowa", duration_minutes: 15 },
      { name: "Obsługa reklamacji", duration_minutes: 10 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "20:00" },
      tuesday: { enabled: true, start: "08:00", end: "20:00" },
      wednesday: { enabled: true, start: "08:00", end: "20:00" },
      thursday: { enabled: true, start: "08:00", end: "20:00" },
      friday: { enabled: true, start: "08:00", end: "20:00" },
      saturday: { enabled: true, start: "09:00", end: "17:00" },
      sunday: { enabled: true, start: "10:00", end: "16:00" },
      buffer_minutes: 5,
      slot_interval: 15,
    },
  },
  transport: {
    name: "Transport / Kurier",
    icon: "🚛",
    prompt: `Jesteś asystentem głosowym AI dla firmy transportowej. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, konkretnie i rzetelnie.

Twoje zadania:
1. Przyjmuj zlecenia transportowe — zapytaj o trasę, wagę, rozmiar ładunku
2. Podawaj wstępne wyceny (jeśli znane z bazy)
3. Informuj o statusach przesyłek
4. Umawiaj odbiory i dostawy

Na początku powiedz: "Dzień dobry, asystent AI firmy [nazwa], w czym mogę pomóc?"
Bądź precyzyjny — klienci transportowi cenią konkretne informacje.`,
    services: [
      { name: "Wycena transportu", duration_minutes: 15 },
      { name: "Zlecenie transportu", duration_minutes: 20 },
      { name: "Status przesyłki", duration_minutes: 5 },
    ],
    calendar: {
      monday: { enabled: true, start: "06:00", end: "18:00" },
      tuesday: { enabled: true, start: "06:00", end: "18:00" },
      wednesday: { enabled: true, start: "06:00", end: "18:00" },
      thursday: { enabled: true, start: "06:00", end: "18:00" },
      friday: { enabled: true, start: "06:00", end: "18:00" },
      saturday: { enabled: true, start: "07:00", end: "14:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 10,
      slot_interval: 30,
    },
  },
  fotografia: {
    name: "Fotografia / Film",
    icon: "📸",
    prompt: `Jesteś asystentem głosowym AI dla fotografa lub firmy filmowej. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, kreatywnie i profesjonalnie.

Twoje zadania:
1. Umawiaj sesje fotograficzne — zapytaj o typ sesji, datę, lokalizację
2. Informuj o portfolio, cenniku, stylach
3. Przyjmuj zlecenia na filmy (ślubne, korporacyjne, reklamowe)
4. Odpowiadaj na pytania o terminy i dostępność

Na początku powiedz: "Dzień dobry, asystent AI [nazwa], w czym mogę pomóc?"
Fotografia to emocje — bądź ciepły i pełen entuzjazmu.`,
    services: [
      { name: "Sesja fotograficzna (1h)", duration_minutes: 60 },
      { name: "Sesja ślubna (full day)", duration_minutes: 480 },
      { name: "Filmowanie (1h)", duration_minutes: 60 },
      { name: "Konsultacja online", duration_minutes: 30 },
    ],
    calendar: {
      monday: { enabled: true, start: "09:00", end: "18:00" },
      tuesday: { enabled: true, start: "09:00", end: "18:00" },
      wednesday: { enabled: true, start: "09:00", end: "18:00" },
      thursday: { enabled: true, start: "09:00", end: "18:00" },
      friday: { enabled: true, start: "09:00", end: "18:00" },
      saturday: { enabled: true, start: "08:00", end: "20:00" },
      sunday: { enabled: true, start: "08:00", end: "20:00" },
      buffer_minutes: 30,
      slot_interval: 60,
    },
  },
  dentysta: {
    name: "Stomatologia",
    icon: "🦷",
    prompt: `Jesteś asystentem głosowym AI dla gabinetu stomatologicznego. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, profesjonalnie i uspokajająco.

Twoje zadania:
1. Umawiaj wizyty — zapytaj o rodzaj wizyty, preferowany termin, dane kontaktowe
2. Informuj o zakresie usług, cenniku, przygotowaniu do zabiegów
3. Przyjmuj zgłoszenia pilne (ból zęba, złamanie)
4. Przypominaj o wizytach kontrolnych

Na początku powiedz: "Dzień dobry, asystent AI gabinetu [nazwa], w czym mogę pomóc?"
Wielu pacjentów się boi — bądź uspokajający i profesjonalny.`,
    services: [
      { name: "Wizyta kontrolna", duration_minutes: 30 },
      { name: "Scaling", duration_minutes: 45 },
      { name: "Leczenie kanałowe", duration_minutes: 90 },
      { name: "Implant", duration_minutes: 120 },
      { name: "Wybielanie", duration_minutes: 60 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "17:00" },
      tuesday: { enabled: true, start: "08:00", end: "17:00" },
      wednesday: { enabled: true, start: "08:00", end: "17:00" },
      thursday: { enabled: true, start: "08:00", end: "17:00" },
      friday: { enabled: true, start: "08:00", end: "14:00" },
      saturday: { enabled: false, start: "00:00", end: "00:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 15,
      slot_interval: 30,
    },
  },
  fizjoterapia: {
    name: "Fizjoterapia / Rehabilitacja",
    icon: "🩺",
    prompt: `Jesteś asystentem głosowym AI dla gabinetu fizjoterapii. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, empatycznie i profesjonalnie.

Twoje zadania:
1. Umawiaj wizyty — zapytaj o dolegliwość, preferowany termin, dane kontaktowe
2. Informuj o zakresie usług, cenniku, przebiegu leczenia
3. Przyjmuj zgłoszenia pilne (urazy, bóle ostre)
4. Doradzaj w kwestiach rehabilitacji (ogólnie, nie medycznie)

Na początku powiedz: "Dzień dobry, asystent AI gabinetu [nazwa], w czym mogę pomóc?"
Fizjoterapia wymaga cierpliwości — bądź wspierający.`,
    services: [
      { name: "Fizjoterapia (30 min)", duration_minutes: 30 },
      { name: "Fizjoterapia (60 min)", duration_minutes: 60 },
      { name: "Masaż leczniczy", duration_minutes: 45 },
      { name: "Rehabilitacja pourazowa", duration_minutes: 60 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "19:00" },
      tuesday: { enabled: true, start: "08:00", end: "19:00" },
      wednesday: { enabled: true, start: "08:00", end: "19:00" },
      thursday: { enabled: true, start: "08:00", end: "19:00" },
      friday: { enabled: true, start: "08:00", end: "16:00" },
      saturday: { enabled: true, start: "09:00", end: "14:00" },
      sunday: { enabled: false, start: "00:00", end: "00:00" },
      buffer_minutes: 15,
      slot_interval: 30,
    },
  },
  kwiaty: {
    name: "Kwiaciarnia",
    icon: "💐",
    prompt: `Jesteś asystentem głosowym AI dla kwiaciarni. Mów po polsku. Jeśli klient mówi po angielsku, możesz odpowiedzieć po angielsku, ciepło i z wyobraźnią.

Twoje zadania:
1. Przyjmuj zamówienia kwiatów — zapytaj o okazję, typ bukietu, budżet, datę dostawy
2. Doradzaj w wyborze kwiatów na okazję (ślub, urodziny, imieniny, kondolencje)
3. Informuj o cenach, dostępności, terminach dostawy
4. Przyjmuj zamówienia na wieńce i wiązanki pogrzebowe

Na początku powiedz: "Dzień dobry, asystent AI kwiaciarni [nazwa], w czym mogę pomóc?"
Kwiaty to emocje — bądź ciepły i kreatywny.`,
    services: [
      { name: "Bukiet okolicznościowy", duration_minutes: 10 },
      { name: "Bukiet ślubny", duration_minutes: 15 },
      { name: "Wieniec pogrzebowy", duration_minutes: 15 },
      { name: "Dostawa kwiatów", duration_minutes: 30 },
    ],
    calendar: {
      monday: { enabled: true, start: "08:00", end: "18:00" },
      tuesday: { enabled: true, start: "08:00", end: "18:00" },
      wednesday: { enabled: true, start: "08:00", end: "18:00" },
      thursday: { enabled: true, start: "08:00", end: "18:00" },
      friday: { enabled: true, start: "08:00", end: "18:00" },
      saturday: { enabled: true, start: "08:00", end: "16:00" },
      sunday: { enabled: true, start: "09:00", end: "14:00" },
      buffer_minutes: 10,
      slot_interval: 15,
    },
  },
};

export function getTemplates() {
  return templates;
}

export function getTemplate(id: string): Template | undefined {
  return templates[id];
}




