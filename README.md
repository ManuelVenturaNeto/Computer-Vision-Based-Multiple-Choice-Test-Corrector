# Student Sheet Reader

Aplicativo mobile-first em Expo + API Node/TypeScript para leitura e correcao de gabaritos pelo celular.

## Estrutura

- `App.tsx` e `src/`: app Expo nativo
- `server/`: API local em TypeScript
- `scripts/dev-phone.sh`: fluxo pronto para Expo Go com tunel da API e do Metro
- `tests/`: testes das regras principais

## Configuracao

1. Instale as dependencias na raiz:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Configure pelo menos:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
API_PORT=8787
```

## Rodar

### Desenvolvimento local

```bash
npm run dev
```

Isso sobe:

- a API Node em `http://127.0.0.1:8787`
- o app Expo localmente

### Expo Go no celular

```bash
npm run dev:phone
```

Esse comando:

- sobe a API local
- cria um link publico para a API
- cria um proxy publico para o Metro
- gera o QR do Expo Go

## Scripts uteis

```bash
npm run typecheck
npm test
npm run perf
```

## API

### `GET /api/health`

Retorna o status da API e se a leitura automatica esta pronta.

### `POST /api/extract-student`

Request:

```json
{
  "imageBase64": "..."
}
```

Response:

```json
{
  "nome": "Aluno",
  "matricula": "123456",
  "provider": "openai",
  "model": "gpt-4.1-mini"
}
```

## Seguranca

- A chave da OpenAI fica apenas no `.env` server-side.
- Nenhum segredo deve ser colocado em `EXPO_PUBLIC_*`.
- O app mobile fala com a OpenAI somente por meio da API local.
