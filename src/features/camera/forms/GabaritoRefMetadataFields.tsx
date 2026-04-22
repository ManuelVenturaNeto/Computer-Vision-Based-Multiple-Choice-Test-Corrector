interface GabaritoRefMetadataFieldsProps {
  disciplina: string;
  dataProva: string;
  disciplinaError?: string;
  onDisciplinaChange: (value: string) => void;
  onDataProvaChange: (value: string) => void;
}

export function GabaritoRefMetadataFields(props: GabaritoRefMetadataFieldsProps) {
  const { disciplina, dataProva, disciplinaError, onDisciplinaChange, onDataProvaChange } = props;

  return (
    <>
      <div><label className="block text-sm text-gray-600 mb-1">Disciplina</label><input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700" placeholder="Ex: Cálculo I" value={disciplina} onChange={(event) => onDisciplinaChange(event.target.value)} />{disciplinaError && <p className="text-red-500 text-xs mt-1">{disciplinaError}</p>}</div>
      <div><label className="block text-sm text-gray-600 mb-1">Data da Prova</label><input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700" value={dataProva} onChange={(event) => onDataProvaChange(event.target.value)} /></div>
      <div><label className="block text-sm text-gray-600 mb-1">Número de Questões</label><div className="w-full rounded-xl px-3 py-2.5 text-sm border border-gray-200" style={{ backgroundColor: "#EEF3FC", color: "#003DA5" }}>10 questões fixas</div></div>
    </>
  );
}
