from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    # The anime titles the user says they liked. This is what the frontend POSTs.
    liked: list[str] = Field(..., min_length=1, description="Titles the user liked.")
    # How many recommendations to return. Defaults to 10 if the client omits it.
    top_n: int = Field(10, ge=1, le=50, description="How many recs to return.")


class Recommendation(BaseModel):
    title: str
    score: float
    mal_id: int
    image_url: str | None = None


class RecommendResponse(BaseModel):
    recommendations: list[Recommendation]


class AnimeHit(BaseModel):
    title: str
    mal_id: int
    image_url: str | None = None


class SearchResponse(BaseModel):
    results: list[AnimeHit]
