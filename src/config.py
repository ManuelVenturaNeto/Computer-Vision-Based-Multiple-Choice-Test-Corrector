"""Configuration for the restarted student capture project."""

import logging
import os
from typing import Any

from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def _parse_csv_env(name: str, fallback: list[str]) -> list[str]:
    """Parse a comma-separated environment variable into a unique list."""
    raw_value = os.getenv(name, "").strip()
    if not raw_value:
        return fallback

    values: list[str] = []
    for item in raw_value.split(","):
        cleaned = item.strip()
        if cleaned and cleaned not in values:
            values.append(cleaned)

    return values or fallback


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

    OPENAI_MODEL_SUGGESTIONS: list[str] = _parse_csv_env(
        "OPENAI_MODEL_SUGGESTIONS",
        ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
    )
    GEMINI_MODEL_SUGGESTIONS: list[str] = _parse_csv_env(
        "GEMINI_MODEL_SUGGESTIONS",
        ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
    )

    @classmethod
    def configure_logging(cls) -> None:
        """Configure application logging."""
        logging.basicConfig(level=cls.LOG_LEVEL, format=cls.LOG_FORMAT)

    @classmethod
    def default_provider(cls) -> str:
        """Pick the provider shown first in the UI and used as fallback."""
        requested = os.getenv("LLM_PROVIDER", "").strip().lower()
        if requested in {"openai", "gemini"}:
            return requested
        if cls.OPENAI_API_KEY:
            return "openai"
        if cls.GEMINI_API_KEY:
            return "gemini"
        return "openai"

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
    def ui_config(cls) -> dict[str, Any]:
        """Return provider metadata consumed by the frontend."""
        return {
            "defaultProvider": cls.default_provider(),
            "providers": {
                "openai": {
                    "label": "OpenAI",
                    "envVar": "OPENAI_API_KEY",
                    "configured": bool(cls.OPENAI_API_KEY),
                    "defaultModel": cls.OPENAI_DEFAULT_MODEL,
                    "suggestedModels": cls.OPENAI_MODEL_SUGGESTIONS,
                },
                "gemini": {
                    "label": "Gemini",
                    "envVar": "GEMINI_API_KEY",
                    "configured": bool(cls.GEMINI_API_KEY),
                    "defaultModel": cls.GEMINI_DEFAULT_MODEL,
                    "suggestedModels": cls.GEMINI_MODEL_SUGGESTIONS,
                },
            },
        }
