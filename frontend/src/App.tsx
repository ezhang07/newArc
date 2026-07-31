import { CoordinateField } from "@/components/CoordinateField"
import { TasteInput } from "@/components/TasteInput"
import { getRecommendations, type Recommendation } from "./lib/api"
import { useState, useEffect, useRef } from "react";
import { ResultsGrid } from "./components/ResultsGrid";

function App() {

  const [results, setResults] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  async function handleRecommend(liked: string[]) {
    setLoading(true);
    try {
      const recommendations = await getRecommendations(liked);
      setResults(recommendations);
    } finally {
      setLoading(false)
    }

  }

  // When a recommendation kicks off, glide down to the results so the user
  // lands on the recs (they appear the moment loading flips true, as skeletons).
  useEffect(() => {
    if (loading) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [loading])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Signature backdrop: the taste-space vector web, pinned to the viewport
          (fixed, not absolute) so it never resizes/reflows when results appear. */}
      <div className="fixed inset-0">
        <CoordinateField />
      </div>

      {/* Top bar */}
      <header className="relative flex items-center justify-between px-6 py-5">
        <span className="font-display text-xl font-bold tracking-tight">
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

        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Give us your favourite anime.
          <br />
          We&apos;ll give you <span className="text-signal">your next</span>.
        </h1>

        <p className="mt-5 max-w-md text-balance text-muted-foreground">
          newArc plots your taste as a point in space and returns its nearest
          neighbors from 4,812 titles.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <TasteInput onRecommend={handleRecommend} />
        </div>
      </main>

      {/* scroll-mt leaves breathing room above the recs when we auto-scroll */}
      <div ref={resultsRef} className="scroll-mt-16">
        <ResultsGrid results={results} loading={loading} />
      </div>
    </div>
  )
}

export default App
