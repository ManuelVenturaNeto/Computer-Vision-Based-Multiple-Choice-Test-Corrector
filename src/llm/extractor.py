"""Vision-model extraction for student name and registration code."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from urllib import error, request

from src.config import Config

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """
Read the photographed student sheet and extract only these two fields:

1. The student name written near the label "NOME:".
2. The student code written near the label "Matricula:" or "Matricula".

Rules:
- Look first to the right of the label, then directly below it.
- Ignore every other text, number, question, and mark on the page.
- Do not invent values.
- Return strict JSON only.
- Use this exact schema:
  {"name": string|null, "code": string|null}
- If a field is not visible or not readable, use null.
- "code" must contain digits only.
""".strip()


class ModelExtractorError(RuntimeError):
    """Base exception for extraction errors."""


class UnsupportedProviderError(ModelExtractorError):
    """Raised when the selected provider is not supported."""


class MissingAPIKeyError(ModelExtractorError):
    """Raised when a provider key is missing."""


class ProviderRequestError(ModelExtractorError):
    """Raised when the upstream provider request fails."""


@dataclass(slots=True)
class ExtractionResult:
    """Normalized extraction output."""

    name: str | None
    code: str | None
    provider: str
    model: str
    raw_response: str


class ModelExtractor:
    """Send a capture to either OpenAI or Gemini and parse the result."""

    def extract_with_fallback(self, *, image_data_url: str) -> ExtractionResult:
        """Try Gemini first, then OpenAI if Gemini fails."""
        providers_to_try = Config.preferred_providers()

        if not providers_to_try:
            raise MissingAPIKeyError(
                "Photo reading is not configured yet. "
                "Set GEMINI_API_KEY or OPENAI_API_KEY and restart the app."
            )

        last_error: Exception | None = None

        for index, provider in enumerate(providers_to_try):
            model = Config.default_model_for(provider)
            is_last_provider = index == len(providers_to_try) - 1

            try:
                result = self.extract(
                    image_data_url=image_data_url,
                    provider=provider,
                    model=model,
                )

                if result.name or result.code or is_last_provider:
                    return result

                logger.warning(
                    "Photo reading with %s using %s returned no readable fields. "
                    "Trying the next provider.",
                    provider,
                    model,
                )
                last_error = ModelExtractorError("No readable fields found.")
            except MissingAPIKeyError as exc:
                logger.warning("Skipping %s because its API key is missing.", provider)
                last_error = exc
            except ModelExtractorError as exc:
                logger.warning(
                    "Photo reading failed with %s using %s: %s",
                    provider,
                    model,
                    exc,
                )
                last_error = exc

        raise ProviderRequestError(
            "Could not read the photo right now. Please try again."
        ) from last_error

    def extract(
        self,
        *,
        image_data_url: str,
        provider: str,
        model: str,
    ) -> ExtractionResult:
        """Extract fields from a capture using the selected provider."""
        normalized_provider = provider.strip().lower()
        normalized_model = model.strip() or Config.default_model_for(
            normalized_provider
        )

        if normalized_provider not in {"openai", "gemini"}:
            raise UnsupportedProviderError(
                "Unsupported provider. Use 'openai' or 'gemini'."
            )

        api_key = Config.api_key_for(normalized_provider)
        if not api_key:
            env_name = (
                "OPENAI_API_KEY"
                if normalized_provider == "openai"
                else "GEMINI_API_KEY"
            )
            raise MissingAPIKeyError(
                "Missing API key for "
                f"{normalized_provider}. Set {env_name} and restart the app."
            )

        mime_type, image_payload = self._parse_data_url(image_data_url)

        if normalized_provider == "openai":
            raw_response = self._extract_with_openai(
                api_key=api_key,
                model=normalized_model,
                image_data_url=image_data_url,
            )
        else:
            raw_response = self._extract_with_gemini(
                api_key=api_key,
                model=normalized_model,
                mime_type=mime_type,
                image_payload=image_payload,
            )

        parsed = self._parse_model_json(raw_response)
        result = ExtractionResult(
            name=self._normalize_name(parsed.get("name")),
            code=self._normalize_code(parsed.get("code")),
            provider=normalized_provider,
            model=normalized_model,
            raw_response=raw_response,
        )
        logger.info(
            "Model extraction complete. provider=%s model=%s name=%r code=%r",
            result.provider,
            result.model,
            result.name,
            result.code,
        )
        return result

    def _extract_with_openai(
        self,
        *,
        api_key: str,
        model: str,
        image_data_url: str,
    ) -> str:
        """Call OpenAI's chat completions endpoint with the capture."""
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You extract structured data from student forms and "
                        "reply with JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": EXTRACTION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_data_url},
                        },
                    ],
                },
            ],
        }
        response_body = self._post_json(
            url="https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            payload=payload,
            provider="OpenAI",
        )

        choices = response_body.get("choices") or []
        if not choices:
            raise ProviderRequestError("OpenAI returned no completion choices.")

        message = choices[0].get("message", {})
        return self._coerce_message_text(message.get("content"))

    def _extract_with_gemini(
        self,
        *,
        api_key: str,
        model: str,
        mime_type: str,
        image_payload: str,
    ) -> str:
        """Call Gemini's generateContent endpoint with the capture."""
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": EXTRACTION_PROMPT},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_payload,
                            }
                        },
                    ],
                }
            ],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        response_body = self._post_json(
            url=(
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent?key={api_key}"
            ),
            headers={},
            payload=payload,
            provider="Gemini",
        )

        candidates = response_body.get("candidates") or []
        if not candidates:
            raise ProviderRequestError("Gemini returned no candidates.")

        content = candidates[0].get("content", {})
        parts = content.get("parts") or []
        text_parts = [part.get("text", "") for part in parts if part.get("text")]
        raw_response = "\n".join(text_parts).strip()
        if not raw_response:
            raise ProviderRequestError("Gemini returned an empty response.")
        return raw_response

    def _post_json(
        self,
        *,
        url: str,
        headers: dict[str, str],
        payload: dict,
        provider: str,
    ) -> dict:
        """POST JSON and return the decoded JSON response."""
        request_body = json.dumps(payload).encode("utf-8")
        request_headers = {
            "Content-Type": "application/json",
            **headers,
        }
        http_request = request.Request(
            url=url,
            data=request_body,
            headers=request_headers,
            method="POST",
        )

        try:
            with request.urlopen(
                http_request,
                timeout=Config.REQUEST_TIMEOUT_SECONDS,
            ) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            logger.error("%s request failed (%s): %s", provider, exc.code, details)
            raise ProviderRequestError(
                f"{provider} request failed with status {exc.code}."
            ) from exc
        except error.URLError as exc:
            logger.error("%s request error: %s", provider, exc.reason)
            raise ProviderRequestError(
                f"{provider} request failed: {exc.reason}"
            ) from exc

        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            logger.error("%s returned invalid JSON: %s", provider, body)
            raise ProviderRequestError(
                f"{provider} returned an invalid JSON response."
            ) from exc

    @staticmethod
    def _parse_data_url(image_data_url: str) -> tuple[str, str]:
        """Split a base64 data URL into mime type and payload."""
        if "," not in image_data_url:
            raise ModelExtractorError("Expected a base64 image data URL.")

        header, payload = image_data_url.split(",", 1)
        mime_type = "image/png"
        if header.startswith("data:") and ";base64" in header:
            mime_type = header[5:].split(";base64", 1)[0] or mime_type

        return mime_type, payload

    @staticmethod
    def _coerce_message_text(content: object) -> str:
        """Convert a provider message payload into plain text."""
        if isinstance(content, str):
            return content.strip()

        if isinstance(content, list):
            text_parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str) and text.strip():
                        text_parts.append(text.strip())
            if text_parts:
                return "\n".join(text_parts)

        raise ProviderRequestError("Provider returned an unexpected message payload.")

    @staticmethod
    def _parse_model_json(raw_response: str) -> dict:
        """Parse the JSON object returned by the model."""
        candidate = raw_response.strip()
        if not candidate:
            raise ModelExtractorError("The model returned an empty response.")

        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", candidate, flags=re.DOTALL)
            if not match:
                raise ModelExtractorError(
                    "The model response did not contain a JSON object."
                )
            try:
                parsed = json.loads(match.group(0))
            except json.JSONDecodeError as exc:
                raise ModelExtractorError(
                    "The model returned JSON in an unreadable format."
                ) from exc

        if not isinstance(parsed, dict):
            raise ModelExtractorError(
                "The model response must be a JSON object with name and code."
            )

        return parsed

    @staticmethod
    def _normalize_name(value: object) -> str | None:
        """Normalize the extracted student name."""
        if value is None:
            return None

        cleaned = re.sub(r"\s+", " ", str(value)).strip()
        return cleaned or None

    @staticmethod
    def _normalize_code(value: object) -> str | None:
        """Normalize the extracted student code."""
        if value is None:
            return None

        cleaned = re.sub(r"\D", "", str(value))
        return cleaned or None
