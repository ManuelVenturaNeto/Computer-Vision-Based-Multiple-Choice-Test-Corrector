export const OPENAI_STUDENT_EXTRACTION_PROMPT = `Analise esta imagem de um documento de aluno universitario.
Extraia:
1. O NOME do aluno: encontra-se proximo ao texto "Nome:" na imagem. O nome e composto somente por letras e espacos.
2. A MATRICULA do aluno: encontra-se proximo ao texto "Matricula:" ou "Matricula". Ela tem exatamente 6 digitos numericos.

Retorne APENAS um JSON valido no formato: {"nome": "...", "matricula": "..."}
Se nao encontrar algum campo, deixe como string vazia "".`;
