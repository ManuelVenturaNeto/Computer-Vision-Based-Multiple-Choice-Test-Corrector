import type { BitmapLikeImage } from "../../domain/answerSheetTypes.js";

export function drawHLine(data: Uint8Array, image: BitmapLikeImage, x1: number, x2: number, y: number, color: number[]) {
  const [r, g, b] = color;
  for (let offset = -1; offset <= 1; offset += 1) {
    const pixelY = Math.round(y) + offset;
    if (pixelY < 0 || pixelY >= image.bitmap.height) continue;
    for (let pixelX = Math.round(x1); pixelX <= Math.round(x2); pixelX += 1) paintPixel(data, image, pixelX, pixelY, r, g, b);
  }
}

export function drawVLine(data: Uint8Array, image: BitmapLikeImage, x: number, y1: number, y2: number, color: number[]) {
  const [r, g, b] = color;
  for (let offset = -1; offset <= 1; offset += 1) {
    const pixelX = Math.round(x) + offset;
    if (pixelX < 0 || pixelX >= image.bitmap.width) continue;
    for (let pixelY = Math.round(y1); pixelY <= Math.round(y2); pixelY += 1) paintPixel(data, image, pixelX, pixelY, r, g, b);
  }
}

export function drawFilledCircle(
  data: Uint8Array,
  image: BitmapLikeImage,
  centerX: number,
  centerY: number,
  radius: number,
  color: number[]
) {
  const [r, g, b] = color;
  const radiusSquared = radius * radius;
  for (let pixelY = Math.floor(centerY - radius); pixelY <= Math.ceil(centerY + radius); pixelY += 1) {
    for (let pixelX = Math.floor(centerX - radius); pixelX <= Math.ceil(centerX + radius); pixelX += 1) {
      const distanceSquared = (pixelX - centerX) ** 2 + (pixelY - centerY) ** 2;
      if (distanceSquared <= radiusSquared) paintPixel(data, image, pixelX, pixelY, r, g, b);
    }
  }
}

function paintPixel(data: Uint8Array, image: BitmapLikeImage, x: number, y: number, r: number, g: number, b: number) {
  if (x < 0 || x >= image.bitmap.width || y < 0 || y >= image.bitmap.height) return;
  const index = (y * image.bitmap.width + x) * 4;
  data[index] = r;
  data[index + 1] = g;
  data[index + 2] = b;
  data[index + 3] = 255;
}
