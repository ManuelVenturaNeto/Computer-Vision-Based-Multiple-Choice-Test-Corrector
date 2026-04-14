import { useState } from "react";

import ExcelJS from "exceljs";

import type { Aluno, GabaritoReferencia } from "@/types";

export function useExport(
  alunos: Aluno[],
  gabaritoRef: GabaritoReferencia | null
) {
  const [copiedJSON, setCopiedJSON] = useState(false);

  const handleCopyJSON = async () => {
    const data = alunos.map((aluno) => ({
      nome: aluno.nome,
      matricula: aluno.matricula,
      nota: aluno.nota ?? null,
      acertos: aluno.acertos ?? null,
      totalQuestoes: gabaritoRef?.numQuestoes,
      disciplina: gabaritoRef?.disciplina,
      respostas: aluno.gabarito ?? null,
    }));

    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJSON(true);
    window.setTimeout(() => setCopiedJSON(false), 2500);
  };

  const handleExportExcel = async () => {
    if (!gabaritoRef) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(gabaritoRef.disciplina || "Turma");

    worksheet.columns = [
      { header: "Nome", key: "nome", width: 28 },
      { header: "Matrícula", key: "matricula", width: 14 },
      { header: "Disciplina", key: "disciplina", width: 20 },
      { header: "Data da Prova", key: "dataProva", width: 14 },
      { header: "Acertos", key: "acertos", width: 10 },
      {
        header: `Total (${gabaritoRef.numQuestoes})`,
        key: "totalQuestoes",
        width: 12,
      },
      { header: "Nota", key: "nota", width: 10 },
      ...Array.from({ length: gabaritoRef.numQuestoes }, (_, index) => ({
        header: `Q${index + 1}`,
        key: `q${index + 1}`,
        width: 8,
      })),
    ];

    alunos.forEach((aluno) => {
      const row: Record<string, string | number> = {
        nome: aluno.nome,
        matricula: aluno.matricula,
        disciplina: gabaritoRef.disciplina,
        dataProva: gabaritoRef.dataProva,
        acertos: aluno.acertos ?? "-",
        totalQuestoes: gabaritoRef.numQuestoes,
        nota: aluno.nota ?? "-",
      };

      Array.from({ length: gabaritoRef.numQuestoes }).forEach((_, index) => {
        const respostaAluno = aluno.gabarito?.[index] ?? "-";
        const respostaCorreta = gabaritoRef.respostas[index];
        row[`q${index + 1}`] =
          respostaAluno === respostaCorreta
            ? `✓${respostaAluno}`
            : respostaAluno || "-";
      });

      worksheet.addRow(row);
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `notas_${gabaritoRef.disciplina || "turma"}_${gabaritoRef.dataProva}.xlsx`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return { copiedJSON, handleCopyJSON, handleExportExcel };
}
