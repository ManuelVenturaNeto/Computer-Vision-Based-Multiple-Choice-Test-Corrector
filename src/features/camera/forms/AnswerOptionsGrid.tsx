import { OPCOES } from "../constants";

interface AnswerOptionsGridProps {
  numQuestoes: number;
  respostas: string[];
  onRespostaChange: (index: number, opcao: string) => void;
}

export function AnswerOptionsGrid(props: AnswerOptionsGridProps) {
  const { numQuestoes, respostas, onRespostaChange } = props;

  return (
    <div className="space-y-2">
      {Array.from({ length: numQuestoes }).map((_, index) => (
        <div key={index} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
          <span className="text-xs text-gray-500 w-6 shrink-0">{index + 1}.</span>
          <div className="flex gap-1.5 flex-1">{OPCOES.map((opcao) => <AnswerButton key={opcao} active={respostas[index] === opcao} onClick={() => onRespostaChange(index, opcao)} label={opcao} />)}</div>
        </div>
      ))}
    </div>
  );
}

function AnswerButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex-1 py-1.5 rounded-lg text-xs border transition-all" style={active ? { backgroundColor: "#003DA5", color: "white", borderColor: "#003DA5" } : { backgroundColor: "white", color: "#374151", borderColor: "#D1D5DB" }}>{label}</button>;
}
