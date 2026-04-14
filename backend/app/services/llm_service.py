from collections.abc import AsyncGenerator

import litellm
from loguru import logger

from app.services import vault_service

OPENROUTER_BASE = "https://openrouter.ai/api/v1"


async def call_llm_stream(
    user_id: str,
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 2048,
    top_p: float = 1.0,
) -> AsyncGenerator[str, None]:
    """Stream LLM tokens via LiteLLM → OpenRouter.

    Retrieves the user's OpenRouter API key from vault.
    Yields individual token strings as they arrive.
    Raises ValueError if no API key is configured.
    """
    api_key = await vault_service.get_decrypted_key(user_id)
    if not api_key:
        raise ValueError("No OpenRouter API key configured for this user")

    logger.debug("Starting LLM stream: model={}, user={}", model, user_id)

    response = await litellm.acompletion(
        model=f"openrouter/{model}",
        messages=messages,
        api_key=api_key,
        api_base=OPENROUTER_BASE,
        stream=True,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
    )

    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
