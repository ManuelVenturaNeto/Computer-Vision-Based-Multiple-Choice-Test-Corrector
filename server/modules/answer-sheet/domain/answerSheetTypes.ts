export interface BitmapLikeImage {
  bitmap: {
    width: number;
    height: number;
    data: Uint8Array;
  };
}

export interface Cell {
  row: number;
  col: number;
  intensity: number;
}

export interface FullTableRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
}

export interface TableRegion extends FullTableRegion {
  rowCount: number;
  colCount: number;
}

export interface AnswerSheetExtraction {
  numQuestoes: number;
  respostas: string[];
  warnings: string[];
  table: TableRegion;
  maskImage: string;
  provider: "jimp";
}

export interface AnswerSheetReadOptions {
  expectedQuestionCount?: number;
}
