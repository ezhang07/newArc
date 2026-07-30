import { CoordinateField } from "@/components/CoordinateField"
import { TasteInput } from "@/components/TasteInput"
import { getRecommendations, type Recommendation } from "./lib/api"
import { useState } from "react";
import { ResultsGrid } from "./components/ResultsGrid";

function App() {

  const [results, setResults] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)

  async function handleRecommend(liked: string[]) {
    setLoading(true);
    try {
      const recommendations = await getRecommendations(liked);
      setResults(recommendations);
    } finally {
      setLoading(false)
    }
    
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Signature backdrop: faint taste-space, masked so it fades into the ink */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_42%,black,transparent)]">
        <CoordinateField />
      </div>

      {/* Top bar */}
      <header className="relative flex items-center justify-between px-6 py-5">
        <span className="font-display text-lg font-semibold tracking-tight">
          new<span className="text-signal">Arc</span>
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          v0.1 · 4,812 titles
        </span>
      </header>

      {/* Hero — the tool is the hero */}
      <main className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-3xl flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Content-based recommender
        </p>

        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Name a few anime
          <br />
          you love.
        </h1>

        <p className="mt-5 max-w-md text-balance text-muted-foreground">
          newArc plots your taste as a point in space and returns its nearest
          neighbors from 4,812 titles.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <TasteInput onRecommend={handleRecommend} />
        </div>
      </main>

      <ResultsGrid results={results} loading={loading} />
    </div>
  )
}

export default App
