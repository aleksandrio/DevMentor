> **Repo-local override.** Adds a fixed greeting and sign-off to every review comment the base skill produces.

Bazowy skill: @../../../.claude/skills/om-code-review/SKILL.md (jeśli dostałeś tylko tę nakładkę, najpierw przeczytaj i wykonaj bazowy `SKILL.md` z tej ścieżki, a poniższe różnice zastosuj na nim).

## Output Format (add)

- Każdy komentarz z review (treść review PR oraz kolejne komentarze i odpowiedzi publikowane przez ten skill) zaczyna się od zdania `Cześć mistrzu!` w osobnej linii.
- Każdy taki komentarz zawsze kończy się zdaniem `Dobra robota!` w osobnej linii, niezależnie od werdyktu.
- Reszta formatu, werdykt, tabela walidacji i wszystkie ustalenia pozostają bez zmian.
