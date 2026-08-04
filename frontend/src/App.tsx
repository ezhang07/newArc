import { CoordinateField } from "@/components/CoordinateField"
import { TasteInput } from "@/components/TasteInput"
import { getRecommendations, getRefreshedRecs, type Recommendation } from "./lib/api"
import { useState, useEffect, useRef } from "react";
import { ResultsGrid } from "./components/ResultsGrid";

function App() {

  const [results, setResults] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRefresh, setLoadingRefresh] = useState(false)
  // true once refresh walks past the last available match, so the button can
  // stop offering more and tell the user they've reached the end.
  const [reachedEnd, setReachedEnd] = useState(false)


  const resultsRef = useRef<HTMLDivElement>(null)

  const likedRef = useRef<string[]>([])
  const offsetRef = useRef(0)



  async function handleRecommend(liked: string[]) {
    likedRef.current = liked;
    offsetRef.current = 0;
    setReachedEnd(false);   // fresh search -> we're back at the top of the list
    setLoading(true);
    try {
      const recommendations = await getRecommendations(liked);
      setResults(recommendations);
    } finally {
      setLoading(false)
    }

  }

  async function handleRefresh() {
    // Look one page further down, but don't commit the offset until we know
    // there was actually something there.
    const nextOffset = offsetRef.current + 12;
    setLoadingRefresh(true);
    try {
      const newRecs = await getRefreshedRecs(likedRef.current, nextOffset)
      if (newRecs.length > 0) {
        setResults(newRecs);
        offsetRef.current = nextOffset;   // only advance on a real page
      } else {
        setReachedEnd(true);              // walked off the end; keep last page shown
      }
    } finally {
      setLoadingRefresh(false);
    }
  }

  // Keep the results (and the "Show me more" button) in view.
  useEffect(() => {
    if (loading) {
      // The moment a search kicks off, glide down to the skeletons (top-aligned).
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    } else if (results.length > 0) {
      // Once the real recs + the button have rendered, re-align to the bottom
      // so the button at the end of the grid is on screen too.
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [loading, results])

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
      </header>

      {/* Hero — the tool is the hero */}
      <main className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-3xl flex-col items-center justify-center px-6 pb-24 text-center">

        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Give us your favourite anime.
          <br />
          We&apos;ll give you <span className="text-signal">your next</span>.
        </h1>

        
        <p className="mt-5 max-w-md text-balance text-muted-foreground">
          newArc plots your taste as a point in space and returns its nearest
          neighbors from 5,000 titles.
        </p>


        <div className="mt-10 flex w-full justify-center">
          <TasteInput onRecommend={handleRecommend} />
        </div>
        
      </main>


      {/* scroll-mt leaves breathing room above the recs when we auto-scroll */}
      <div ref={resultsRef} className="scroll-mt-16">
        <ResultsGrid
          results={results}
          loading={loading}
          onRefresh={handleRefresh}
          refreshing={loadingRefresh}
          reachedEnd={reachedEnd}
        />
      </div>
    </div>
  )
}

export default App
