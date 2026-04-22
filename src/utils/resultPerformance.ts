export function calculatePerformance(
  respostas: string[],
  referencia: string[]
) {
  const totalQuestoes = referencia.length;
  const acertos = referencia.filter(
    (correta, index) => correta === respostas[index]
  ).length;
  const nota =
    totalQuestoes > 0
      ? Number(((acertos / totalQuestoes) * 10).toFixed(1))
      : 0;

  return { acertos, nota };
}
