export function calcularLimiarAutomatico(intensidades: number[]) {
  const hist = new Array(256).fill(0);
  intensidades.forEach((valor) => {
    const index = Math.floor(valor);
    if (index >= 0 && index < 256) hist[index] += 1;
  });
  const total = intensidades.length;
  let sum = 0;
  for (let index = 0; index < 256; index += 1) sum += index * hist[index];
  let sumBackground = 0;
  let weightBackground = 0;
  let bestVariance = 0;
  let threshold = 0;
  for (let index = 0; index < 256; index += 1) {
    weightBackground += hist[index];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;
    sumBackground += index * hist[index];
    const variance = weightBackground * weightForeground * ((sumBackground / weightBackground) - ((sum - sumBackground) / weightForeground)) ** 2;
    if (variance > bestVariance) { bestVariance = variance; threshold = index; }
  }
  return threshold;
}
