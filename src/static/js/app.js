/**
 * Student Paper Reader — Frontend Application
 *
 * Handles webcam access, frame capture, server communication,
 * result display, and annotation confirmation flow.
 */

// === DOM Elements ===
const video = document.getElementById("webcamVideo");
const canvas = document.getElementById("captureCanvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStartCamera");
const btnCapture = document.getElementById("btnCapture");
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
let lastResult = null; // Stores the last OCR result for saving

/**
 * Update the status badge in the header.
 * @param {string} text - Status message to display.
 * @param {'ready'|'processing'|'error'|''} state - Visual state class.
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
                width: { ideal: 1280 },
                height: { ideal: 960 },
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

        updateStatus("Camera ready", "ready");
    } catch (err) {
        console.error("Camera access error:", err);
        updateStatus("Camera access denied", "error");
        alert(
            "Could not access the camera. Please allow camera permissions and reload the page."
        );
    }
}

/**
 * Capture a frame from the webcam, send it to the server for OCR,
 * and display the results in a modal popup.
 */
async function captureAndProcess() {
    if (isProcessing || !cameraStream) return;

    isProcessing = true;
    updateStatus("Processing...", "processing");
    loadingOverlay.classList.add("active");

    try {
        // Capture frame from video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/png");

        // Send to server
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

/**
 * Display OCR results in the modal popup with confirmation buttons.
 * @param {Object} result - Server response with name, code, blocks_found, snapshot.
 */
function showResult(result) {
    lastResult = result;

    // Reset modal to display mode
    modalTitle.textContent = "Student Data Detected";
    displayMode.style.display = "block";
    editMode.style.display = "none";
    confirmButtons.style.display = "flex";
    saveButtons.style.display = "none";
    savedMessage.style.display = "none";

    // Set name
    if (result.name) {
        modalName.textContent = result.name;
        modalName.classList.remove("not-found");
    } else {
        modalName.textContent = "Name not detected";
        modalName.classList.add("not-found");
    }

    // Set code
    if (result.code) {
        modalCode.textContent = result.code;
        modalCode.classList.remove("not-found");
    } else {
        modalCode.textContent = "Code not detected";
        modalCode.classList.add("not-found");
    }

    // Meta info
    let metaText = `${result.blocks_found || 0} text blocks detected`;
    if (result.snapshot) {
        metaText += ` · Saved to snapshots/`;
    }
    modalMeta.textContent = metaText;

    // Show modal
    modalOverlay.classList.add("active");
    updateStatus("Review results", "ready");
}

/**
 * User confirms the OCR result is correct.
 * Saves the detected values to annotations.json.
 */
async function confirmCorrect() {
    if (!lastResult) return;

    const name = lastResult.name || "";
    const code = lastResult.code || "";

    await saveAnnotation(name, code);
}

/**
 * Switch modal to edit mode so user can type correct values.
 */
function showEditMode() {
    modalTitle.textContent = "Enter Correct Values";
    displayMode.style.display = "none";
    editMode.style.display = "block";
    confirmButtons.style.display = "none";
    saveButtons.style.display = "block";

    // Pre-fill with detected values
    editNameInput.value = lastResult?.name || "";
    editCodeInput.value = lastResult?.code || "";

    // Focus the name input
    editNameInput.focus();
}

/**
 * Save the corrected values entered by the user.
 */
async function saveCorrected() {
    const name = editNameInput.value.trim();
    const code = editCodeInput.value.trim();

    if (!name && !code) {
        alert("Please enter at least a name or a code.");
        return;
    }

    await saveAnnotation(name, code);
}

/**
 * Send annotation data to the server to save in annotations.json.
 * @param {string} name - Student name (correct value).
 * @param {string} code - Student code (correct value).
 */
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
            // Show saved confirmation
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

/**
 * Close the result modal popup.
 */
function closeModal() {
    modalOverlay.classList.remove("active");
    lastResult = null;
    updateStatus("Ready to scan", "ready");
}

// Close modal on overlay click (outside card)
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
        closeModal();
    }
});

// Initial status
updateStatus("Ready", "");
