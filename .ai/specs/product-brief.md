# DevMentor — product brief

- Data: 2026-10-25
- Tryb: own (pomysł założycieli, bez płacących użytkowników); Właściciel: Aleksander Kowal (decyzje zakresu z 2026-10-25); decyzje warsztatu 2026-08-26 należą do founder A (Oliwia); Przebieg: full
- Podstawa dowodowa: 7 rozmów z różnymi osobami (3 programistów szukających pomocy, 1 programista, który problemu prawie nie ma, 3 seniorów-potencjalnych mentorów), 1 eksport wątków z jednego Discorda (109 wątków, 14 dni), 1 ankieta na tym samym Discordzie (54 odpowiedzi, deklaracje), 5 benchmarków sprawdzonych 2026-09-04, lista 50 kandydatów na mentorów (nikt jeszcze nie zapytany), decyzje warsztatu i N01/N02. Tablice Miro to stanowiska założycieli, nie dowody. Nikt jeszcze nie zapłacił i nie odpowiedział za pieniądze; najważniejsze nietestowane przekonanie: programista zapłaci obcemu seniorowi za odpowiedź tekstem, a senior odpowie w oknie, którego ten potrzebuje (A01, A02).
- Coverage: 45 claims — 35 sourced (interview 12, data 5, document 17, product 1, benchmark 0), 0 synthetic, 10 assumed; 2 entries on the collection plan (wzrost „document” to zapisane decyzje z 2026-10-25, nie nowe dowody)
- Synthetic hypotheses outside Coverage: 0
- Definition of Ready signed by: not yet signed — zakres zdecydowany (D03–D06), ale płacenie (A01) i dostępność mentorów (A02) są nietestowane i nieprzyjęte jako ryzyko, a Q04, Q05, Q07, Q08 są otwarte; ready for: zaplanowanie testu A01/A02 i szkic specyfikacji pierwszej budowy, nie implementacja
- Sources: `.ai/specs/research/` (wywiady 2026-08-20 do 2026-09-03, `2026-08-26-workshop-export.md`, `2026-09-04-discord-help-requests.csv` z notą `2026-09-04-data-request-discord-help.md`, `2026-09-04-survey-discord-willingness-to-pay.md`, `2026-09-04-benchmark-*.md`, `2026-09-04-mentor-list.csv` z notą, tablice `*-miro-board-*.md`, `decisions/N01-no-video.md`, `decisions/N02-no-ratings.md`, `decisions/D03`–`D06`), `README.md`

## Decision summary

Decyzja: co jest pierwszą budową (budżet z warsztatu: 25 godzin) i dla kogo. Zdecydował Aleksander Kowal 2026-10-25 (D03–D06), na rekomendację agenta.

Trzy osoby (rozmowy z polecenia, z grupy na FB) opisały utknięcie na konkretnym problemie z terminem (release, klient, wycena) bez kogo zapytać; obeszły je wyszukiwarką, Discordem albo prowizorką. Na jednym Discordzie, którego moderatorem jest founder B, 21% wątków z prośbą o pomoc nie dostało odpowiedzi, mediana czekania wynosiła 67 minut, a najwięcej pytań pada wieczorem. Jak często to się zdarza jednej osobie, nie wiadomo. Zob. „Problemy” i „Grupa docelowa”.

Teraz: pracujący programista albo freelancer (D04) dostaje od mentora link, płaci z góry znaną cenę i dostaje jedną odpowiedź tekstową na jedno pytanie, bez rezerwacji slotu (D03, D05, D06). Sejf wiedzy, MCP i subskrypcja są w „Później”: dwóch programistów odrzuciło subskrypcję, jeden także zapisane odpowiedzi, o MCP nie pytano nikogo. Świadoma zmiana pytania warsztatu („co zarabia dla mentora bez rozmowy”): pierwsza budowa sprzedaje czas mentora pytanie po pytaniu, choć dwóch mentorów widzi wartość w notatkach. D06 zastępuje sloty 25/50 min z D01.

Największa niepewność: nikt jeszcze nie zapłacił (3 z 54 ankietowanych kiedykolwiek komuś zapłaciło); nikt z 50 mentorów nie został zapytany, czy odpowie „w dwadzieścia minut” albo „within the hour” (freelancer: „tego samego dnia”) wieczorem, gdy pada najwięcej pytań, a mentorzy odpowiadają „jak mam humor” i nie w weekend. Link mentora (D05) znaczy, że pytający przychodzą z jego publiczności; własną ma 16 z 50 kandydatów, a programista z blokadą, który nie zna mentora, nie zostanie obsłużony (A01–A03).

Następny krok (rekomendacja, niezdecydowana): przed implementacją sprawdzić A01 i A02 ręcznie — kilku mentorów z ciepłym kontaktem i własną publicznością rozsyła link, płatność przez link Stripe, odpowiedź tekstem. Kształt, właściciel, termin i kryterium stopu są otwarte (Q04); otwarte są też Q05, Q07, Q08.

## Vision

Kierunek założycieli: seniorzy zarabiają na wiedzy bez dokładania godzin, a programista dostaje odpowiedź kogoś, kto to już robił, wtedy, kiedy jej potrzebuje. `[DOCUMENT]` `2026-09-02-miro-board-vision-target-needs.md` (stanowisko, nie wykazana korzyść)

## Target group and stakeholders

- Klient (płaci): programista pracujący zawodowo albo freelancer z konkretnym, pilnym problemem (wybór, D04). `[DOCUMENT]` `decisions/D04-first-user-working-devs.md`
- Użytkownik (pyta): programista zatrudniony albo freelancer; w eksporcie Discorda, gdy autor podał kontekst, 37 zatrudnionych, 21 freelancerów, 10 studentów (41 bez kontekstu). `[DATA]` `2026-09-04-discord-help-requests.csv`, 2026-08-18–31
- Użytkownik (odpowiada): senior, który już odpowiada za darmo w DM i na Slacku, z dokumentu „do wklejania”. `[INTERVIEW]` `2026-08-22-interview-mentor.md`, `2026-09-03-interview-senior-python-meetups.md`
- Interesariusze: founder A (produkt, UX, sponsor), founder B (tech lead, deweloper); QA i legal bez osoby, A za regulamin domyślnie u founder A. `[DOCUMENT]` `2026-09-05-miro-board-raci-matrix.md`
- Decydent zakresu: Aleksander Kowal dla decyzji z 2026-10-25; founder A (Oliwia) dla decyzji warsztatu i N01/N02. `[DOCUMENT]` `2026-08-26-workshop-export.md`, `decisions/D03-first-build-paid-text-answer.md`
- Rozbieżność: `README.md` opisuje osoby uczące się programowania (początkujące i średnio zaawansowane), czyli inną grupę niż D04 `[PRODUCT]` `README.md`; Q02
- Uczący się są w danych mniejszością, a w wywiadach ich nie ma: 10 ze 109 wątków od studentów (3 z sygnałem pilności), 8 z 54 ankietowanych „student or between jobs”. Jeden mentor nie chce „odrabiać juniorom zadań domowych”. `[DATA]` `2026-09-04-discord-help-requests.csv`, `2026-09-04-survey-discord-willingness-to-pay.md`

## Problems, with evidence

- Pracujący programista utknął dzień przed release'em na błędzie generyków TS (jedyny senior na urlopie): 40 minut Stack Overflow, sprzeczne odpowiedzi na Discordzie, prowizorka z TODO; koszt „half a day, and I still don't trust that code”. Jedna relacja. `[INTERVIEW]` `2026-08-20-interview-working-dev.md`
- Backend, fintech: w piątek wieczorem upgrade Helma położył ingress na stagingu, release w poniedziałek; godzina szukania, nikt na Slacku, zła odpowiedź na Discordzie w sobotę, rollback, release przesunięty na wtorek. Częstotliwość nieznana (jeden piątek). `[INTERVIEW]` `2026-09-01-interview-backend-dev-fintech.md`
- Freelancer: wycena migracji na server components bez doświadczenia w tej skali; dwa wieczory czytania, „it depends” na Discordzie, wycena za niska o ok. tydzień nieopłaconej pracy. „Ciągle” nie zostało skwantyfikowane. `[INTERVIEW]` `2026-09-02-interview-freelancer-react.md`
- Programista platformowy w firmie na 200 osób rozwiązał swój problem sam w pół dnia i nie uważa tego za problem; ma wewnętrzny kanał. Kontrprzykład dla dużych firm. `[INTERVIEW]` `2026-09-02-interview-platform-dev-solves-alone.md`
- Jeden Discord (ok. 4000 osób), 14 dni: 109 wątków z prośbą o pomoc; 23 bez żadnej odpowiedzi; mediana pierwszej odpowiedzi 67 min (86 odpowiedzianych, 31 w ciągu 30 min); 31 wątków z sygnałem pilności, 9 z nich bez odpowiedzi; 35 rozwiązanych według autora, 20 częściowo. Etykiety nadała jedna osoba. `[DATA]` `2026-09-04-discord-help-requests.csv`
- Ankieta na tym Discordzie: przy ostatnim utknięciu 49 z 54 szukało w dokumentacji, 38 pytało AI, 31 społeczność, 20 wypuściło prowizorkę, 3 komuś zapłaciło. To jedyne zachowanie w ankiecie; reszta to deklaracje. `[DATA]` `2026-09-04-survey-discord-willingness-to-pay.md`
- Seniorzy odpowiadają co tydzień albo co miesiąc na te same pytania, za darmo, wklejając z prywatnego dokumentu („two evenings a month, for free, and the notes rot”). Dwie relacje. `[INTERVIEW]` `2026-08-22-interview-mentor.md`, `2026-09-03-interview-senior-python-meetups.md`
- Osoba, sytuacja, cel (programista): ktoś, kto robił dokładnie to samo, patrzy na jego konkretny problem w czasie, który podali: „w dwadzieścia minut” (fintech), „within the hour” (2026-08-20), „tego samego dnia” (freelancer). `[ASSUMPTION]` synteza agenta, A01–A03
- Seniorzy podali różne powody: notatki mają zarabiać „without me being on a call” (2026-08-22); „nie potrzebuję pieniędzy. potrzebuję nie tracić czasu”, cena wysoka jako filtr (staff engineer); nigdy nie brał pieniędzy, „dziwnie by było prosić”, stawki nie podał (senior Pythona). Wspólny motyw to interpretacja. `[ASSUMPTION]` synteza agenta z trzech wywiadów

## Product and how it stands out

- Czym jest (D03, D05, D06): strona mentora pod jego linkiem, przez którą programista płaci z góry znaną cenę za odpowiedź tekstową na jedno konkretne pytanie. `[DOCUMENT]` `decisions/D03-first-build-paid-text-answer.md`; zob. „Zakres”
- Różnica (hipoteza): zaufanie z publicznej pracy zamiast ocen (N02), tekst zamiast wideo (N01), jedno pytanie zamiast miesięcznej relacji, wejście przez link mentora jak w Topmate, ale tylko dla programistów. Czy to wystarcza, żeby wybrać DevMentor zamiast Codementora, nie wiadomo. `[ASSUMPTION]` A01

| reference | what it does well | where it falls short for our users | checked on | link |
|---|---|---|---|---|
| Codementor | ścieżka prośba → sesja na żywo to cały produkt; stawki na kartach React $15–$80 za 15 min | każda karta 5.0, ocena nic nie mówi; nic z sesji nie zostaje; rozmówca z fintechu szukał mentora 40 min | 2026-09-04 | https://www.codementor.io/react-experts |
| MentorCruise | darmowa rozmowa wstępna; karta mentora z ceną i rytmem bez ocen jako wzór | model miesięczny ($100–$350/mies.), który staff engineer odrzuciła | 2026-09-04 | https://mentorcruise.com/ |
| Topmate | ekspert ma własną stronę, cenę i link; prowizja 10% z własnego linku, 20% z marketplace'u | dowolna profesja; z blokadą nie znajdziesz eksperta, którego nie obserwujesz | 2026-09-04 | https://topmate.io/pricing |
| Preply | rezerwacja 25/50 min, darmowe anulowanie do 12 h przed | lekcje cykliczne, nie pilny problem; oceny na każdej karcie | 2026-09-04 | https://preply.com/en/how-it-works |
| ADPList | rezerwacja w kilka minut; liczba sesji jako sygnał zaufania inny niż ocena | darmowe, mentor nie zarabia; głównie design i produkt | 2026-09-04 | https://adplist.org/ |

## Goals and success criteria

- Cel biznesowy: tablica wymienia 100 mentorów z sejfami w pierwszym roku i 30% mentee na subskrypcji; te cele dotyczą sejfu, który D03 odkłada, więc nie obowiązują pierwszej budowy. `[DOCUMENT]` `2026-09-02-miro-board-product-goals.md` (stanowisko, nie decyzja)
- Rezultat dla użytkownika: programista dostaje odpowiedź, którą uznaje za rozwiązanie, w czasie, który podał, zanim minie jego termin. `[ASSUMPTION]` z wywiadów 2026-08-20, 2026-09-01, 2026-09-02
- Metryka główna, baseline, próg, data: nieustalone; pierwszy pomiar to wynik testu z Q04. Baseline z Discorda (21% bez odpowiedzi, mediana 67 min) dotyczy darmowej pomocy w jednej społeczności. `[DATA]` `2026-09-04-discord-help-requests.csv`
- Co nie może się pogorszyć: zaufanie do publikacji (R02); zob. N01, N02.

## Scope

- **Teraz (D03, D05, D06):** link mentora → jedno pytanie z ceną znaną z góry → przedpłata (Stripe) → mentor widzi pytanie i przyjmuje albo odrzuca (R04, propozycja) → odpowiedź tekstowa → zwrot, gdy odpowiedź nie przyjdzie (R03, propozycja). Bez slotów (R06). Otwarte: konto przed płatnością (Q07), dane wypłaty mentora (Q05), koszt w 25 godzinach razem z regulaminem (Q08), obiecany czas odpowiedzi (A02).
- **Później:** sejf wiedzy jako subskrypcja, MCP, pytania asynchroniczne z SLA 24 h, notatki publikowane za zgodą (R02), lista mentorów do przeszukania (D05), pakiety, plany zespołowe (D03).
- **Nie robimy:** zob. „Non-goals”.

## Domain glossary

| Term | Meaning | Owned by | Visible to |
|---|---|---|---|
| Odpowiedź | Płatna, jedna odpowiedź tekstowa mentora na jedno pytanie programisty, bez rezerwacji slotu (R06) | Aleksander Kowal | mentor, programista |
| Link mentora | Adres strony jednego mentora, który mentor sam rozsyła; jedyne wejście w pierwszej budowie (D05) | mentor | każdy, kto ma link |
| Sejf (vault) | Notatki mentora sprzedawane jako subskrypcja; poza pierwszą budową (D03) | mentor | subskrybenci (Później) |
| Mentor | Senior, który odpowiada za pieniądze; nie zakłada relacji miesięcznej | — | wszyscy |

## Key flows

- Stan obecny (programista): problem → wyszukiwarka/AI → pytanie na Discordzie lub Slacku → czekanie albo brak odpowiedzi → prowizorka, rollback albo zgadywanie. `[INTERVIEW]` `2026-08-20-interview-working-dev.md`, `2026-09-01-interview-backend-dev-fintech.md`, `2026-09-02-interview-freelancer-react.md`
- Stan obecny (mentor): pytanie w DM → odpowiedź wklejona z prywatnego dokumentu, za darmo, „jak mam humor”. `[INTERVIEW]` `2026-09-03-interview-senior-python-meetups.md`
- Stan docelowy: programista otwiera link mentora, opisuje pytanie i widzi cenę → płaci → mentor widzi pytanie i przyjmuje albo odrzuca → odpowiedź tekstem → przy braku odpowiedzi zwrot tego samego dnia. Wejście przez link (D05) i brak slotu (D06) są decyzjami; pozostałe kroki to propozycja i dopuszczają czekanie dłuższe niż 20–60 minut, których chcieli dwaj rozmówcy. `[ASSUMPTION]` z wywiadów freelancera i seniora Pythona

## Business rules

| Id | Rule | Applies to | Source | Status | Review by | Required path to change | Owner | Supersedes |
|---|---|---|---|---|---|---|---|---|
| R01 | Sesja trwa 25 albo 50 minut | sesje | `[DOCUMENT]` warsztat 2026-08-26 (D01) | superseded | — | — | founder A | none |
| R02 | Nic z sesji nie jest publikowane bez zgody programisty; publikacja niesie nazwisko mentora | notatki, sejf | `[DOCUMENT]` warsztat 2026-08-26 (D02); wywiady 2026-08-22, 2026-09-03 | active | unknown | nowy wiersz zatwierdzony przez obu założycieli | founder A, founder B | none |
| R03 | Programista zna cenę, zanim napisze pytanie; przy braku odpowiedzi zwrot tego samego dnia, bez zgłoszenia | płatność | `[INTERVIEW]` `2026-09-02-interview-freelancer-react.md` | proposal | unknown | decyzja Aleksandra Kowala | pending | none |
| R04 | Mentor widzi pytanie przed przyjęciem | przyjęcie pytania | `[INTERVIEW]` `2026-09-03-interview-senior-python-meetups.md`, `2026-09-03-interview-staff-engineer-declined-before.md` | proposal | unknown | decyzja Aleksandra Kowala | pending | none |
| R06 | Pierwsza budowa sprzedaje jedną odpowiedź tekstową na jedno pytanie, bez rezerwacji slotu | odpowiedzi | `[DOCUMENT]` `decisions/D06-single-answer-replaces-slots.md` | active | po teście Q04 | nowy wiersz zatwierdzony przez Aleksandra Kowala | Aleksander Kowal | R01 |
| R05 | Mentor może zdjąć opublikowaną notatkę ze swoim nazwiskiem | publikacja (Później) | `[INTERVIEW]` `2026-09-03-interview-staff-engineer-declined-before.md` | proposal | przy speku sejfu | decyzja Aleksandra Kowala | pending | none |

## Non-goals

| Id | We are not building | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|
| N01 | Rozmowy wideo; sesje są tekstowe | ograniczenie warsztatu; „text is fine, faster”; uwaga: freelancer chce rozmowy do wycen (Q03) | founder A (Oliwia) | active | unknown | nowy rekord founder A | `[DOCUMENT]` `decisions/N01-no-video.md` | none |
| N02 | Oceny i opinie; zamiast nich link do publicznej pracy i opis tego, co mentor zrobił | wywiady odrzucają oceny; 12 z 54 ankietowanych wybrało oceny jako sygnał, 41 publiczną pracę | founder A (Oliwia) | active | unknown | nowy rekord founder A | `[DOCUMENT]` `decisions/N02-no-ratings.md` | none |
| N03 | Miesięczny mentoring, „mentorship journey”, społeczność, ścieżki nauki | odrzucone w odpowiedzi na pytania „czego nie potrzebujesz?” i „dlaczego nie MentorCruise?” | pending | proposal | unknown | decyzja Aleksandra Kowala | `[INTERVIEW]` wywiady 2026-09-01, 2026-09-02 (freelancer), 2026-09-03 (staff engineer) | none |

## Decisions

| Id | Date | Decision | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
| D01 | 2026-08-26 | Sesje 25 lub 50 minut (R01) | „bookable in a lunch break” | founder A | superseded | — | nowy wiersz founder A | `[DOCUMENT]` `2026-08-26-workshop-export.md` | none |
| D02 | 2026-08-26 | Nic z sesji bez zgody programisty (R02) | „trust is the product” | founder A, founder B | active | unknown | nowy wiersz obu założycieli | `[DOCUMENT]` `2026-08-26-workshop-export.md` | none |
| D03 | 2026-10-25 | Pierwsza budowa: tylko płatna odpowiedź tekstowa na jedno pytanie; sejf, MCP, subskrypcja Później | przyjęta rekomendacja agenta: dwóch programistów odrzuciło subskrypcję, jeden zapisane odpowiedzi; odrzucone alternatywy: sejf od początku (na nim stoi wizja i oferta dla mentorów) i ręczny test bez budowy | Aleksander Kowal | active | po teście Q04 | nowy wiersz Aleksandra Kowala | `[DOCUMENT]` `decisions/D03-first-build-paid-text-answer.md` | none |
| D04 | 2026-10-25 | Pierwszy użytkownik: pracujący programista lub freelancer z pilnym problemem, nie osoba ucząca się | przyjęta rekomendacja agenta: wszystkie wywiady i większość danych opisują pracujących (studenci: 10 ze 109 wątków, 8 z 54 ankietowanych); odrzucone: uczący się z README, obie grupy | Aleksander Kowal | active | unknown | nowy wiersz Aleksandra Kowala | `[DOCUMENT]` `decisions/D04-first-user-working-devs.md` | none |
| D05 | 2026-10-25 | Wejście w pierwszej budowie: tylko link mentora, bez listy do przeszukania | staff engineer odmawia listy, senior Pythona wchodzi, „jak ludzie, których znam”; odrzucone: lista (obsłużyłaby obcych z blokadą), ręczne dobieranie przez założycieli; konsekwencja: pytający pochodzą z publiczności mentora (A03) | Aleksander Kowal | active | po teście Q04 | nowy wiersz Aleksandra Kowala | `[DOCUMENT]` `decisions/D05-mentor-share-link-only.md` | none |
| D06 | 2026-10-25 | Jedna odpowiedź tekstowa na jedno pytanie zamiast slotów 25/50 min (R06) | przyjęta rekomendacja agenta: rozmówcy chcieli odpowiedzi „w dwadzieścia minut” / „within the hour”, rezerwacja slotu może tego nie spełnić; ścieżka zmiany D01 wskazywała founder A, zmianę zatwierdził Aleksander Kowal jako właściciel decyzji zakresu | Aleksander Kowal | active | po teście Q04 | nowy wiersz Aleksandra Kowala | `[DOCUMENT]` `decisions/D06-single-answer-replaces-slots.md` | D01 |

## Riskiest assumptions

| Id | Assumption | Importance | Evidence today | If false | Smallest test | Owner | By when | Result |
|---|---|---|---|---|---|---|---|---|
| A01 | Programista z pilnym problemem zapłaci obcemu seniorowi za odpowiedź tekstową `[ASSUMPTION]` | high | 37 z 54 deklaruje, że zapłaciłoby coś, ale 3 kiedykolwiek zapłaciło; rozmówcy: „chyba”, „poniżej 200 to tak”, „za to? nie” | nie ma produktu w tej formie | ręcznie pośredniczona odpowiedź na prawdziwe pytanie; obserwowany wynik: osoba z problemem płaci przed odpowiedzią. Kto dociera do pytającego (Q04) wpływa na wynik, bo founder B moderuje ten Discord | unknown | unknown | untested |
| A02 | Mentorzy odpowiedzą w oknie, którego potrzebuje programista (godzina / ten sam dzień) `[ASSUMPTION]` | high | nikt z 50 kandydatów nie został zapytany; godzin i stawek nie uzyskano od żadnego mentora | trzeba zmienić obietnicę czasu albo model | w teście A01 obserwowany wynik: mentor dostarcza płatną odpowiedź w czasie podanym przez pytającego, także wieczorem; rozmowy o dostępności dają tylko deklaracje | unknown | unknown | untested |
| A03 | Mentorzy przyprowadzą przez swój link wystarczająco wielu pytających `[ASSUMPTION]` | high | własną publiczność ma 16 z 50 kandydatów (23 nieznane); senior Pythona przyprowadzi ludzi „jakbym coś z tego miał”; staff engineer: miesiąc ciszy i „zapomnę, że to istnieje” | potrzebna lista albo inne wejście (D05) | w teście A01 policzyć pytania przychodzące z linku każdego mentora | unknown | unknown | untested |
| A04 | Notatki mentora sprzedadzą się jako subskrypcja `[ASSUMPTION]` | medium | dwóch mentorów: notatki to „całe value”; żaden z programistów ich nie chciał; staff engineer chce zobaczyć „AI z moich notatek”, „zanim wyjdzie”; senior Pythona chce „wiedzieć od razu” i „zadzwoń najpierw” | sejf znika z planu | odłożone do decyzji po teście A01 | unknown | unknown | untested |
| A05 | Płaci sam programista, nie pracodawca `[ASSUMPTION]` | medium | ankieta: 24 z własnej kieszeni, 19 pracodawca; platformowiec: „nie płacę za rzeczy do pracy sam” | potrzebne faktury i plany firmowe wcześniej | zapisać płatnika w teście A01 | unknown | unknown | untested |

## Kill criteria

Nieustalone. Do decyzji Aleksandra Kowala przed testem A01: jaki wynik testu (płatności, czas odpowiedzi mentora) oznacza zatrzymanie albo zmianę kierunku i do kiedy. Q04.

## Hypotheses to test

Brak syntetycznych przejść w tym przebiegu.

## Open questions

| Id | Question | Blocking | Who can answer | Status |
|---|---|---|---|---|
| Q01 | Czy rezerwacja slotu 25/50 min (D01) pasuje do potrzeby szybkiej odpowiedzi? | — | Aleksander Kowal | closed 2026-10-25: D06 |
| Q02 | Czy README (osoby uczące się) zmienić zgodnie z D04? | nie | Aleksander Kowal | open |
| Q03 | Czy N01 obejmuje także wyceny, przy których freelancer chce rozmowy? | nie dla pierwszej budowy | founder A | open |
| Q04 | Czy przed implementacją robimy test A01/A02, kto go prowadzi, do kiedy i co oznacza stop? | tak, implementacja | Aleksander Kowal | open |
| Q05 | Czy wypłata mentorowi przez Stripe wymaga danych konta przed pierwszą rezerwacją? Senior Pythona: wtedy odmówi. | tak, onboarding mentora | founder B | open |
| Q06 | Czy odpowiedź z sejfu cytuje mentora i notatkę? (z warsztatu, founder B) | nie dla pierwszej budowy (D03) | founder B | open |
| Q07 | Czy pytający musi założyć konto przed płatnością? Rozmówca z fintechu: „nie że zakładam konto, weryfikacja maila”. | tak, przepływ „Teraz” | Aleksander Kowal | open |
| Q08 | Ile z 25 godzin kosztuje „Teraz” (przedpłata, zwrot, wypłata, przyjęcie) razem z regulaminem dla obu ról? | tak, zakres „Teraz” | founder B | open |

## Definition of Ready addendum (own)

Problemy mają oparcie w trzech relacjach i jednym eksporcie danych z jednej społeczności; częstotliwość u pojedynczej osoby i płacenie nie są potwierdzone. Grupa docelowa jest wybrana (D04) i ma częściowe oparcie w wywiadach i danych z jednej społeczności. Zakres „Teraz” jest zdecydowany (D03, D05, D06). A01–A03 są nietestowane i nie zostały przyjęte jako ryzyko; Q04, Q05, Q07 i Q08 blokują implementację. Brief jest gotowy do zaplanowania testu i szkicu specyfikacji, nie do implementacji.

## Collection plan

### Ile czasu i za jaką stawkę mentorzy odpowiedzą i w jakim czasie?

- What decision or work needs it: dobór mentorów do testu A01–A03 (deklaracje; sam test to obserwacja)
- Who can answer it: mentorzy z listy z ciepłym kontaktem (29 z 50)
- How: krótkie rozmowy według szablonu wywiadu, z pytaniem o wieczory, weekendy i to, czy roześlą link swojej publiczności
- Owner and by when: unknown
- Template: `.ai/specs/research/templates/interview-note.md`

### Czy Stripe pozwala przyjąć płatność za mentora, zanim ten poda dane wypłaty?

- What decision or work needs it: Q05, onboarding mentora w „Teraz”
- Who can answer it: founder B
- How: sprawdzenie dokumentacji Stripe z linkiem i datą
- Owner and by when: unknown
- Template: `.ai/specs/research/templates/benchmark-check.md`
