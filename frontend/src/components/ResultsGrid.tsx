import { Button } from "@/components/ui/button"
import type { Recommendation } from "@/lib/api"

type Props = {
  results: Recommendation[]
  loading: boolean
  onRefresh: () => void
  refreshing: boolean
  reachedEnd: boolean
}

export function ResultsGrid({
  results,
  loading,
  onRefresh,
  refreshing,
  reachedEnd,
}: Props) {
  // Nothing requested yet, and not loading -> render nothing.
  if (!loading && results.length === 0) return null

  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 pb-24">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Nearest neighbors
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {loading
          ? // Skeleton placeholders while the request is in flight
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-lg bg-card" />
                <div className="mt-2 h-3 w-3/4 rounded bg-card" />
              </div>
            ))
          : results.map((rec) => <ResultCard key={rec.mal_id} rec={rec} />)}
      </div>

      {/* Refresh: walk further down the same ranked list. Hidden during the
          initial skeleton load; disabled once we've reached the end. */}
      {!loading && results.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onRefresh}
            disabled={refreshing || reachedEnd}
            className="text-sm font-medium"
          >
            <RefreshIcon spinning={refreshing} />
            Show me more
          </Button>
        </div>
      )}
    </section>
  )
}

// lucide "refresh-cw" glyph, inlined so we don't pull in an icon dependency.
// Spins while a refresh request is in flight.
function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

function ResultCard({ rec }: { rec: Recommendation }) {
  const pct = Math.round(rec.score * 100)

  return (
    <div className="group">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-card">
        {rec.image_url ? (
          <img
            src={rec.image_url}
            alt={rec.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
            {rec.title}
          </div>
        )}

        {/* Match score — the amber "signal" reading off the vectors */}
        <span className="absolute right-1.5 top-1.5 rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-signal backdrop-blur">
          {pct}%
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-snug text-foreground">
        {rec.title}
      </p>
    </div>
  )
}
