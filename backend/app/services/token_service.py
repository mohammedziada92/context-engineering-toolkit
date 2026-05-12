import tiktoken

from loguru import logger

from app.core.models import DEFAULT_MODEL, get_model_by_id

# Default token budget allocation (PRD Feature 04)
DEFAULT_SYSTEM_PROMPT_BUDGET = 500
DEFAULT_RAG_BUDGET = 1500
DEFAULT_CHAT_HISTORY_BUDGET = 500
MAX_OUTPUT_TOKENS = 2048


def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """Count the number of tokens in a text string.

    Uses tiktoken with the specified encoding. Falls back to len(text)//4
    if the encoding name is not recognized.
    """
    try:
        encoding = tiktoken.get_encoding(model)
        return len(encoding.encode(text))
    except KeyError:
        logger.debug("Unknown tiktoken encoding '{}', falling back to len//4", model)
        return len(text) // 4


def count_messages_tokens(messages: list[dict]) -> int:
    """Count total tokens across a list of chat messages.

    Each message is expected to have a 'content' key.
    Uses cl100k_base encoding (GPT-4 / Claude family compatible).
    """
    total = 0
    for msg in messages:
        total += count_tokens(msg.get("content", ""))
    return total


def allocate_budget(pipeline_config: dict) -> dict:
    """Allocate token budget across context blocks.

    Fixed allocations: system_prompt=500, rag=1500, chat_history=500.
    Remaining budget goes to user_message.

    For models with a known context_window:
        total_budget = context_window - MAX_OUTPUT_TOKENS
    For models with unknown context_window (e.g. GLM-5):
        total_budget = pipeline_config["token_budget"] (default 4096)
    """
    model_id = pipeline_config.get("model", DEFAULT_MODEL)
    model_info = get_model_by_id(model_id)

    if model_info and model_info.get("context_window"):
        total_budget = model_info["context_window"] - MAX_OUTPUT_TOKENS
    else:
        total_budget = pipeline_config.get("token_budget", 4096)

    system_prompt = DEFAULT_SYSTEM_PROMPT_BUDGET
    rag = DEFAULT_RAG_BUDGET
    chat_history = DEFAULT_CHAT_HISTORY_BUDGET

    fixed = system_prompt + rag + chat_history
    remaining = total_budget - fixed
    is_over_budget = remaining <= 0

    return {
        "system_prompt": system_prompt,
        "rag": rag,
        "chat_history": chat_history,
        "user_message": max(0, remaining),
        "total_budget": total_budget,
        "is_over_budget": is_over_budget,
    }


def compress_history(
    messages: list[dict],
    max_tokens: int,
    strategy: str = "truncate",
) -> list[dict]:
    """Compress chat history to fit within a token budget.

    Strategies:
        "keep"      — return messages as-is if within budget, else truncate oldest
        "truncate"  — remove oldest messages until within max_tokens
        "summarize" — same as truncate (summarize is a Phase 4 enhancement)
    """
    if not messages:
        return []

    total = count_messages_tokens(messages)
    if total <= max_tokens:
        return messages

    if strategy == "keep":
        # Keep all if within budget, otherwise truncate oldest
        return _truncate_oldest(messages, max_tokens)

    if strategy in ("truncate", "summarize"):
        # summarize = truncate for now (Phase 4 enhancement)
        return _truncate_oldest(messages, max_tokens)

    logger.warning("Unknown compression strategy '{}', falling back to truncate", strategy)
    return _truncate_oldest(messages, max_tokens)


def _truncate_oldest(messages: list[dict], max_tokens: int) -> list[dict]:
    """Remove oldest messages until the remaining list fits within max_tokens."""
    result = list(messages)
    while result and count_messages_tokens(result) > max_tokens:
        result.pop(0)
    return result


def estimate_cost(
    prompt_tokens: int,
    completion_tokens: int,
    model: str,
) -> float:
    """Estimate USD cost for a completion based on model pricing.

    Returns 0.0 for models without known pricing (e.g. GLM-5).
    """
    model_info = get_model_by_id(model)
    if not model_info or model_info.get("input_price_per_million") is None:
        return 0.0

    input_cost = (prompt_tokens / 1_000_000) * model_info["input_price_per_million"]
    output_cost = (completion_tokens / 1_000_000) * model_info["output_price_per_million"]
    return round(input_cost + output_cost, 6)
