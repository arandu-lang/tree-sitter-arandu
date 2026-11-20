# tree-sitter-arandu

Gramática oficial [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) para a linguagem de programação **[Arandu](https://github.com/arandu-lang/arandu)** (`.aru`).

## Recursos

- **Sintaxe completa do Arandu:** módulos, imports/re-exports (`import`, `from ... import`, `use`), structs, enums, interfaces (`sealed`), `impl`, `extern "C"`, genéricos e `comptime`.
- **Sistema de tipos e memória:** `own`, `mut`, `ref`, `mut ref`, `shared`, `ptr[T]`, slices `[]T` / `mut []T`, arrays `[N]T`, tipos opcionais `T?`, `defer`, `errdefer`, `unsafe`.
- **Expressões e controle de fluxo:** `match` com patterns (`..` em struct patterns, ranges, variantes), `guard ... else`, `let ... else`, `catch`, pipeline `|>`, null-coalescing `??`, lambdas (`(x) => ...` e `|x| ...`), strings interpoladas (`"${expr}"`), raw strings, byte strings e c-strings.
- **Queries prontas para editores:**
  - [`queries/highlights.scm`](./queries/highlights.scm) — syntax highlighting (Neovim, Zed, Helix, Emacs)
  - [`queries/locals.scm`](./queries/locals.scm) — escopos, definições e referências locais
  - [`queries/folds.scm`](./queries/folds.scm) — dobramento de blocos, structs, enums e match
  - [`queries/indents.scm`](./queries/indents.scm) — indentação estrutural

## Desenvolvimento e Testes

```bash
npm install
npx tree-sitter generate
npx tree-sitter test
npx tree-sitter parse caminho/para/arquivo.aru
```

## Licença

MIT — consulte [LICENSE](./LICENSE).
