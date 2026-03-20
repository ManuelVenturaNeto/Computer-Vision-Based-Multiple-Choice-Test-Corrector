/**
 * Student Paper Reader — Frontend Application
 *
 * Handles webcam access, frame capture, real-time live detection
 * with bounding box overlay, server communication, result display,
 * and annotation confirmation flow.
 */

// === DOM Elements ===
const video = document.getElementById("webcamVideo");
const canvas = document.getElementById("captureCanvas");
const ctx = canvas.getContext("2d");
const detectionCanvas = document.getElementById("detectionCanvas");
const detCtx = detectionCanvas.getContext("2d");
const btnStart = document.getElementById("btnStartCamera");
const btnCapture = document.getElementById("btnCapture");
const btnLiveScan = document.getElementById("btnLiveScan");
const statusBadge = document.getElementById("statusBadge");
const statusText = statusBadge.querySelector(".status-text");
const webcamPlaceholder = document.getElementById("webcamPlaceholder");
const webcamOverlay = document.getElementById("webcamOverlay");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalName = document.getElementById("modalName");
const modalCode = document.getElementById("modalCode");
const modalMeta = document.getElementById("modalMeta");
const loadingOverlay = document.getElementById("loadingOverlay");
const liveInfoBar = document.getElementById("liveInfoBar");
const liveName = document.getElementById("liveName");
const liveCode = document.getElementById("liveCode");

// Modal mode elements
const displayMode = document.getElementById("displayMode");
const editMode = document.getElementById("editMode");
const editNameInput = document.getElementById("editName");
const editCodeInput = document.getElementById("editCode");
const confirmButtons = document.getElementById("confirmButtons");
const saveButtons = document.getElementById("saveButtons");
const savedMessage = document.getElementById("savedMessage");

// === State ===
let cameraStream = null;
let isProcessing = false;
let lastResult = null;
let liveScanning = false;
let liveScanTimer = null;
let isLiveProcessing = false;

/**
 * Update the status badge in the header.
 */
function updateStatus(text, state = "") {
    statusText.textContent = text;
    statusBadge.className = "status-badge " + state;
}

/**
 * Start the webcam and display the video feed.
 */
async function startCamera() {
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
        video.play();

        webcamPlaceholder.style.display = "none";
        webcamOverlay.classList.add("active");

        btnStart.disabled = true;
        btnStart.textContent = "Camera Active";
        btnCapture.disabled = false;
        btnLiveScan.disabled = false;

        updateStatus("Camera ready", "ready");
    } catch (err) {
        console.error("Camera access error:", err);
        updateStatus("Camera access denied", "error");
        alert(
            "Could not access the camera. Please allow camera permissions and reload the page."
        );
    }
}

// =============================================
// LIVE SCAN — Real-time detection with overlay
// =============================================

/**
 * Toggle live scanning on/off.
 */
function toggleLiveScan() {
    if (liveScanning) {
        stopLiveScan();
    } else {
        startLiveScan();
    }
}

/**
 * Start the live scanning loop.
 * Captures a frame every 2.5 seconds and sends it
 * to /api/detect-live for lightweight OCR detection.
 */
function startLiveScan() {
    if (!cameraStream) return;

    liveScanning = true;
    btnLiveScan.classList.add("btn-live-active");
    btnLiveScan.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="6" width="12" height="12"/>
        </svg>
        Stop Live`;
    liveInfoBar.style.display = "flex";
    updateStatus("Live scanning...", "processing");

    // Run first scan immediately
    runLiveScan();

    // Then every 2.5 seconds
    liveScanTimer = setInterval(runLiveScan, 2500);
}

/**
 * Stop the live scanning loop.
 */
function stopLiveScan() {
    liveScanning = false;
    if (liveScanTimer) {
        clearInterval(liveScanTimer);
        liveScanTimer = null;
    }

    btnLiveScan.classList.remove("btn-live-active");
    btnLiveScan.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        Live Scan`;
    liveInfoBar.style.display = "none";

    // Clear detection overlay
    clearDetectionCanvas();
    updateStatus("Camera ready", "ready");
}

/**
 * Run a single live scan cycle: capture → detect → draw boxes.
 */
async function runLiveScan() {
    if (isLiveProcessing || !cameraStream || !liveScanning) return;
    if (modalOverlay.classList.contains("active")) return;

    isLiveProcessing = true;

    try {
        // Capture frame at reduced resolution for speed
        const liveW = Math.min(video.videoWidth, 1280);
        const liveH = Math.min(video.videoHeight, 960);
        canvas.width = liveW;
        canvas.height = liveH;
        ctx.drawImage(video, 0, 0, liveW, liveH);

        const imageData = canvas.toDataURL("image/jpeg", 0.7);

        const response = await fetch("/api/detect-live", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData }),
        });

        if (!response.ok) return;

        const result = await response.json();

        // Draw bounding boxes on detection canvas
        drawDetections(result.blocks || [], liveW, liveH);

        // Update live info bar
        liveName.textContent = result.name || "—";
        liveCode.textContent = result.code || "—";

    } catch (err) {
        console.error("Live scan error:", err);
    } finally {
        isLiveProcessing = false;
    }
}

/**
 * Draw bounding boxes and text labels on the detection canvas.
 * @param {Array} blocks - Array of {text, confidence, bbox} objects.
 * @param {number} srcW - Width of the source capture image.
 * @param {number} srcH - Height of the source capture image.
 */
function drawDetections(blocks, srcW, srcH) {
    // Match detection canvas to video display size
    const container = document.getElementById("webcamContainer");
    const displayW = container.clientWidth;
    const displayH = container.clientHeight;

    detectionCanvas.width = displayW;
    detectionCanvas.height = displayH;
    detCtx.clearRect(0, 0, displayW, displayH);

    if (!blocks.length) return;

    // Scale factors from source resolution to display size
    const scaleX = displayW / srcW;
    const scaleY = displayH / srcH;

    for (const block of blocks) {
        const bbox = block.bbox;
        if (!bbox || bbox.length < 4) continue;

        // EasyOCR bbox: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
        const x1 = bbox[0][0] * scaleX;
        const y1 = bbox[0][1] * scaleY;
        const x2 = bbox[2][0] * scaleX;
        const y2 = bbox[2][1] * scaleY;
        const w = x2 - x1;
        const h = y2 - y1;

        // Draw semi-transparent box
        detCtx.strokeStyle = "rgba(92, 246, 156, 0.8)";
        detCtx.lineWidth = 2;
        detCtx.strokeRect(x1, y1, w, h);

        // Draw filled background for text label
        detCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
        const labelH = 18;
        const text = `${block.text} (${Math.round(block.confidence * 100)}%)`;
        detCtx.font = "bold 12px Inter, sans-serif";
        const textW = detCtx.measureText(text).width + 8;
        detCtx.fillRect(x1, y1 - labelH - 2, textW, labelH);

        // Draw text label
        detCtx.fillStyle = "rgba(92, 246, 156, 1)";
        detCtx.fillText(text, x1 + 4, y1 - 6);
    }
}

/**
 * Clear the detection overlay canvas.
 */
function clearDetectionCanvas() {
    detCtx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
}

// =============================================
// CAPTURE — Full-quality single capture
// =============================================

/**
 * Capture a frame from the webcam, send it to the server for OCR,
 * and display the results in a modal popup.
 */
async function captureAndProcess() {
    if (isProcessing || !cameraStream) return;

    // Pause live scan during capture
    const wasLiveScanning = liveScanning;
    if (liveScanning) stopLiveScan();

    isProcessing = true;
    updateStatus("Processing...", "processing");
    loadingOverlay.classList.add("active");

    try {
        // Capture at full resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/png");

        const response = await fetch("/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData }),
        });

        const result = await response.json();

        if (response.ok) {
            showResult(result);
        } else {
            console.error("Server error:", result.error);
            updateStatus("Processing error", "error");
            alert("Error: " + (result.error || "Unknown error occurred."));
        }
    } catch (err) {
        console.error("Capture error:", err);
        updateStatus("Connection error", "error");
        alert("Failed to connect to the server. Is it running?");
    } finally {
        isProcessing = false;
        loadingOverlay.classList.remove("active");
    }
}

// =============================================
// MODAL — Result display & annotation
// =============================================

/**
 * Display OCR results in the modal popup with confirmation buttons.
 */
function showResult(result) {
    lastResult = result;

    modalTitle.textContent = "Student Data Detected";
    displayMode.style.display = "block";
    editMode.style.display = "none";
    confirmButtons.style.display = "flex";
    saveButtons.style.display = "none";
    savedMessage.style.display = "none";

    if (result.name) {
        modalName.textContent = result.name;
        modalName.classList.remove("not-found");
    } else {
        modalName.textContent = "Name not detected";
        modalName.classList.add("not-found");
    }

    if (result.code) {
        modalCode.textContent = result.code;
        modalCode.classList.remove("not-found");
    } else {
        modalCode.textContent = "Code not detected";
        modalCode.classList.add("not-found");
    }

    let metaText = `${result.blocks_found || 0} text blocks detected`;
    if (result.snapshot) {
        metaText += ` · Saved to snapshots/`;
    }
    modalMeta.textContent = metaText;

    modalOverlay.classList.add("active");
    updateStatus("Review results", "ready");
}

async function confirmCorrect() {
    if (!lastResult) return;
    await saveAnnotation(lastResult.name || "", lastResult.code || "");
}

function showEditMode() {
    modalTitle.textContent = "Enter Correct Values";
    displayMode.style.display = "none";
    editMode.style.display = "block";
    confirmButtons.style.display = "none";
    saveButtons.style.display = "block";

    editNameInput.value = lastResult?.name || "";
    editCodeInput.value = lastResult?.code || "";
    editNameInput.focus();
}

async function saveCorrected() {
    const name = editNameInput.value.trim();
    const code = editCodeInput.value.trim();

    if (!name && !code) {
        alert("Please enter at least a name or a code.");
        return;
    }

    await saveAnnotation(name, code);
}

async function saveAnnotation(name, code) {
    if (!lastResult?.snapshot) {
        alert("No snapshot available to annotate.");
        return;
    }

    try {
        updateStatus("Saving...", "processing");

        const response = await fetch("/api/save-annotation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                snapshot: lastResult.snapshot,
                name: name,
                code: code,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            displayMode.style.display = "none";
            editMode.style.display = "none";
            confirmButtons.style.display = "none";
            saveButtons.style.display = "none";
            savedMessage.style.display = "block";
            modalTitle.textContent = "Saved!";
            modalMeta.textContent = `Name: "${name}" · Code: "${code}"`;
            updateStatus("Annotation saved", "ready");
        } else {
            alert("Failed to save: " + (result.error || "Unknown error"));
            updateStatus("Save failed", "error");
        }
    } catch (err) {
        console.error("Save error:", err);
        alert("Failed to connect to the server.");
        updateStatus("Connection error", "error");
    }
}

function closeModal() {
    modalOverlay.classList.remove("active");
    lastResult = null;
    clearDetectionCanvas();
    updateStatus("Ready to scan", "ready");
}

// Close modal on overlay click
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
        closeModal();
    }
});

// Initial status
updateStatus("Ready", "");
