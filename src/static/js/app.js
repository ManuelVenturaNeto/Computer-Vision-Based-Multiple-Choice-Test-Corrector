const appConfig = JSON.parse(document.getElementById("appConfig").textContent);

const video = document.getElementById("webcamVideo");
const canvas = document.getElementById("captureCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStartCamera");
const btnCapture = document.getElementById("btnCapture");
const providerSelect = document.getElementById("providerSelect");
const modelInput = document.getElementById("modelInput");
const modelSuggestions = document.getElementById("modelSuggestions");
const providerHint = document.getElementById("providerHint");
const keyStatus = document.getElementById("keyStatus");
const statusBadge = document.getElementById("statusBadge");
const statusText = statusBadge.querySelector(".status-text");
const webcamPlaceholder = document.getElementById("webcamPlaceholder");
const webcamOverlay = document.getElementById("webcamOverlay");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingSub = document.getElementById("loadingSub");
const resultPanel = document.getElementById("resultPanel");
const resultSummary = document.getElementById("resultSummary");
const resultName = document.getElementById("resultName");
const resultCode = document.getElementById("resultCode");
const resultProvider = document.getElementById("resultProvider");
const resultModel = document.getElementById("resultModel");
const resultSnapshot = document.getElementById("resultSnapshot");

let cameraStream = null;
let isProcessing = false;
let autoFilledModel = "";

function updateStatus(text, state = "") {
    statusText.textContent = text;
    statusBadge.className = "status-badge " + state;
}

function basename(filePath) {
    if (!filePath) return "—";
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || filePath;
}

function getProviderConfig(provider = providerSelect.value) {
    return appConfig.providers[provider];
}

function renderProviderOptions() {
    providerSelect.innerHTML = "";

    for (const [providerKey, config] of Object.entries(appConfig.providers)) {
        const option = document.createElement("option");
        option.value = providerKey;
        option.textContent = config.configured
            ? config.label
            : `${config.label} (missing key)`;
        providerSelect.appendChild(option);
    }

    providerSelect.value = appConfig.defaultProvider;
}

function renderProviderState(forceDefaultModel = false) {
    const config = getProviderConfig();
    if (!config) return;

    modelSuggestions.innerHTML = "";
    for (const modelName of config.suggestedModels) {
        const option = document.createElement("option");
        option.value = modelName;
        modelSuggestions.appendChild(option);
    }

    if (
        forceDefaultModel ||
        !modelInput.value.trim() ||
        modelInput.value.trim() === autoFilledModel
    ) {
        modelInput.value = config.defaultModel;
    }
    autoFilledModel = config.defaultModel;

    providerHint.textContent = config.configured
        ? `${config.label} is configured. Requests will use ${config.envVar}.`
        : `${config.label} is not configured yet. You can still capture, but processing will fail until you set ${config.envVar} and restart the app.`;

    const configuredLabels = Object.values(appConfig.providers)
        .filter((provider) => provider.configured)
        .map((provider) => provider.label);

    keyStatus.textContent = configuredLabels.length
        ? `Configured providers: ${configuredLabels.join(", ")}.`
        : "No provider is configured yet. Add OPENAI_API_KEY or GEMINI_API_KEY, then reload the page.";

    updateCaptureAvailability();
}

function updateCaptureAvailability() {
    const canCapture = Boolean(cameraStream) &&
        Boolean(modelInput.value.trim()) &&
        !isProcessing;

    btnCapture.disabled = !canCapture;
    if (!cameraStream) {
        btnCapture.title = "Start the camera first.";
        return;
    }
    if (!modelInput.value.trim()) {
        btnCapture.title = "Enter a model name first.";
        return;
    }
    btnCapture.title = "";
}

async function startCamera() {
    if (cameraStream) return;

    try {
        updateStatus("Starting camera...", "processing");

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 3840 },
                height: { ideal: 2160 },
                facingMode: "environment",
            },
        });

        video.srcObject = cameraStream;
        await video.play();

        webcamPlaceholder.style.display = "none";
        webcamOverlay.classList.add("active");
        btnStart.disabled = true;
        btnStart.textContent = "Camera Active";

        updateStatus("Camera ready", "ready");
        updateCaptureAvailability();
    } catch (error) {
        console.error("Camera access error:", error);
        updateStatus("Camera access denied", "error");
        alert("Could not access the camera. Allow camera permissions and reload the page.");
    }
}

function renderResult(result) {
    resultPanel.classList.remove("is-error");
    resultPanel.classList.add("has-result");
    resultSummary.textContent = result.name || result.code
        ? "Latest extraction completed."
        : "The model did not find readable values near the requested labels.";
    resultName.textContent = result.name || "Not found near NOME:";
    resultCode.textContent = result.code || "Not found near Matricula:";
    resultProvider.textContent = getProviderConfig(result.provider)?.label || result.provider;
    resultModel.textContent = result.model || "—";
    resultSnapshot.textContent = basename(result.snapshot);
}

function renderError(message) {
    resultPanel.classList.add("has-result", "is-error");
    resultSummary.textContent = message;
    resultName.textContent = "No result";
    resultCode.textContent = "No result";
    resultProvider.textContent = "—";
    resultModel.textContent = "—";
    resultSnapshot.textContent = "—";
}

async function captureAndProcess() {
    const config = getProviderConfig();
    if (isProcessing || !cameraStream) return;

    if (!modelInput.value.trim()) {
        updateStatus("Choose a model first", "error");
        alert("Enter a model name before capturing.");
        return;
    }

    if (!video.videoWidth || !video.videoHeight) {
        updateStatus("Camera frame is not ready yet", "error");
        alert("The camera is still starting. Wait a moment and try again.");
        return;
    }

    isProcessing = true;
    updateCaptureAvailability();
    updateStatus("Processing capture...", "processing");
    loadingSub.textContent = `Sending the image to ${config.label} using ${modelInput.value.trim()}.`;
    loadingOverlay.classList.add("active");

    try {
        const maxDimension = 1600;
        const largestSide = Math.max(video.videoWidth, video.videoHeight);
        const scale = largestSide > maxDimension
            ? maxDimension / largestSide
            : 1;

        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/png");
        const response = await fetch("/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: imageData,
                provider: providerSelect.value,
                model: modelInput.value.trim(),
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "The server could not process the capture.");
        }

        renderResult(result);
        updateStatus("Capture processed", "ready");
    } catch (error) {
        console.error("Capture error:", error);
        renderError(error.message || "Capture failed.");
        updateStatus("Processing failed", "error");
        alert(error.message || "Failed to process the capture.");
    } finally {
        isProcessing = false;
        loadingOverlay.classList.remove("active");
        updateCaptureAvailability();
    }
}

btnStart.addEventListener("click", startCamera);
btnCapture.addEventListener("click", captureAndProcess);
providerSelect.addEventListener("change", () => renderProviderState(true));
modelInput.addEventListener("input", updateCaptureAvailability);

renderProviderOptions();
renderProviderState(true);
updateStatus("Choose a provider and start the camera.", "");
