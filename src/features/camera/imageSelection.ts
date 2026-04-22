const MAX_SELECTED_IMAGE_DIMENSION = 1600;
const SELECTED_IMAGE_QUALITY = 0.82;

export function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function loadImageFromUrl(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error("Nao foi possivel ler a imagem selecionada."));
    };
    image.src = imageUrl;
  });
}

export function readImageFileAsDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Selecione uma imagem valida."));
  }

  const imageUrl = URL.createObjectURL(file);

  return loadImageFromUrl(imageUrl)
    .then((image) => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      if (!width || !height) {
        throw new Error("Nao foi possivel ler a imagem selecionada.");
      }

      const scale = Math.min(
        1,
        MAX_SELECTED_IMAGE_DIMENSION / Math.max(width, height)
      );
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Nao foi possivel preparar a imagem selecionada.");
      }

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, targetWidth, targetHeight);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      return canvas.toDataURL("image/jpeg", SELECTED_IMAGE_QUALITY);
    })
    .catch((error: unknown) => {
      throw error instanceof Error
        ? error
        : new Error("Nao foi possivel ler a imagem selecionada.");
    })
    .finally(() => {
      URL.revokeObjectURL(imageUrl);
    });
}
