/**
 * Direct port of algo.html processing logic.
 * Reads an answer sheet image using OpenCV.js with the exact same algorithm.
 */

const OPENCV_URL = "https://docs.opencv.org/4.x/opencv.js";

declare global {
  interface Window {
    cv?: any;
  }
}

let cvLoadPromise: Promise<void> | null = null;

function ensureOpenCv(): Promise<void> {
  if (window.cv && typeof window.cv.imread === "function") {
    return Promise.resolve();
  }

  if (cvLoadPromise) return cvLoadPromise;

  cvLoadPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout ao carregar OpenCV.js"));
    }, 30000);

    const poll = () => {
      const id = setInterval(() => {
        if (window.cv && typeof window.cv.imread === "function") {
          clearInterval(id);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);
    };

    if (document.querySelector('script[src*="opencv.js"]')) {
      poll();
      return;
    }

    const script = document.createElement("script");
    script.src = OPENCV_URL;
    script.async = true;
    script.onload = poll;
    script.onerror = () => {
      clearTimeout(timeout);
      cvLoadPromise = null;
      reject(new Error("Falha ao carregar OpenCV.js"));
    };
    document.head.appendChild(script);
  });

  cvLoadPromise.catch(() => {
    cvLoadPromise = null;
  });

  return cvLoadPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
    img.src = src;
  });
}

// Exact copy of algo.html calcularLimiarAutomatico
function calcularLimiarAutomatico(intensidades: number[]): number {
  const hist = new Array(256).fill(0);
  for (const val of intensidades) {
    const idx = Math.floor(val);
    if (idx >= 0 && idx < 256) hist[idx]++;
  }
  const total = intensidades.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0,
    wB = 0;
  let varMax = 0,
    threshold = 0;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = i;
    }
  }
  return threshold;
}

export interface AnswerSheetResult {
  numQuestoes: number;
  respostas: string[];
  warnings: string[];
  provider: "opencv.js";
  maskImage: string;
  table: {
    x: number;
    y: number;
    width: number;
    height: number;
    cellWidth: number;
    cellHeight: number;
    rowCount: number;
    colCount: number;
  };
}

/**
 * Processes an answer sheet image using the exact same algorithm as algo.html.
 */
export async function processAnswerSheet(
  imageDataUrl: string,
  onProgress?: (status: string) => void
): Promise<AnswerSheetResult> {
  onProgress?.("Carregando OpenCV...");
  await ensureOpenCv();
  const cv = window.cv;

  onProgress?.("Processando imagem...");

  // Load image into a canvas (algo.html: fileInput.onchange -> drawImage)
  const img = await loadImage(imageDataUrl);
  const originalCanvas = document.createElement("canvas");
  originalCanvas.width = img.width;
  originalCanvas.height = img.height;
  originalCanvas.getContext("2d")!.drawImage(img, 0, 0);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 400;
  maskCanvas.height = 500;

  // ---- All cv.Mat objects for cleanup ----
  let src: any,
    gray: any,
    blurred: any,
    thresh: any,
    contours: any,
    hierarchy: any,
    approx: any,
    srcPoints: any,
    dstPoints: any,
    M: any,
    warped: any,
    warpedGray: any,
    warpedResult: any,
    maskResized: any;

  try {
    // algo.html: const src = cv.imread(originalCanvas);
    src = cv.imread(originalCanvas);

    // ---- 1. Warp (correcao de perspectiva) ----
    // algo.html lines 217-248: gray -> blur -> threshold -> findContours -> largest -> approxPolyDP -> warp
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    thresh = new cv.Mat();
    cv.threshold(
      blurred,
      thresh,
      0,
      255,
      cv.THRESH_BINARY_INV + cv.THRESH_OTSU
    );
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(
      thresh,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    let maxArea = 0,
      maxIdx = -1;
    for (let i = 0; i < contours.size(); i++) {
      const a = cv.contourArea(contours.get(i));
      if (a > maxArea) {
        maxArea = a;
        maxIdx = i;
      }
    }
    if (maxIdx === -1) throw new Error("Folha nao encontrada.");

    const cnt = contours.get(maxIdx);
    const peri = cv.arcLength(cnt, true);
    approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
    if (approx.rows !== 4)
      throw new Error(`Cantos detectados: ${approx.rows} (esperado 4).`);

    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 4; i++)
      pts.push({
        x: approx.data32S[i * 2],
        y: approx.data32S[i * 2 + 1],
      });
    pts.sort((a, b) => a.x + a.y - (b.x + b.y));
    const tl = pts[0],
      br = pts[3];
    const tr = pts.find((p) => p.x > tl.x && p.y < br.y) || pts[1];
    const bl = pts.find((p) => p.x < br.x && p.y > tl.y) || pts[2];

    srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x,
      tl.y,
      tr.x,
      tr.y,
      br.x,
      br.y,
      bl.x,
      bl.y,
    ]);
    const warpW = 900,
      warpH = 1100;
    dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      warpW,
      0,
      warpW,
      warpH,
      0,
      warpH,
    ]);
    M = cv.getPerspectiveTransform(srcPoints, dstPoints);
    warped = new cv.Mat();
    cv.warpPerspective(src, warped, M, new cv.Size(warpW, warpH));
    warpedGray = new cv.Mat();
    cv.cvtColor(warped, warpedGray, cv.COLOR_RGBA2GRAY);

    // ---- 2. Grade geometrica: 11 linhas x 6 colunas ----
    // algo.html lines 251-283
    const margin = 40;
    const totalRows = 11;
    const totalCols = 6;
    const ignoreTop = 1;
    const ignoreLeft = 1;
    const rows = totalRows - ignoreTop; // 10
    const cols = totalCols - ignoreLeft; // 5

    const startX = margin;
    const startY = margin;
    const cellWidth = (warpW - 2 * margin) / totalCols;
    const cellHeight = (warpH - 2 * margin) / totalRows;

    const allCells: Array<{
      row: number;
      col: number;
      x: number;
      y: number;
      w: number;
      h: number;
    }> = [];
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        allCells.push({
          row: r,
          col: c,
          x: Math.floor(startX + c * cellWidth),
          y: Math.floor(startY + r * cellHeight),
          w: Math.floor(cellWidth),
          h: Math.floor(cellHeight),
        });
      }
    }

    const cells: Array<{
      q: number;
      alt: number;
      x: number;
      y: number;
      w: number;
      h: number;
    }> = [];
    for (let r = ignoreTop; r < totalRows; r++) {
      for (let c = ignoreLeft; c < totalCols; c++) {
        const cell = allCells[r * totalCols + c];
        cells.push({
          q: r - ignoreTop,
          alt: c - ignoreLeft,
          x: cell.x,
          y: cell.y,
          w: cell.w,
          h: cell.h,
        });
      }
    }

    // ---- 3. Intensidade media de cada celula de resposta ----
    // algo.html lines 286-292
    const intensidades: number[] = [];
    for (const cell of cells) {
      const roi = warpedGray.roi(
        new cv.Rect(cell.x, cell.y, cell.w, cell.h)
      );
      intensidades.push(cv.mean(roi)[0]);
      roi.delete();
    }

    // ---- 4. Limiar automatico (Otsu) ----
    // algo.html lines 295-296
    const limiar = calcularLimiarAutomatico(intensidades);

    // ---- 5. Detectar a alternativa mais escura por questao ----
    // algo.html lines 299-328
    const detectedAlts: number[] = [];
    let invalid = false;
    let todasMuitoClaras = true;
    let todasMuitoEscuras = true;

    for (let q = 0; q < rows; q++) {
      const rowIntensities: number[] = [];
      for (let alt = 0; alt < cols; alt++) {
        rowIntensities.push(intensidades[q * cols + alt]);
      }
      const minIntensity = Math.min(...rowIntensities);
      const maxIntensity = Math.max(...rowIntensities);
      const diff = maxIntensity - minIntensity;
      const bestAlt = rowIntensities.indexOf(minIntensity);
      const isMarked = diff > 20 && minIntensity < limiar;

      if (!isMarked) {
        if (minIntensity > 200) todasMuitoClaras = true;
        if (maxIntensity < 150) todasMuitoEscuras = true;
        invalid = true;
        detectedAlts.push(-1);
      } else {
        detectedAlts.push(bestAlt);
      }
    }

    // ---- 6. Desenhar grade roxa + circulos vermelhos ----
    // algo.html lines 350-377
    warpedResult = warped.clone();
    const roxo = new cv.Scalar(255, 0, 255);
    for (let r = 0; r <= totalRows; r++) {
      const y = startY + r * cellHeight;
      cv.line(
        warpedResult,
        new cv.Point(startX, y),
        new cv.Point(startX + totalCols * cellWidth, y),
        roxo,
        2
      );
    }
    for (let c = 0; c <= totalCols; c++) {
      const x = startX + c * cellWidth;
      cv.line(
        warpedResult,
        new cv.Point(x, startY),
        new cv.Point(x, startY + totalRows * cellHeight),
        roxo,
        2
      );
    }

    const respostas: string[] = [];

    if (!invalid) {
      for (let q = 0; q < rows; q++) {
        const alt = detectedAlts[q];
        const cell = cells.find((c) => c.q === q && c.alt === alt)!;
        const centerX = cell.x + cell.w / 2;
        const centerY = cell.y + cell.h / 2;
        const radius = Math.min(cell.w, cell.h) * 0.35;
        cv.circle(
          warpedResult,
          new cv.Point(centerX, centerY),
          radius,
          new cv.Scalar(0, 0, 255),
          -1
        );
        respostas.push(String.fromCharCode(65 + alt));
      }
    }

    // Exibir mascara redimensionada
    // algo.html lines 375-377
    maskResized = new cv.Mat();
    cv.resize(
      warpedResult,
      maskResized,
      new cv.Size(maskCanvas.width, maskCanvas.height),
      0,
      0,
      cv.INTER_AREA
    );
    cv.imshow(maskCanvas, maskResized);
    const maskImage = maskCanvas.toDataURL("image/png");

    // ---- Validacao (algo.html lines 330-347) ----
    if (invalid) {
      if (todasMuitoClaras) {
        throw new Error(
          "Gabarito em branco - nenhuma resposta detectada."
        );
      }
      if (todasMuitoEscuras) {
        throw new Error(
          "Gabarito invalido - todas as celulas estao marcadas."
        );
      }
      throw new Error(
        "Marcacoes inconsistentes - verifique se ha exatamente uma resposta por questao."
      );
    }

    return {
      numQuestoes: rows,
      respostas,
      warnings: [],
      provider: "opencv.js",
      maskImage,
      table: {
        x: startX + ignoreLeft * cellWidth,
        y: startY + ignoreTop * cellHeight,
        width: cols * cellWidth,
        height: rows * cellHeight,
        cellWidth,
        cellHeight,
        rowCount: rows,
        colCount: cols,
      },
    };
  } finally {
    src?.delete?.();
    gray?.delete?.();
    blurred?.delete?.();
    thresh?.delete?.();
    contours?.delete?.();
    hierarchy?.delete?.();
    approx?.delete?.();
    srcPoints?.delete?.();
    dstPoints?.delete?.();
    M?.delete?.();
    warped?.delete?.();
    warpedGray?.delete?.();
    warpedResult?.delete?.();
    maskResized?.delete?.();
  }
}
