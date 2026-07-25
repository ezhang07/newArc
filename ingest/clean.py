"""
clean.py -- turn the raw Tenrai JSON pages into one tidy table.

Reads every data/raw/page_*.json, pulls out the fields we need (schema is in
ingest/README.md), drops junk rows, and writes data/anime.parquet plus a small
CSV sample you can open to eyeball the result.

Usage:
    python ingest/clean.py
"""

import json
from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
OUT_FILE = Path(__file__).resolve().parent.parent / "data" / "anime.parquet"

JUNK_TYPES = {"Music", "PV", "CM"}

# extracts the necessary information from fields that are in form of arrays
def names(items: list) -> list:

    res = []
    if not items:
        return res
    
    for item in items:
        if not item["name"]:
            continue
        res.append(item["name"])

    return res

# --- YOUR PART 2: extract one raw anime object into a flat row ---------------
def to_row(a: dict) -> dict:

    res = {}
    res["mal_id"] = a["mal_id"]
    res["title"] = a["title_english"] or a["title"]
    res["type"] = a.get("type")
    res["genres"] = names(a.get("genres"))
    res["themes"] = names(a.get("themes"))
    res["demographics"] = names(a.get("demographics"))
    res["studios"] = names(a.get("studios"))
    res["synopsis"] = a.get("synopsis") or ""
    res["score"] = a.get("score")
    res["members"] = a.get("members")
    res["year"] = a.get("year")
    res["image_url"] = (a.get("images") or {}).get("jpg", {}).get("image_url")
    return res

# --- Provided: load raw pages, assemble, clean, save -------------------------
def main() -> None:
    rows = []

    # put all pages into one array 
    for page_file in sorted(RAW_DIR.glob("page_*.json")):
        data = json.loads(page_file.read_text(encoding="utf-8"))
        for anime in data["data"]:
            rows.append(to_row(anime))

    # convert all rows into a db, each anime is a row, every column is a trait
    df = pd.DataFrame(rows)
    before = len(df)

    # drop duplicate id
    df = df.drop_duplicates("mal_id")

    # keep rows whose type is not junk
    df = df[~df["type"].isin(JUNK_TYPES)]

    # check if an anime has > 1 theme or genre. if not, drop it
    df = df[df["genres"].map(len) + df["themes"].map(len) > 0].reset_index(drop=True)

    df.to_parquet(OUT_FILE) # add filtered animes to parquet
    df.head(30).to_csv(OUT_FILE.with_name("anime_sample.csv"), index=False) # preview
    print(f"{before} raw rows -> {len(df)} clean rows")
    print(f"wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
