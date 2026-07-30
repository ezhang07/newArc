import { useEffect, useState } from "react"
import { MagnifyingGlassIcon, XIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { searchAnime, type AnimeHit } from "@/lib/api"

type Props = {
  onRecommend: (liked: string[]) => void
}

export function TasteInput({ onRecommend }: Props) {
  const [query, setQuery] = useState("")
  const [picks, setPicks] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<AnimeHit[]>([])

  // Debounced live search: wait 200ms after the last keystroke before calling
  // the API, so typing "death" fires one request instead of five. Each keystroke
  // cancels the previous pending timer via the cleanup function.
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const hits = await searchAnime(q)
        setSuggestions(hits.filter((h) => !picks.includes(h.title)))
      } catch {
        setSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query, picks])

  function addPick(title: string) {
    setPicks((prev) => [...prev, title])
    setQuery("")
    setSuggestions([])
  }

  function removePick(title: string) {
    setPicks((prev) => prev.filter((t) => t !== title))
  }

  
  return (
    <div className="w-full max-w-xl">
      {/* Search field */}
      <div className="relative">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/80 px-4 py-3 backdrop-blur focus-within:border-signal/60 focus-within:ring-2 focus-within:ring-signal/20 transition-colors">
          <MagnifyingGlassIcon size={18} weight="bold" className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) addPick(suggestions[0].title)
            }}
            placeholder="Search an anime you love…"
            aria-label="Search for an anime you like"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 outline-none"
          />
        </div>

        {/* Typeahead dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            {suggestions.map((h) => (
              <li key={h.mal_id}>
                <button
                  type="button"
                  onClick={() => addPick(h.title)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-popover-foreground hover:bg-accent transition-colors"
                >
                  {h.image_url && (
                    <img
                      src={h.image_url}
                      alt=""
                      className="h-9 w-6 shrink-0 rounded object-cover"
                    />
                  )}
                  {h.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Picks as chips */}
      {picks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {picks.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 py-1 pl-3 pr-1.5 text-sm text-foreground"
            >
              {t}
              <button
                type="button"
                onClick={() => removePick(t)}
                aria-label={`Remove ${t}`}
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-signal/20 hover:text-foreground transition-colors"
              >
                <XIcon size={12} weight="bold" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-6">
        <Button
          size="lg"
          disabled={picks.length === 0}
          onClick={() => onRecommend(picks)}
          className="group gap-2"
        >
          Recommend
          <ArrowRightIcon
            size={18}
            weight="bold"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Button>
        {picks.length === 0 && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            add at least one anime to begin
          </p>
        )}
      </div>
    </div>
  )
}
