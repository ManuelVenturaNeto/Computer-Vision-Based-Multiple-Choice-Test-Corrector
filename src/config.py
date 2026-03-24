"""Configuration for the student capture project."""

import logging
import os
from typing import Any

from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Config:
    """Centralized runtime configuration."""

    BASE_DIR: str = BASE_DIR
    SNAPSHOTS_DIR: str = os.path.join(BASE_DIR, "snapshots")

    LOG_LEVEL: int = logging.INFO
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    REQUEST_TIMEOUT_SECONDS: float = float(
        os.getenv("LLM_REQUEST_TIMEOUT_SECONDS", "45")
    )

    OPENAI_API_KEY: str = (
        os.getenv("OPENAI_API_KEY")
        or os.getenv("OPEN_IA_KEY")
        or ""
    ).strip()
    GEMINI_API_KEY: str = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GOOGLE_GENAI_API_KEY")
        or ""
    ).strip()

    OPENAI_DEFAULT_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()
    GEMINI_DEFAULT_MODEL: str = os.getenv(
        "GEMINI_MODEL", "gemini-2.5-flash"
    ).strip()

    @classmethod
    def configure_logging(cls) -> None:
        """Configure application logging."""
        logging.basicConfig(level=cls.LOG_LEVEL, format=cls.LOG_FORMAT)

    @classmethod
    def default_model_for(cls, provider: str) -> str:
        """Return the configured default model for a provider."""
        if provider == "gemini":
            return cls.GEMINI_DEFAULT_MODEL
        return cls.OPENAI_DEFAULT_MODEL

    @classmethod
    def api_key_for(cls, provider: str) -> str:
        """Return the API key configured for the selected provider."""
        if provider == "gemini":
            return cls.GEMINI_API_KEY
        if provider == "openai":
            return cls.OPENAI_API_KEY
        return ""

    @classmethod
    def preferred_providers(cls) -> list[str]:
        """Return the provider order used when reading a capture."""
        providers: list[str] = []

        if cls.GEMINI_API_KEY:
            providers.append("gemini")
        if cls.OPENAI_API_KEY:
            providers.append("openai")

        return providers

    @classmethod
    def processing_ready(cls) -> bool:
        """Tell the UI if the server can process a captured photo."""
        return bool(cls.preferred_providers())

    @classmethod
    def service_message(cls) -> str:
        """Return a simple status message for the frontend."""
        if cls.processing_ready():
            return "Photo reading is ready."

        return (
            "Photo reading is not configured yet. "
            "Set GEMINI_API_KEY or OPENAI_API_KEY and restart the app."
        )

    @classmethod
    def ui_config(cls) -> dict[str, Any]:
        """Return the small amount of data needed by the frontend."""
        return {
            "processingReady": cls.processing_ready(),
            "serviceMessage": cls.service_message(),
        }
