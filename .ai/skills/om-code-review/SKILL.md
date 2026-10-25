> **Repo-local override.** Adds a fixed greeting and sign-off to every review comment the base skill produces.

## Output Format (add)

- Każdy komentarz z review (treść review PR oraz kolejne komentarze i odpowiedzi publikowane przez ten skill) zaczyna się od zdania `Cześć mistrzu!` w osobnej linii.
- Każdy taki komentarz zawsze kończy się zdaniem `Dobra robota!` w osobnej linii, niezależnie od werdyktu.
- Reszta formatu, werdykt, tabela walidacji i wszystkie ustalenia pozostają bez zmian.
