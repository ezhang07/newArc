// One place for all calls to the FastAPI backend.
// The types mirror the Pydantic schemas in api/schemas.py.

const API_BASE = "http://localhost:8000"

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
    { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ liked, top_n: 12})})
  
  if (!res.ok) {
    throw new Error(`recommendations  failed (${res.status})`)
  }

  const data = await res.json()
  
  return data.recommendations
  
}
