import { Scan } from "lucide-react";

export function StudentTableEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EEF3FC" }}>
        <Scan size={28} style={{ color: "#003DA5" }} />
      </div>
      <p className="text-gray-500 text-sm">
        Nenhum aluno adicionado ainda.
        <br />
        Clique em <strong>"+ Adicionar Aluno"</strong> para começar.
      </p>
    </div>
  );
}
