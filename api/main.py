from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .recommender import build_recommender
from .schemas import RecommendRequest, RecommendResponse, SearchResponse

# A tiny place to stash the one loaded Recommender for the app's lifetime.
state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # runs ONCE, when the server boots to build the item matrix
    state["recommender"] = build_recommender()
    yield
    state.clear()


app = FastAPI(title="newArc recommender", lifespan=lifespan)

# Let the React dev server (a different origin) call this API from the browser.
# Regex allows any localhost port, since Vite picks a free one (5173, 5174, ...).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Cheap liveness check -- handy for deploy platforms and debugging."""
    return {"status": "ok"}


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    # PER-REQUEST path: only the cheap taste-vector + similarity work happens here.
    recs = state["recommender"].recommend(req.liked, req.top_n)
    return {"recommendations": recs}


@app.get("/anime", response_model=SearchResponse)
def anime_search(q: str = "", limit: int = 10):
    # Typeahead search: returns catalog anime whose title matches `q`.
    return {"results": state["recommender"].search(q, limit)}
