# newArc

**An anime recommender.** Tell it a few anime you liked, and it returns a ranked list of anime you'll probably like too — based on the *content* of each show, not on what other users watched.

🔗 **Live demo:** [new-arc-omega.vercel.app](https://new-arc-omega.vercel.app)

---

## How it works

newArc is a **content-based recommender** built on **vector similarity**. The core idea: represent every anime as a point in a vector space, represent *your taste* as a point in that same space, and return the anime sitting closest to you.

**1. Every anime becomes a vector.**
All ~5k titles were fetched and cleaned from the [Tenrai API](https://tenrai.moe), leaving **4,812 titles** after dropping junk types and entries with no tags. Each anime is encoded as a **73-dimensional multi-hot vector** over the full vocabulary of genres and themes — a `1` in a slot means the anime has that tag, `0` means it doesn't. This gives every title a fixed position in a shared 73-dimensional space.

**2. Your taste becomes a vector.**1
When you submit the anime you liked, we look up each one's vector and average them together. That mean vector is your **taste vector** — a single point representing the center of gravity of what you enjoy.

**3. Cosine similarity finds your neighbors.**
We score every anime by the **cosine similarity** between its vector and your taste vector — essentially, *how small is the angle between them?* A small angle (score near 1) means the anime points in the same direction as your taste; a large angle means it's unrelated. We sort all 4,812 titles by this score and return the top matches, skipping anything you already listed.

**4. Refresh walks further down the list.**
The "Refresh" button doesn't re-run the model — it just walks further down the already-ranked list, so you can keep exploring past the top results.

---

## Tech stack

| Layer | Tech |
|---|---|
| **ML / API** | Python, FastAPI, NumPy, pandas |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Data** | Tenrai API → cleaned to a Parquet file (`data/anime.parquet`) |
| **Deploy** | Frontend on Vercel, backend on Render |

---

## Project structure

```
newArc/
├── .github/
│   └── workflows/
│       └── keep-warm.yml   # cron pings the backend so Render's free tier doesn't cold-start
├── ingest/
│   ├── fetch.py          # pull raw anime pages from the Tenrai API
│   └── clean.py          # clean + filter -> data/anime.parquet (4,812 rows)
├── api/
│   ├── main.py           # FastAPI app + routes; builds the index once at startup
│   ├── vectorizer.py     # genres + themes -> 73-dim multi-hot vectors
│   ├── recommender.py    # taste vector, cosine similarity, ranking
│   └── schemas.py        # Pydantic request/response models
├── frontend/             # Vite + React + TS UI (search, pick, recommend, refresh)
├── notebooks/
│   └── 01_prototype.ipynb  # Phase 1 recommender prototyped before wiring into the API
└── data/
    ├── raw/              # raw JSON pages from Tenrai
    └── anime.parquet     # cleaned catalog (committed so the server has its data)
```

## Running locally

**Backend** (from the repo root):
```bash
pip install -r requirements.txt
uvicorn api.main:app --reload      # serves on http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                        # serves on http://localhost:5173
```
The frontend talks to `http://localhost:8000` by default; in production the API URL is injected via `VITE_API_URL`.

**Rebuilding the catalog** (optional — the Parquet is already committed):
```bash
python ingest/fetch.py             # pull raw pages into data/raw/
python ingest/clean.py             # clean -> data/anime.parquet
```

---

## Deployment

The frontend is deployed on **Vercel** and the FastAPI backend on **Render**'s free tier. Render spins a free service down after ~15 minutes of inactivity, so the next visitor would otherwise pay a ~50-second cold start while it boots back up.

To keep the live demo responsive, a scheduled **GitHub Action** (`.github/workflows/keep-warm.yml`) pings the backend's `/health` endpoint every 10 minutes, so the service never idles long enough to sleep. It runs around the clock and stays within Render's free monthly instance-hour budget.

---

## Roadmap

Phase 1 (above) is live end-to-end. Next up is **Phase 2 — the real ML**, which swaps *only* the vector-generation step while keeping the ranking logic and API contract identical:

- **Dense embeddings** — replace multi-hot genre/theme vectors with sentence-transformer embeddings of each anime's synopsis, for richer semantic similarity.
- **Feedback loop** — thumbs up/down nudges your taste vector toward or away from a title, so the next recommendation adapts to you.
- **Explainability** — surface *why* an anime was recommended (shared tags, closest liked title) read directly off the vectors — no LLM in the loop.
- **Semantic search, filters, and a diversity slider.**

---

*Solo portfolio project. Built to learn the ML end-to-end, not to wrap someone else's model.*
