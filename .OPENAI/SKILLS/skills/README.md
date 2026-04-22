Este repositório contém uma suíte de 8 skills de engenharia de software prontas para uso no Codex.

## 📂 Skills Disponíveis

| Nome | Descrição |
| :--- | :--- |
| [🔍 code-review](./code-review/SKILL.md) | Especialista em análise de qualidade, bugs e segurança. |
| [🏗️ code-refactor](./code-refactor/SKILL.md) | Arquiteto de código limpo e padrões de projeto. |
| [🕵️ code-debug](./code-debug/SKILL.md) | Detetive de bugs, stack traces e erros de runtime. |
| [⚡ code-generate](./code-generate/SKILL.md) | Gerador de boilerplate e implementação completa. |
| [📖 code-explain](./code-explain/SKILL.md) | Tradutor técnico para lógica e arquitetura complexa. |
| [🧪 code-test](./code-test/SKILL.md) | Engenheiro de automação de testes (Jest, PyTest, etc). |
| [🚀 code-optimize](./code-optimize/SKILL.md) | Especialista em performance, Big O e eficiência. |
| [🔧 skill-manager](./skill-manager/SKILL.md) | Gerenciador de ciclo de vida e criação de novas skills. |

## 🚀 Como Usar

Para ativar qualquer uma dessas skills, basta usar um dos gatilhos descritos no campo `description` de cada arquivo `SKILL.md`.

Exemplos:
- "Codex, **revise meu código**..." (Aciona `code-review`)
- "**Refatore** essa função para usar padrões de projeto..." (Aciona `code-refactor`)
- "**Explique** como funciona esse algoritmo de busca..." (Aciona `code-explain`)
- "**Crie testes** unitários para este componente React..." (Aciona `code-test`)

## 🛠️ Instalação Local

Se você clonou este repositório no seu workspace, o Codex detectará automaticamente as skills na pasta `skills/`.
