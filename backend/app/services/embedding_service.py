import openai

from loguru import logger

from app.core.config import settings


def _get_client(api_key: str | None = None) -> openai.OpenAI:
    """Return an OpenAI client pointed at OpenRouter's API."""
    return openai.OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key or settings.OPENROUTER_API_KEY,
    )


def embed_text(text: str, api_key: str | None = None) -> list[float]:
    """Embed a single text string via OpenRouter.

    Args:
        text: The text to embed.
        api_key: User's decrypted OpenRouter key. Falls back to global key.
    """
    client = _get_client(api_key)
    response = client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=[text],
    )
    return response.data[0].embedding


def embed_batch(texts: list[str], api_key: str | None = None) -> list[list[float]]:
    """Embed a batch of text strings via OpenRouter.

    Args:
        texts: The texts to embed (max 2048 per OpenAI API limit).
        api_key: User's decrypted OpenRouter key. Falls back to global key.
    """
    if not texts:
        return []
    client = _get_client(api_key)

    # OpenAI embeddings API accepts up to 2048 inputs per call.
    # Chunk into batches to stay within limits.
    batch_size = 512
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=batch,
        )
        # Response data is ordered by index — sort just in case
        sorted_data = sorted(response.data, key=lambda d: d.index)
        all_embeddings.extend([d.embedding for d in sorted_data])

    logger.debug(
        "Embedded {} texts via OpenRouter ({})",
        len(texts),
        settings.EMBEDDING_MODEL,
    )
    return all_embeddings
