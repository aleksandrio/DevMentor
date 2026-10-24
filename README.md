# DevMentor

DevMentor to platforma, która łączy mentorów z osobami uczącymi się programowania. Daje początkującym i średnio zaawansowanym programistom dostęp do doświadczonych specjalistów, którzy pomogą im się rozwijać. Mentorzy z kolei mogą tu dzielić się wiedzą i budować swoją markę.

> Projekt jest na wczesnym etapie rozwoju. Opisane niżej funkcje to kierunek, w którym zmierzamy, a nie lista gotowych możliwości.

## Cel projektu

Nauka programowania na własną rękę często kończy się utknięciem na problemie, brakiem informacji zwrotnej o kodzie albo niejasną ścieżką rozwoju. DevMentor chce to zmienić, łącząc uczących się z mentorami, którzy przeszli tę drogę i pomogą szybciej zrobić postęp.

## Dla kogo

- **Osoby uczące się programowania**: szukają wsparcia, przeglądu kodu, pomocy przy projektach albo porady zawodowej.
- **Mentorzy**: doświadczeni programiści, którzy chcą dzielić się wiedzą i pomagać innym w rozwoju.

## Planowane funkcje

- Profile mentorów z ich specjalizacjami, technologiami i doświadczeniem
- Wyszukiwanie i filtrowanie mentorów według technologii, poziomu i dostępności
- Profile uczących się z celami i aktualnym poziomem wiedzy
- Umawianie sesji mentoringowych
- Komunikacja między mentorem a uczącym się
- Oceny i opinie po zakończonych sesjach

## Stos technologiczny

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) 4
- ESLint

## Uruchomienie lokalne

Zainstaluj zależności:

```bash
npm install
```

Uruchom serwer deweloperski:

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

### Dostępne skrypty

| Skrypt          | Opis                                       |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Uruchamia serwer deweloperski              |
| `npm run build` | Buduje wersję produkcyjną aplikacji        |
| `npm run start` | Uruchamia zbudowaną wersję produkcyjną     |
| `npm run lint`  | Sprawdza kod za pomocą ESLint              |

## Struktura projektu

```
app/        # Strony i layouty (App Router)
public/     # Pliki statyczne
```
