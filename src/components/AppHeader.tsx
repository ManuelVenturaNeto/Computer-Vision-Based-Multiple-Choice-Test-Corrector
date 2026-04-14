import {
  Check,
  ChevronLeft,
  Copy,
  FileSpreadsheet,
  Settings,
} from "lucide-react";

import type { AppView } from "@/types";

interface AppHeaderProps {
  view: AppView;
  showExportActions: boolean;
  copiedJSON: boolean;
  onBack: () => void;
  onCopyJSON: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
  onOpenSettings: () => void;
}

export function AppHeader({
  view,
  showExportActions,
  copiedJSON,
  onBack,
  onCopyJSON,
  onExportExcel,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 shadow-md z-10"
      style={{ backgroundColor: "#003DA5" }}
    >
      <div className="flex items-center gap-2">
        {view === "corrigir" && (
          <button onClick={onBack} className="text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        )}
        <div>
          <p className="text-white text-xs opacity-70 leading-none">
            PUC Minas
          </p>
          <h1 className="text-white leading-tight">
            {view === "home" ? "Corretor de Provas" : "Corrigir Provas"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showExportActions && (
          <>
            <button
              onClick={onCopyJSON}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-white/30 text-white"
              title="Copiar como JSON"
            >
              {copiedJSON ? (
                <Check size={14} className="text-green-300" />
              ) : (
                <Copy size={14} />
              )}
              {copiedJSON ? "Copiado!" : "JSON"}
            </button>
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-white/30 text-white"
              title="Exportar Excel"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>
          </>
        )}

        <button onClick={onOpenSettings} className="text-white p-1">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
