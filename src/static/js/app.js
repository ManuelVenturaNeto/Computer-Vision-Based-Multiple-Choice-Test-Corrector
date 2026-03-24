const appConfig = JSON.parse(document.getElementById("appConfig").textContent);

const video = document.getElementById("webcamVideo");
const canvas = document.getElementById("captureCanvas");
const canvasContext = canvas.getContext("2d");

const btnStartCamera = document.getElementById("btnStartCamera");
const btnStopCamera = document.getElementById("btnStopCamera");
const btnCapture = document.getElementById("btnCapture");

const statusBadge = document.getElementById("statusBadge");
const statusText = statusBadge.querySelector(".status-text");
const serviceNote = document.getElementById("serviceNote");

const webcamPlaceholder = document.getElementById("webcamPlaceholder");
const webcamOverlay = document.getElementById("webcamOverlay");

const loadingOverlay = document.getElementById("loadingOverlay");

const resultPanel = document.getElementById("resultPanel");
const resultSummary = document.getElementById("resultSummary");
const resultName = document.getElementById("resultName");
const resultCode = document.getElementById("resultCode");
const resultSnapshot = document.getElementById("resultSnapshot");

let cameraStream = null;
let isProcessing = false;

function setStatus(message, state = "idle") {
    statusText.textContent = message;
    statusBadge.dataset.state = state;
}

function getFileName(filePath) {
    if (!filePath) {
        return "unknown file";
    }

    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || filePath;
}

function showCameraView(isVisible) {
    webcamPlaceholder.hidden = isVisible;
    webcamOverlay.classList.toggle("active", isVisible);
}

function updateButtons() {
    const cameraIsOpen = Boolean(cameraStream);

    btnStartCamera.disabled = cameraIsOpen || isProcessing;
    btnStopCamera.disabled = !cameraIsOpen || isProcessing;
    btnCapture.disabled = !cameraIsOpen || isProcessing || !appConfig.processingReady;
}

function showResult(data) {
    resultPanel.classList.remove("is-error");
    resultPanel.classList.add("has-result");

    resultSummary.textContent = data.name || data.code
        ? "Picture processed successfully."
        : "The picture was processed, but the values were not clear enough to read.";

    resultName.textContent = data.name || "Not found";
    resultCode.textContent = data.code || "Not found";
    resultSnapshot.textContent = `Saved image: ${getFileName(data.snapshot)}`;
}

function showError(message) {
    resultPanel.classList.add("has-result", "is-error");
    resultSummary.textContent = message;
    resultName.textContent = "No result";
    resultCode.textContent = "No result";
    resultSnapshot.textContent = "No saved image.";
}

async function openCamera() {
    if (cameraStream || isProcessing) {
        return;
    }

    try {
        setStatus("Opening camera...", "busy");

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "environment",
            },
        });

        video.srcObject = cameraStream;
        await video.play();

        showCameraView(true);
        setStatus("Camera is open.", "ready");
    } catch (error) {
        console.error("Camera access error:", error);
        showCameraView(false);
        setStatus("Camera access was denied.", "error");
        alert("Could not open the camera. Please allow camera access and try again.");
    } finally {
        updateButtons();
    }
}

function closeCamera() {
    if (!cameraStream) {
        updateButtons();
        return;
    }

    for (const track of cameraStream.getTracks()) {
        track.stop();
    }

    cameraStream = null;
    video.srcObject = null;

    showCameraView(false);
    setStatus("Camera is closed.", "idle");
    updateButtons();
}

async function takePicture() {
    if (!cameraStream || isProcessing) {
        return;
    }

    if (!appConfig.processingReady) {
        setStatus(appConfig.serviceMessage, "error");
        alert(appConfig.serviceMessage);
        return;
    }

    if (!video.videoWidth || !video.videoHeight) {
        setStatus("Camera image is still loading.", "error");
        alert("Please wait a moment for the camera image to load.");
        return;
    }

    isProcessing = true;
    updateButtons();
    setStatus("Reading picture...", "busy");
    loadingOverlay.classList.add("active");

    try {
        const maxSize = 1600;
        const largestSide = Math.max(video.videoWidth, video.videoHeight);
        const scale = largestSide > maxSize ? maxSize / largestSide : 1;

        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/png");
        const response = await fetch("/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData }),
        });

        let data = {};

        try {
            data = await response.json();
        } catch (parseError) {
            console.error("Response parse error:", parseError);
        }

        if (!response.ok) {
            throw new Error(data.error || "Could not read the picture.");
        }

        showResult(data);
        setStatus("Picture read successfully.", "ready");
    } catch (error) {
        console.error("Picture processing error:", error);
        showError(error.message || "Could not read the picture.");
        setStatus("Could not read the picture.", "error");
        alert(error.message || "Could not read the picture.");
    } finally {
        isProcessing = false;
        loadingOverlay.classList.remove("active");
        updateButtons();
    }
}

btnStartCamera.addEventListener("click", openCamera);
btnStopCamera.addEventListener("click", closeCamera);
btnCapture.addEventListener("click", takePicture);
window.addEventListener("beforeunload", closeCamera);

serviceNote.textContent = appConfig.serviceMessage;
serviceNote.classList.toggle("is-error", !appConfig.processingReady);

showCameraView(false);
updateButtons();

if (appConfig.processingReady) {
    setStatus("Ready to open the camera.", "idle");
} else {
    setStatus(appConfig.serviceMessage, "error");
}
