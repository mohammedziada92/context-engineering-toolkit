"""Token-aware text chunking for RAG retrieval.

Splits text into ~400-token chunks at semantic boundaries (paragraphs,
sentences, words — never mid-word).  Adds ~120-token overlap using the
last complete sentences of the previous chunk.
"""

import re

import tiktoken

_enc = tiktoken.get_encoding("cl100k_base")

TARGET_TOKENS = 400
MAX_TOKENS = 550
MIN_TOKENS = 150
OVERLAP_TOKENS = 120

# Paragraph and sentence boundaries
_PARA_SPLIT = re.compile(r"\n{2,}")
_SENT_END = re.compile(r"(?<=[.!?])\s+")
_WORD_SPLIT = re.compile(r" ")

# Leading metadata block — handles inline (Key: Value), split (Key:\nValue),
# and block-level PDF (entries separated by \n\n).  Key limited to 1-3 words.
_META_RE = re.compile(
    r"\A(?:[A-Z][A-Za-z]+(?:[ &][A-Za-z]+){0,2}:\s*\n?[^\n]+\n+){2,}",
)

# Footer: everything from "End of Document" onward
_FOOTER_RE = re.compile(r"\n*End of Document.*$", re.DOTALL | re.IGNORECASE)

# Section headers for markdown-style docs: "SECTION N:", "N.N Title", "## Heading"
_HEADER_RE = re.compile(
    r"(?=\n(?:SECTION\s+\d|#{1,3}\s|\d+\.\d+\s+[A-Z]))",
)

# Structural lines that act as paragraph boundaries in single-newline docs
_STRUCT_LINE_RE = re.compile(
    r"^(?:"
    r"SECTION\s+\d"            # SECTION 1: ...
    r"|#{1,3}\s"               # ## Heading
    r"|\d+\.\d+\s+[A-Z]"      # 1.1 Standard...
    r"|End of Document"        # End markers
    r")",
    re.IGNORECASE,
)


def _tok(text: str) -> int:
    return len(_enc.encode(text))


def _strip_metadata(text: str) -> str:
    text = _META_RE.sub("", text)
    text = _FOOTER_RE.sub("", text)
    return text.lstrip("\n")


# ── Single-newline normalization ──────────────────────────────


def _needs_reflow(text: str) -> bool:
    """True when the document has almost no paragraph breaks."""
    lines = text.split("\n")
    total = len(lines)
    if total < 10:
        return False
    para_breaks = text.count("\n\n")
    empty_lines = sum(1 for line in lines if not line.strip())
    return (para_breaks + empty_lines) < 3


def _reflow(text: str) -> str:
    """Reflow single-newline text into proper double-newline paragraphs.

    Consecutive non-structural lines are joined with spaces.  Structural
    lines (section headers, end markers) flush the current block and are
    excluded from output — they mark boundaries but carry no retrievable
    semantic value.
    """
    lines = text.split("\n")
    blocks: list[str] = []
    current: list[str] = []

    for line in lines:
        stripped = line.strip()

        if not stripped:
            if current:
                blocks.append(" ".join(current))
                current = []
        elif _STRUCT_LINE_RE.match(stripped):
            if current:
                blocks.append(" ".join(current))
                current = []
        else:
            current.append(stripped)

    if current:
        blocks.append(" ".join(current))

    return "\n\n".join(blocks)


# ── Section splitting (markdown-style docs) ───────────────────


def _split_sections(text: str) -> list[str]:
    """Split at structural section headers, keeping the header with its content."""
    parts = _HEADER_RE.split(text)
    sections = [p.strip() for p in parts if p.strip()]
    return sections or [text]


# ── Paragraph-level chunking ──────────────────────────────────


def _chunk_section(text: str) -> list[str]:
    """Split text into chunks within [MIN_TOKENS, MAX_TOKENS].

    Accumulates paragraphs until reaching TARGET_TOKENS, then commits a
    chunk.  Falls back to sentence-splitting and word-splitting for
    oversized paragraphs.
    """
    paragraphs = _PARA_SPLIT.split(text)
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if _tok(para) > MAX_TOKENS:
            if current:
                chunks.append(current)
                current = ""
            for sub in _split_sentences(para):
                combined = (current + "\n\n" + sub) if current else sub
                if _tok(combined) <= MAX_TOKENS:
                    current = combined
                else:
                    if current:
                        chunks.append(current)
                    current = sub
            continue

        combined = (current + "\n\n" + para) if current else para
        if _tok(combined) <= MAX_TOKENS:
            current = combined
        else:
            if current:
                chunks.append(current)
            current = para

    if current:
        chunks.append(current)
    return chunks


# ── Fallback splitters ────────────────────────────────────────


def _split_sentences(text: str) -> list[str]:
    """Split text into sentence-level pieces, each ≤ MAX_TOKENS."""
    sentences = _SENT_END.split(text)
    result: list[str] = []
    current = ""
    for sent in sentences:
        combined = (current + " " + sent) if current else sent
        if _tok(combined) <= MAX_TOKENS:
            current = combined
        else:
            if current:
                result.append(current)
            if _tok(sent) > MAX_TOKENS:
                result.extend(_split_words(sent))
                current = ""
            else:
                current = sent
    if current:
        result.append(current)
    return result


def _split_words(text: str) -> list[str]:
    """Last resort: split on word boundaries."""
    words = _WORD_SPLIT.split(text)
    chunks: list[str] = []
    current = ""
    for word in words:
        combined = (current + " " + word) if current else word
        if _tok(combined) <= MAX_TOKENS:
            current = combined
        else:
            if current:
                chunks.append(current)
            current = word
    if current:
        chunks.append(current)
    return chunks


# ── Overlap ───────────────────────────────────────────────────


def _add_overlap(chunks: list[str], overlap_tokens: int) -> list[str]:
    """Add overlap using the last complete sentences of the previous chunk.

    Caps overlap so the final chunk never exceeds MAX_TOKENS.
    """
    if len(chunks) <= 1 or overlap_tokens == 0:
        return chunks

    result: list[str] = [chunks[0]]
    for chunk in chunks[1:]:
        chunk_tokens = _tok(chunk)
        # Budget: overlap tokens, but never so much that chunk + overlap > MAX_TOKENS
        budget = min(overlap_tokens, max(0, MAX_TOKENS - chunk_tokens - 1))
        if budget <= 0:
            result.append(chunk)
            continue

        prev = result[-1]
        sentences = _SENT_END.split(prev)
        overlap_parts: list[str] = []
        size = 0
        for s in reversed(sentences):
            s = s.strip()
            if not s:
                continue
            s_size = _tok(s)
            if size + s_size > budget and overlap_parts:
                break
            overlap_parts.insert(0, s)
            size += s_size

        if overlap_parts:
            overlap_text = " ".join(overlap_parts)
            combined = overlap_text + " " + chunk
            # Final token-count check (concatenation can differ from sum)
            if _tok(combined) <= MAX_TOKENS:
                result.append(combined)
            else:
                result.append(chunk)
        else:
            result.append(chunk)
    return result


# ── Small-chunk merging ───────────────────────────────────────


def _merge_small_chunks(chunks: list[str]) -> list[str]:
    """Merge chunks below MIN_TOKENS with neighbours to stay in range."""
    if len(chunks) <= 1:
        return chunks

    result: list[str] = []
    i = 0
    while i < len(chunks):
        chunk = chunks[i]
        tok_count = _tok(chunk)
        if tok_count < MIN_TOKENS and result:
            merged = result[-1] + "\n\n" + chunk
            if _tok(merged) <= MAX_TOKENS:
                result[-1] = merged
            else:
                result.append(chunk)
        elif tok_count < MIN_TOKENS and i + 1 < len(chunks):
            chunks[i + 1] = chunk + "\n\n" + chunks[i + 1]
        else:
            result.append(chunk)
        i += 1

    return result


# ── Public API ────────────────────────────────────────────────


def split_text(text: str) -> list[str]:
    """Split *text* into ~400-token chunks at semantic boundaries.

    1. Strip leading metadata header and trailing footer.
    2. Split on paragraph/page breaks (``\\n\\n``).
    3. For each section: reflow if single-newline, then chunk.
    4. Merge any undersized chunks with neighbours.
    5. Add ~80-token sentence-boundary overlap between chunks.
    """
    if not text or not text.strip():
        return []

    cleaned = _strip_metadata(text)

    # Split on paragraph/page boundaries first, then check each section
    parts = _PARA_SPLIT.split(cleaned)
    parts = [p.strip() for p in parts if p.strip()]
    if not parts:
        return []

    raw: list[str] = []
    for part in parts:
        if _needs_reflow(part):
            reflowed = _reflow(part)
            raw.extend(_chunk_section(reflowed))
        else:
            sections = _split_sections(part)
            for section in sections:
                raw.extend(_chunk_section(section))

    merged = _merge_small_chunks(raw)
    return _add_overlap(merged, OVERLAP_TOKENS)
