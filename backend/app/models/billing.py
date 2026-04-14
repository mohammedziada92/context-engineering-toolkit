from pydantic import BaseModel, Field


class NotifyInterestRequest(BaseModel):
    email: str = Field(..., min_length=1)
    plan: str = Field(default="pro")
