export function buildAnswerSheetPrompt(
  questionCount: number,
  alternativeCount: number,
  validOptions: readonly string[]
): string {
  return (
    `Voce e um leitor de gabaritos de provas. ` +
    `Analise a imagem e identifique qual alternativa esta marcada em cada questao.\n\n` +
    `Regras:\n` +
    `- O gabarito possui exatamente ${questionCount} questoes.\n` +
    `- Cada questao tem ${alternativeCount} alternativas: ${validOptions.join(", ")}.\n` +
    `- Responda com JSON valido no formato: {"respostas": ["A","C","",...]}.\n` +
    `- O array "respostas" deve ter exatamente ${questionCount} elementos.\n` +
    `- Use "" (string vazia) para questoes sem marcacao clara ou com marcacao invalida.\n` +
    `- Use apenas letras maiusculas das alternativas validas: ${validOptions.join(", ")}.\n` +
    `- Nao inclua nenhum texto fora do JSON.`
  );
}
