export function getCameraErrorMessage(error: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "A camera do navegador no celular exige HTTPS. Abra este app por um link seguro (https) para liberar a camera.";
  }

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
    return "Este navegador nao oferece suporte completo a camera. Tente Chrome ou Safari atualizados.";
  }

  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "O acesso a camera foi bloqueado. Libere a permissao da camera no navegador e tente novamente.";
  }
  if (error instanceof DOMException && ["NotFoundError", "DevicesNotFoundError"].includes(error.name)) {
    return "Nenhuma camera foi encontrada neste dispositivo.";
  }
  if (error instanceof DOMException && ["NotReadableError", "TrackStartError"].includes(error.name)) {
    return "A camera parece estar em uso por outro app. Feche outros aplicativos e tente novamente.";
  }

  return "Nao foi possivel iniciar a camera neste celular. Voce ainda pode tirar ou selecionar uma foto.";
}
