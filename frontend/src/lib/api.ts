// One place for all calls to the FastAPI backend.
// The types mirror the Pydantic schemas in api/schemas.py.

// In production Vercel injects VITE_API_URL (the Render backend URL) at build time.
// Locally that var is unset, so we fall back to the dev server on :8000.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export type AnimeHit = {
  title: string
  mal_id: number
  image_url: string | null
}

export type Recommendation = {
  title: string
  score: number
  mal_id: number
  image_url: string | null
}

// GET /anime?q=... -> typeahead search results
export async function searchAnime(q: string): Promise<AnimeHit[]> {
  const res = await fetch(`${API_BASE}/anime?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error(`search failed (${res.status})`)
  const data = await res.json()
  return data.results
}

// POST /recommend -> recommendations for the liked titles
// TODO(you): implement. Mirror searchAnime above, but it's a POST:
//   - fetch(`${API_BASE}/recommend`, { method, headers, body })
//   - method: "POST"
//   - headers: { "Content-Type": "application/json" }   (tells the server we're sending JSON)
//   - body: JSON.stringify({ liked, top_n: 12 })          (must match RecommendRequest)
//   - check res.ok, then read res.json() and return data.recommendations
export async function getRecommendations(liked: string[]): Promise<Recommendation[]> {
  const res = await fetch(`${API_BASE}/recommend`, 
    { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ liked, top_n: 12, offset: 0})})
  
  if (!res.ok) {
    throw new Error(`recommendations  failed (${res.status})`)
  }

  const data = await res.json()
  
  return data.recommendations
  
}

// only diff is the offset param, which is passed to backend to get new recs
export async function getRefreshedRecs(liked: string[], offset: number): Promise<Recommendation[]> {
  const res = await fetch(`${API_BASE}/recommend`,
    { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({liked, top_n: 12, offset})})

    if (!res.ok) {
      throw new Error(`refresh recommendations failed (${res.status})`)
    }

    const data = await res.json()
    return data.recommendations
}