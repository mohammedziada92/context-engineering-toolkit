SUPPORTED_MODELS = [
    {
        "id": "anthropic/claude-sonnet-4-6",
        "provider": "Anthropic",
        "name": "Claude Sonnet 4.6",
        "context_window": 1_000_000,
        "input_price_per_million": 3.00,
        "output_price_per_million": 15.00,
        "role": "quality",
    },
    {
        "id": "z-ai/glm-5",
        "provider": "Z.ai",
        "name": "GLM-5",
        "context_window": None,
        "input_price_per_million": None,
        "output_price_per_million": None,
        "role": "agent",
    },
    {
        "id": "google/gemini-3.1-pro-preview",
        "provider": "Google",
        "name": "Gemini 3.1 Pro Preview",
        "context_window": 1_048_576,
        "input_price_per_million": 2.00,
        "output_price_per_million": 12.00,
        "role": "budget",
    },
]

ALLOWED_MODEL_IDS = [m["id"] for m in SUPPORTED_MODELS]
DEFAULT_MODEL = "anthropic/claude-sonnet-4-6"


def get_model_by_id(model_id: str) -> dict | None:
    """Look up a model's metadata by its ID. Returns None if not found."""
    return next((m for m in SUPPORTED_MODELS if m["id"] == model_id), None)
