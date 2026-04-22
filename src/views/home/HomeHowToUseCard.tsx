const HOME_STEPS = [
  "Leia o gabarito de referência com a câmera",
  'Clique em "Corrigir Provas"',
  "Adicione alunos e leia os gabaritos individualmente",
  "Exporte as notas em JSON ou Excel",
];

export function HomeHowToUseCard() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <p className="text-sm text-gray-600 mb-3">Como usar:</p>
      <div className="space-y-2.5">
        {HOME_STEPS.map((texto, index) => (
          <div key={texto} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0" style={{ backgroundColor: "#003DA5" }}>{index + 1}</span>
            <p className="text-sm text-gray-600">{texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
