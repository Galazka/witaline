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
  budowlanka: {
    name: "Budownictwo / Remonty",
    icon: "🔨",
    prompt: `Jesteś asystentem głosowym AI dla firmy budowlanej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zapytania o wyceny remontów i budowy
2. Umawiaj spotkania z kierownikiem budowy
3. Odpowiadaj na pytania o usługi (malowanie, tynki, podłogi, dachy)
4. Sprawdzaj dostępność ekipy`,
    services: [{ name: "Konsultacja budowlana", duration_minutes: 60 }, { name: "Wycena remontu", duration_minutes: 30 }],
    calendar: { monday: { enabled: true, start: "07:00", end: "17:00" }, tuesday: { enabled: true, start: "07:00", end: "17:00" }, wednesday: { enabled: true, start: "07:00", end: "17:00" }, thursday: { enabled: true, start: "07:00", end: "17:00" }, friday: { enabled: true, start: "07:00", end: "17:00" }, saturday: { enabled: false, start: "08:00", end: "14:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  sprzatanie: {
    name: "Sprzątanie / Cleaning",
    icon: "🧹",
    prompt: `Jesteś asystentem głosowym AI dla firmy sprzątającej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zamówienia na sprzątanie (biur, domów, mieszkań)
2. Umawiaj terminy wizyt sprzątających
3. Podawaj cennik usług
4. Informuj o ofercie (sprzątanie jednorazowe, regularne, poimprezowe)`,
    services: [{ name: "Sprzątanie mieszkania", duration_minutes: 120 }, { name: "Sprzątanie biura", duration_minutes: 180 }],
    calendar: { monday: { enabled: true, start: "08:00", end: "20:00" }, tuesday: { enabled: true, start: "08:00", end: "20:00" }, wednesday: { enabled: true, start: "08:00", end: "20:00" }, thursday: { enabled: true, start: "08:00", end: "20:00" }, friday: { enabled: true, start: "08:00", end: "20:00" }, saturday: { enabled: true, start: "09:00", end: "16:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 30, slot_interval: 120 },
  },
  ksiegowosc: {
    name: "Księgowość / Finanse",
    icon: "📊",
    prompt: `Jesteś asystentem głosowym AI dla biura rachunkowego. Mów po polsku.

Twoje zadania:
1. Umawiaj spotkania z księgowym
2. Informuj o terminach rozliczeń (PIT, VAT, ZUS)
3. Przyjmuj zapytania o usługi księgowe
4. Odbieraj dokumenty do kontaktu`,
    services: [{ name: "Konsultacja księgowa", duration_minutes: 60 }, { name: "Spotkanie z klientem", duration_minutes: 30 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "17:00" }, tuesday: { enabled: true, start: "09:00", end: "17:00" }, wednesday: { enabled: true, start: "09:00", end: "17:00" }, thursday: { enabled: true, start: "09:00", end: "17:00" }, friday: { enabled: true, start: "09:00", end: "17:00" }, saturday: { enabled: false, start: "00:00", end: "00:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  marketing: {
    name: "Marketing / Reklama",
    icon: "📢",
    prompt: `Jesteś asystentem głosowym AI dla agencji marketingowej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zapytania o usługi reklamowe
2. Umawiaj spotkania z klientami
3. Informuj o ofercie (social media, SEO, reklama online)
4. Zapisuj leady`,
    services: [{ name: "Konsultacja marketingowa", duration_minutes: 60 }, { name: "Audyt social media", duration_minutes: 45 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "17:00" }, tuesday: { enabled: true, start: "09:00", end: "17:00" }, wednesday: { enabled: true, start: "09:00", end: "17:00" }, thursday: { enabled: true, start: "09:00", end: "17:00" }, friday: { enabled: true, start: "09:00", end: "17:00" }, saturday: { enabled: false, start: "00:00", end: "00:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  consulting: {
    name: "Doradztwo / Consulting",
    icon: "💼",
    prompt: `Jesteś asystentem głosowym AI dla firmy doradczej. Mów po polsku.

Twoje zadania:
1. Umawiaj spotkania z doradcami
2. Przyjmuj zapytania o usługi doradcze
3. Informuj o specjalizacji firmy
4. Zapisuj dane klientów do kontaktu`,
    services: [{ name: "Konsultacja doradcza", duration_minutes: 60 }, { name: "Spotkanie biznesowe", duration_minutes: 90 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "18:00" }, tuesday: { enabled: true, start: "09:00", end: "18:00" }, wednesday: { enabled: true, start: "09:00", end: "18:00" }, thursday: { enabled: true, start: "09:00", end: "18:00" }, friday: { enabled: true, start: "09:00", end: "18:00" }, saturday: { enabled: false, start: "00:00", end: "00:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  ubezpieczenia: {
    name: "Ubezpieczenia",
    icon: "🛡️",
    prompt: `Jesteś asystentem głosowym AI dla agenta ubezpieczeniowego. Mów po polsku.

Twoje zadania:
1. Umawiaj spotkania z agentem ubezpieczeniowym
2. Przyjmuj zapytania o ofertę ubezpieczeń (OC, AC, na życie, zdrowotne)
3. Informuj o likwidacji szkód
4. Zapisuj leady`,
    services: [{ name: "Spotkanie z agentem", duration_minutes: 60 }, { name: "Wycena polisy", duration_minutes: 30 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "17:00" }, tuesday: { enabled: true, start: "09:00", end: "17:00" }, wednesday: { enabled: true, start: "09:00", end: "17:00" }, thursday: { enabled: true, start: "09:00", end: "17:00" }, friday: { enabled: true, start: "09:00", end: "17:00" }, saturday: { enabled: true, start: "09:00", end: "13:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  ogrodnictwo: {
    name: "Ogrodnictwo / Zieleniec",
    icon: "🌿",
    prompt: `Jesteś asystentem głosowym AI dla firmy ogrodniczej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zamówienia na usługi ogrodnicze
2. Umawiaj wizyty na wycenę ogrodu
3. Informuj o ofercie (koszenie, sadzenie, projektowanie ogrodów)
4. Podawaj ceny usług`,
    services: [{ name: "Koszenie trawnika", duration_minutes: 60 }, { name: "Projekt ogrodu", duration_minutes: 120 }],
    calendar: { monday: { enabled: true, start: "07:00", end: "18:00" }, tuesday: { enabled: true, start: "07:00", end: "18:00" }, wednesday: { enabled: true, start: "07:00", end: "18:00" }, thursday: { enabled: true, start: "07:00", end: "18:00" }, friday: { enabled: true, start: "07:00", end: "18:00" }, saturday: { enabled: true, start: "08:00", end: "15:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 30, slot_interval: 60 },
  },
  eventy: {
    name: "Eventy / Rozrywka",
    icon: "🎪",
    prompt: `Jesteś asystentem głosowym AI dla firmy eventowej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zapytania o organizację eventów
2. Umawiaj spotkania z klientami
3. Informuj o ofercie (wesela, konferencje, imprezy firmowe)
4. Zapisuj daty rezerwacji`,
    services: [{ name: "Konsultacja eventowa", duration_minutes: 60 }, { name: "Wycena imprezy", duration_minutes: 45 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "18:00" }, tuesday: { enabled: true, start: "09:00", end: "18:00" }, wednesday: { enabled: true, start: "09:00", end: "18:00" }, thursday: { enabled: true, start: "09:00", end: "18:00" }, friday: { enabled: true, start: "09:00", end: "18:00" }, saturday: { enabled: true, start: "10:00", end: "16:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  apteka: {
    name: "Apteka",
    icon: "💊",
    prompt: `Jesteś asystentem głosowym AI dla apteki. Mów po polsku.

Twoje zadania:
1. Informuj o dostępności leków
2. Przyjmuj zamówienia na leki na receptę
3. Informuj o godzinach otwarcia
4. Umawiaj konsultacje z farmaceutą`,
    services: [{ name: "Zamówienie leku", duration_minutes: 10 }, { name: "Konsultacja farmaceutyczna", duration_minutes: 15 }],
    calendar: { monday: { enabled: true, start: "08:00", end: "20:00" }, tuesday: { enabled: true, start: "08:00", end: "20:00" }, wednesday: { enabled: true, start: "08:00", end: "20:00" }, thursday: { enabled: true, start: "08:00", end: "20:00" }, friday: { enabled: true, start: "08:00", end: "20:00" }, saturday: { enabled: true, start: "09:00", end: "16:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 5, slot_interval: 15 },
  },
  optyk: {
    name: "Optyk",
    icon: "👓",
    prompt: `Jesteś asystentem głosowym AI dla salonu optycznego. Mów po polsku.

Twoje zadania:
1. Umawiaj wizyty u optyka
2. Informuj o ofercie (okulary, soczewki, badania wzroku)
3. Przyjmuj zamówienia na soczewki kontaktowe
4. Informuj o terminach odbioru`,
    services: [{ name: "Badanie wzroku", duration_minutes: 30 }, { name: "Dobór okularów", duration_minutes: 45 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "18:00" }, tuesday: { enabled: true, start: "09:00", end: "18:00" }, wednesday: { enabled: true, start: "09:00", end: "18:00" }, thursday: { enabled: true, start: "09:00", end: "18:00" }, friday: { enabled: true, start: "09:00", end: "18:00" }, saturday: { enabled: true, start: "09:00", end: "14:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 30 },
  },
  serwis_komputerow: {
    name: "Serwis komputerów",
    icon: "💻",
    prompt: `Jesteś asystentem głosowym AI dla serwisu komputerowego. Mów po polsku.

Twoje zadania:
1. Przyjmuj zgłoszenia napraw
2. Umawiaj terminy oddania/odbioru sprzętu
3. Informuj o cenniku usług
4. Sprawdzaj status naprawy`,
    services: [{ name: "Diagnostyka komputera", duration_minutes: 30 }, { name: "Naprawa laptopa", duration_minutes: 120 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "18:00" }, tuesday: { enabled: true, start: "09:00", end: "18:00" }, wednesday: { enabled: true, start: "09:00", end: "18:00" }, thursday: { enabled: true, start: "09:00", end: "18:00" }, friday: { enabled: true, start: "09:00", end: "18:00" }, saturday: { enabled: true, start: "10:00", end: "14:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  hydraulik: {
    name: "Hydraulik / Elektryk",
    icon: "🔧",
    prompt: `Jesteś asystentem głosowym AI dla firmy hydrauliczno-elektrycznej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zgłoszenia awarii
2. Umawiaj wizyty serwisowe
3. Informuj o cenniku usług
4. Priorytetyzuj awarie (zalanie, brak prądu)`,
    services: [{ name: "Naprawa awarii", duration_minutes: 60 }, { name: "Przegląd instalacji", duration_minutes: 90 }],
    calendar: { monday: { enabled: true, start: "07:00", end: "20:00" }, tuesday: { enabled: true, start: "07:00", end: "20:00" }, wednesday: { enabled: true, start: "07:00", end: "20:00" }, thursday: { enabled: true, start: "07:00", end: "20:00" }, friday: { enabled: true, start: "07:00", end: "20:00" }, saturday: { enabled: true, start: "08:00", end: "16:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  spa: {
    name: "SPA / Sauna / Wellness",
    icon: "🧖",
    prompt: `Jesteś asystentem głosowym AI dla SPA. Mów po polsku.

Twoje zadania:
1. Umawiaj wizyty na zabiegi SPA
2. Informuj o ofercie (masaże, sauna, zabiegi kosmetyczne)
3. Przyjmuj zapytania o pakiety i ceny
4. Informuj o godzinach otwarcia`,
    services: [{ name: "Masaż relaksacyjny", duration_minutes: 60 }, { name: "Karnet SPA", duration_minutes: 120 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "21:00" }, tuesday: { enabled: true, start: "09:00", end: "21:00" }, wednesday: { enabled: true, start: "09:00", end: "21:00" }, thursday: { enabled: true, start: "09:00", end: "21:00" }, friday: { enabled: true, start: "09:00", end: "21:00" }, saturday: { enabled: true, start: "09:00", end: "18:00" }, sunday: { enabled: true, start: "10:00", end: "16:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  jubiler: {
    name: "Jubiler / Zegarmistrz",
    icon: "💍",
    prompt: `Jesteś asystentem głosowym AI dla salonu jubilerskiego. Mów po polsku.

Twoje zadania:
1. Przyjmuj zapytania o produkty (biżuteria, zegarki)
2. Umawiaj wizyty na przymiarki
3. Informuj o naprawach (zegarmistrz)
4. Przyjmuj zamówienia na wyroby na zamówienie`,
    services: [{ name: "Przymiarka biżuterii", duration_minutes: 30 }, { name: "Naprawa zegarka", duration_minutes: 15 }],
    calendar: { monday: { enabled: true, start: "09:00", end: "17:00" }, tuesday: { enabled: true, start: "09:00", end: "17:00" }, wednesday: { enabled: true, start: "09:00", end: "17:00" }, thursday: { enabled: true, start: "09:00", end: "17:00" }, friday: { enabled: true, start: "09:00", end: "17:00" }, saturday: { enabled: true, start: "09:00", end: "14:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 30 },
  },
  pralnia: {
    name: "Pralnia chemiczna",
    icon: "👕",
    prompt: `Jesteś asystentem głosowym AI dla pralni chemicznej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zamówienia na pranie
2. Informuj o cenniku
3. Informuj o terminach odbioru
4. Potwierdzaj gotowość zamówienia`,
    services: [{ name: "Pranie odzieży", duration_minutes: 1440 }, { name: "Czyszczenie obuwia", duration_minutes: 1440 }],
    calendar: { monday: { enabled: true, start: "08:00", end: "18:00" }, tuesday: { enabled: true, start: "08:00", end: "18:00" }, wednesday: { enabled: true, start: "08:00", end: "18:00" }, thursday: { enabled: true, start: "08:00", end: "18:00" }, friday: { enabled: true, start: "08:00", end: "18:00" }, saturday: { enabled: true, start: "09:00", end: "14:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 1440, slot_interval: 1440 },
  },
  ochrona: {
    name: "Ochrona / Detektywistyka",
    icon: "🔒",
    prompt: `Jesteś asystentem głosowym AI dla firmy ochroniarskiej. Mów po polsku.

Twoje zadania:
1. Przyjmuj zapytania o usługi ochrony
2. Umawiaj spotkania z doradcą
3. Informuj o ofercie (monitoring, ochrona fizyczna, detektyw)
4. Zapisuj leady`,
    services: [{ name: "Konsultacja ochrony", duration_minutes: 60 }, { name: "Wycena monitoringu", duration_minutes: 30 }],
    calendar: { monday: { enabled: true, start: "08:00", end: "18:00" }, tuesday: { enabled: true, start: "08:00", end: "18:00" }, wednesday: { enabled: true, start: "08:00", end: "18:00" }, thursday: { enabled: true, start: "08:00", end: "18:00" }, friday: { enabled: true, start: "08:00", end: "18:00" }, saturday: { enabled: true, start: "09:00", end: "14:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  wino: {
    name: "Winiarnia / Alkohole",
    icon: "🍷",
    prompt: `Jesteś asystentem głosowym AI dla winiarni/sklepu alkoholowego. Mów po polsku.

Twoje zadania:
1. Przyjmuj zamówienia
2. Informuj o dostępności produktów
3. Informuj o godzinach otwarcia
4. Przyjmuj rezerwacje na degustacje`,
    services: [{ name: "Degustacja wina", duration_minutes: 60 }, { name: "Zamówienie online", duration_minutes: 10 }],
    calendar: { monday: { enabled: false, start: "00:00", end: "00:00" }, tuesday: { enabled: false, start: "00:00", end: "00:00" }, wednesday: { enabled: false, start: "00:00", end: "00:00" }, thursday: { enabled: true, start: "12:00", end: "20:00" }, friday: { enabled: true, start: "12:00", end: "22:00" }, saturday: { enabled: true, start: "11:00", end: "22:00" }, sunday: { enabled: true, start: "12:00", end: "18:00" }, buffer_minutes: 15, slot_interval: 60 },
  },
  wypozyczalnia: {
    name: "Wypożyczalnia sprzętu",
    icon: "🚜",
    prompt: `Jesteś asystentem głosowym AI dla wypożyczalni sprzętu. Mów po polsku.

Twoje zadania:
1. Przyjmuj rezerwacje sprzętu
2. Informuj o dostępności
3. Podawaj cennik wypożyczenia
4. Umawiaj odbiór/zwrot`,
    services: [{ name: "Wypożyczenie sprzętu", duration_minutes: 30 }, { name: "Rezerwacja terminu", duration_minutes: 15 }],
    calendar: { monday: { enabled: true, start: "08:00", end: "17:00" }, tuesday: { enabled: true, start: "08:00", end: "17:00" }, wednesday: { enabled: true, start: "08:00", end: "17:00" }, thursday: { enabled: true, start: "08:00", end: "17:00" }, friday: { enabled: true, start: "08:00", end: "17:00" }, saturday: { enabled: true, start: "09:00", end: "14:00" }, sunday: { enabled: false, start: "00:00", end: "00:00" }, buffer_minutes: 15, slot_interval: 30 },
  },
};

export function getTemplates() {
  return templates;
}

export function getTemplate(id: string): Template | undefined {
  return templates[id];
}




