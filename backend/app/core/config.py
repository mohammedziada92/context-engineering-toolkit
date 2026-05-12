from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # JWT
    JWT_SECRET: str = ""

    # Postgres
    POSTGRES_PASSWORD: str = "postgres"

    # OpenRouter
    OPENROUTER_API_KEY: str = ""

    # Supported Models
    MODEL_QUALITY: str = "anthropic/claude-sonnet-4-6"
    MODEL_AGENT: str = "z-ai/glm-5"
    MODEL_BUDGET: str = "google/gemini-3.1-pro-preview"

    # Embedding
    EMBEDDING_MODEL: str = "baai/bge-m3"
    EMBEDDING_DIMENSIONS: int = 1024

    # Frontend URL (CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    # OAuth Providers
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # Error Tracking
    SENTRY_DSN: str = ""

    @property
    def ALLOWED_MODEL_IDS(self) -> list[str]:
        return [self.MODEL_QUALITY, self.MODEL_AGENT, self.MODEL_BUDGET]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
